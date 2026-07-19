import crypto from 'node:crypto'
import { REWARD_TABLES, selectWeightedReward } from './_rewards.js'
import { localDateKey } from './_progressionRules.js'
import { appendCoinTransaction } from './_coinLedger.js'

export const DAILY_LOGIN_REWARDS = Object.freeze([5, 10, 15, 20, 25, 50, 50])

function safeId(value, label) {
  if (!/^[a-z0-9][a-z0-9:_-]{0,127}$/i.test(String(value ?? ''))) throw Object.assign(new Error(`Invalid ${label}`), { status: 400 })
  return String(value)
}

export function dailyLoginClaimId(playerId, dateKey) {
  return safeId(`daily-login:${safeId(playerId, 'player id')}:${safeId(dateKey, 'local date')}`, 'daily login claim id')
}

export function secureWeightedReward(table = REWARD_TABLES.dailyWheelV1) {
  const value = crypto.randomInt(0, 0x100000000) / 0x100000000
  return selectWeightedReward(table, value)
}

export async function applyReward(client, { playerId, transactionId, source, reward, metadata = {} }) {
  const id = safeId(transactionId, 'transaction id')
  const existing = await client.query(`SELECT player_id FROM fo_player_transactions WHERE transaction_id=$1`, [id])
  if (existing.rowCount) {
    if (String(existing.rows[0].player_id) !== String(playerId)) throw Object.assign(new Error('Transaction belongs to another account'), { status: 403 })
    return { applied: false, duplicate: true, transactionId: id }
  }
  const currencyId = reward.currencyId ?? null
  const itemId = reward.itemId ?? null
  const amount = Number(reward.amount)
  if (Boolean(currencyId) === Boolean(itemId) || !Number.isSafeInteger(amount) || amount === 0) throw Object.assign(new Error('Invalid reward'), { status: 400 })
  const table = currencyId ? 'fo_player_balances' : 'fo_player_inventory'
  const key = currencyId ? 'currency_id' : 'item_id'
  const value = currencyId ? 'balance' : 'quantity'
  const target = safeId(currencyId ?? itemId, 'reward target')
  if (currencyId === 'coins') {
    if (amount > 0 && source !== 'market-sale') throw Object.assign(new Error('Gameplay cannot create premium Coins'), { status: 403, code: 'COIN_CREATION_UNAUTHORISED' })
    return appendCoinTransaction(client, {
      transactionId: id,
      accountId: playerId,
      amount,
      transactionType: source === 'market-sale' ? 'exchange-settlement' : source,
      sourceReferenceId: String(metadata.sourceReferenceId ?? metadata.matchId ?? id),
      metadata,
    })
  }
  await client.query(`INSERT INTO ${table}(player_id,${key},${value}) VALUES($1,$2,0) ON CONFLICT DO NOTHING`, [playerId, target])
  const updated = await client.query(`UPDATE ${table} SET ${value}=${value}+$3,updated_at=NOW() WHERE player_id=$1 AND ${key}=$2 AND ${value}+$3>=0 RETURNING ${value}`, [playerId, target, amount])
  if (!updated.rowCount) throw Object.assign(new Error('Insufficient balance or quantity'), { status: 409 })
  await client.query(`INSERT INTO fo_player_transactions(transaction_id,player_id,source,item_id,currency_id,amount,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, playerId, source, itemId, currencyId, amount, metadata])
  return { applied: true, duplicate: false, transactionId: id, value: Number(updated.rows[0][value]) }
}

export async function enforceRateLimit(client, { playerId, action, limit = 30, windowSeconds = 60 }) {
  const windowMs = windowSeconds * 1000
  const start = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const result = await client.query(`INSERT INTO fo_rate_limits(player_id,action,window_start,request_count) VALUES($1,$2,$3,1) ON CONFLICT(player_id,action,window_start) DO UPDATE SET request_count=fo_rate_limits.request_count+1 RETURNING request_count`, [playerId, action, start])
  if (Number(result.rows[0].request_count) > limit) throw Object.assign(new Error('Too many requests'), { status: 429, code: 'RATE_LIMITED' })
}

export async function claimDailyWheel(db, { playerId, spinType, timeZone = 'UTC', advertCompletionId, requestId }) {
  if (!['free', 'advert', 'coins'].includes(spinType)) throw Object.assign(new Error('Invalid spin type'), { status: 400 })
  const dateKey = localDateKey(new Date(), timeZone)
  const actionType = `wheel:${spinType}`
  const transactionId = `wheel:${spinType}:${dateKey}`
  if (requestId && safeId(requestId, 'request id') !== transactionId) throw Object.assign(new Error('Request id does not match daily entitlement'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'wheel', limit: 12 })
    const existing = await client.query(`SELECT reward FROM fo_reward_claims WHERE claim_id=$1 AND player_id=$2`, [transactionId, playerId])
    if (existing.rowCount) { await client.query('COMMIT'); return { duplicate: true, transactionId, reward: existing.rows[0].reward, localDate: dateKey } }
    if (spinType === 'advert') {
      const advert = await client.query(`DELETE FROM fo_advert_completions WHERE completion_id=$1 AND player_id=$2 AND placement='daily-wheel' RETURNING completion_id`, [advertCompletionId, playerId])
      if (!advert.rowCount) throw Object.assign(new Error('Verified advert completion required'), { status: 403, code: 'ADVERT_NOT_VERIFIED' })
    }
    const daily = await client.query(`INSERT INTO fo_daily_actions(player_id,local_date,action_type,transaction_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING transaction_id`, [playerId, dateKey, actionType, transactionId])
    if (!daily.rowCount) throw Object.assign(new Error('Daily spin already used'), { status: 409, code: 'DAILY_LIMIT' })
    if (spinType === 'coins') await applyReward(client, { playerId, transactionId: `${transactionId}:cost`, source: 'wheel-cost', reward: { currencyId: 'coins', amount: -Number(process.env.WHEEL_COIN_COST ?? 25) } })
    const reward = secureWeightedReward()
    await applyReward(client, { playerId, transactionId, source: 'daily-wheel', reward, metadata: { rewardTableId: reward.tableId, spinType, localDate: dateKey } })
    await client.query(`INSERT INTO fo_reward_claims(claim_id,player_id,claim_type,reward_table_id,reward,local_date) VALUES($1,$2,'daily-wheel',$3,$4,$5)`, [transactionId, playerId, reward.tableId, reward, dateKey])
    await client.query('COMMIT')
    return { duplicate: false, transactionId, reward, localDate: dateKey }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function getDailyLoginStatus(db, { playerId, timeZone = 'UTC' }) {
  const today = localDateKey(new Date(), timeZone)
  const yesterday = localDateKey(new Date(Date.now() - 86400000), timeZone)
  const claimId = dailyLoginClaimId(playerId, today)
  const [prior, streakRow] = await Promise.all([
    db.query(`SELECT reward FROM fo_reward_claims WHERE claim_id=$1 AND player_id=$2`, [claimId, playerId]),
    db.query(`SELECT current_count,last_date::text AS last_date FROM fo_player_streaks WHERE player_id=$1 AND streak_type='daily-login'`, [playerId]),
  ])
  const old = streakRow.rows[0]
  const nextStreak = old?.last_date === yesterday ? Math.min(Number(old.current_count) + 1, 7) : 1
  return {
    available: prior.rowCount === 0,
    localDate: today,
    currentStreak: Number(old?.current_count ?? 0),
    nextStreak,
    nextReward: { currencyId: 'stars', amount: DAILY_LOGIN_REWARDS[nextStreak - 1] * 10 },
  }
}

export async function claimDailyLogin(db, { playerId, timeZone = 'UTC' }) {
  const today = localDateKey(new Date(), timeZone)
  const yesterday = localDateKey(new Date(Date.now() - 86400000), timeZone)
  const claimId = dailyLoginClaimId(playerId, today)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'daily-login', limit: 8 })
    const prior = await client.query(`SELECT reward FROM fo_reward_claims WHERE claim_id=$1 AND player_id=$2`, [claimId, playerId])
    if (prior.rowCount) { await client.query('COMMIT'); return { duplicate: true, claimId, reward: prior.rows[0].reward } }
    const streakRow = await client.query(`SELECT current_count,last_date::text AS last_date FROM fo_player_streaks WHERE player_id=$1 AND streak_type='daily-login' FOR UPDATE`, [playerId])
    const old = streakRow.rows[0]
    const streak = old?.last_date === yesterday ? Math.min(Number(old.current_count) + 1, 7) : 1
    const reward = { currencyId: 'stars', amount: DAILY_LOGIN_REWARDS[streak - 1] * 10 }
    await applyReward(client, { playerId, transactionId: claimId, source: 'daily-login', reward, metadata: { localDate: today, streak } })
    await client.query(`INSERT INTO fo_reward_claims(claim_id,player_id,claim_type,reward,local_date) VALUES($1,$2,'daily-login',$3,$4)`, [claimId, playerId, reward, today])
    await client.query(`INSERT INTO fo_player_streaks(player_id,streak_type,current_count,best_count,last_date) VALUES($1,'daily-login',$2,$2,$3) ON CONFLICT(player_id,streak_type) DO UPDATE SET current_count=$2,best_count=GREATEST(fo_player_streaks.best_count,$2),last_date=$3,updated_at=NOW()`, [playerId, streak, today])
    await client.query('COMMIT')
    return { duplicate: false, claimId, reward, streak }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}
