import crypto from 'node:crypto'
import { ITEM_BY_ID } from '../src/data/itemCatalog.js'
import { appendCoinTransaction } from './_coinLedger.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i

export const ACHIEVEMENT_DEFINITIONS = Object.freeze([
  {
    id: 'unicorn-poop',
    name: 'Unicorn Poop',
    description: 'Discover your first Rare Foil card.',
    category: 'collection',
    criteria: { eventType: 'card-obtained', foilTier: 'rare-foil', target: 1 },
    rewards: [],
  },
  {
    id: 'raider-of-the-lost-arc-hive',
    name: 'Raider of the Lost Arc-hive',
    description: 'Open boosters from five different Themes.',
    category: 'boosters',
    criteria: { eventType: 'booster-opened-theme', distinctEventKeys: 5 },
    rewards: [],
  },
])

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENT_DEFINITIONS.map(achievement => [achievement.id, achievement]))

function fail(message, status = 400, code = 'ACHIEVEMENT_INVALID') {
  throw Object.assign(new Error(message), { status, code })
}

function safeId(value, label) {
  const id = String(value ?? '')
  if (!SAFE_ID.test(id)) fail(`Invalid ${label}`)
  return id
}

function normaliseFoilTier(value) {
  return String(value ?? '').toLowerCase().replaceAll('_', '-')
}

function getAchievement(achievementId) {
  const achievement = ACHIEVEMENTS_BY_ID.get(safeId(achievementId, 'achievement id'))
  if (!achievement) fail('Achievement is not defined', 404, 'ACHIEVEMENT_NOT_FOUND')
  return achievement
}

export function achievementFingerprint({ achievementId, trigger = 'manual', metadata = {} }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    achievementId: safeId(achievementId, 'achievement id'),
    trigger: safeId(trigger, 'achievement trigger'),
    metadata,
  })).digest('hex')
}

export function validateAchievementReward(reward) {
  const amount = Number(reward?.amount ?? 1)
  if (!Number.isSafeInteger(amount) || amount < 1) fail('Achievement reward amount must be a positive integer')
  if (reward.currencyId) {
    const currencyId = safeId(reward.currencyId, 'achievement reward currency')
    if (!['coins', 'stars'].includes(currencyId)) fail('Unsupported achievement currency reward', 409, 'ACHIEVEMENT_REWARD_UNSUPPORTED')
    return { currencyId, amount }
  }
  if (reward.itemId) {
    const itemId = safeId(reward.itemId, 'achievement reward item')
    const item = ITEM_BY_ID.get(itemId)
    if (!item) fail('Achievement reward item is not in the catalogue', 404, 'ACHIEVEMENT_REWARD_ITEM_NOT_FOUND')
    return { itemId, amount, itemType: item.type }
  }
  fail('Achievement reward requires a currencyId or itemId')
}

export function achievementProgressFromRows(achievement, events = []) {
  if (achievement.id === 'unicorn-poop') {
    const count = events.filter(event => event.event_type === 'card-obtained' && normaliseFoilTier(event.metadata?.foilTier) === 'rare-foil').length
    return { current: Math.min(count, 1), target: 1, complete: count >= 1 }
  }
  if (achievement.id === 'raider-of-the-lost-arc-hive') {
    const themes = new Set(events.filter(event => event.event_type === 'booster-opened-theme').map(event => event.event_key))
    return { current: Math.min(themes.size, 5), target: 5, complete: themes.size >= 5 }
  }
  return { current: 0, target: 1, complete: false }
}

async function applyAchievementRewards(client, { playerId, achievement, transactionId }) {
  const applied = []
  for (const [index, rawReward] of achievement.rewards.entries()) {
    const reward = validateAchievementReward(rawReward)
    const rewardTransactionId = `${transactionId}:reward:${index + 1}`
    if (reward.currencyId === 'coins') {
      applied.push(await appendCoinTransaction(client, {
        accountId: playerId,
        transactionId: rewardTransactionId,
        amount: reward.amount,
        transactionType: 'promotional-grant',
        sourceReferenceId: transactionId,
        metadata: { achievementId: achievement.id, achievementName: achievement.name },
        allowCreation: true,
      }))
    } else if (reward.currencyId) {
      applied.push(await applyReward(client, {
        playerId,
        transactionId: rewardTransactionId,
        source: 'achievement',
        reward: { currencyId: reward.currencyId, amount: reward.amount },
        metadata: { achievementId: achievement.id },
      }))
    } else {
      applied.push(await applyReward(client, {
        playerId,
        transactionId: rewardTransactionId,
        source: 'achievement',
        reward: { itemId: reward.itemId, amount: reward.amount },
        metadata: { achievementId: achievement.id, itemType: reward.itemType },
      }))
    }
  }
  return applied
}

function unlockReceipt(row, duplicate) {
  return { duplicate, achievementId: row.achievement_id, transactionId: row.transaction_id, rewards: row.rewards ?? [], result: row.result ?? {}, unlockedAt: row.unlocked_at }
}

export async function unlockAchievement(db, { playerId, achievementId, transactionId, trigger = 'manual', metadata = {} }) {
  const achievement = getAchievement(achievementId)
  const id = safeId(transactionId ?? `achievement:${achievement.id}`, 'achievement transaction id')
  const fingerprint = achievementFingerprint({ achievementId: achievement.id, trigger, metadata })
  const ownsConnection = typeof db.connect === 'function' && typeof db.release !== 'function'
  const client = ownsConnection ? await db.connect() : db
  try {
    if (ownsConnection) await client.query('BEGIN')
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`achievement:${playerId}:${achievement.id}`])
    const priorTransaction = await client.query(`SELECT player_id,achievement_id,transaction_id,input_fingerprint,rewards,result,unlocked_at FROM fo_achievement_unlocks WHERE transaction_id=$1`, [id])
    if (priorTransaction.rowCount) {
      const prior = priorTransaction.rows[0]
      if (String(prior.player_id) !== String(playerId)) fail('Achievement transaction belongs to another account', 403, 'ACHIEVEMENT_ACCOUNT_CONFLICT')
      if (prior.achievement_id !== achievement.id || prior.input_fingerprint !== fingerprint) fail('Achievement transaction ID was already used for different input', 409, 'ACHIEVEMENT_IDEMPOTENCY_CONFLICT')
      if (ownsConnection) await client.query('COMMIT')
      return unlockReceipt(prior, true)
    }
    const priorAchievement = await client.query(`SELECT achievement_id,transaction_id,rewards,result,unlocked_at FROM fo_achievement_unlocks WHERE player_id=$1 AND achievement_id=$2`, [playerId, achievement.id])
    if (priorAchievement.rowCount) {
      if (ownsConnection) await client.query('COMMIT')
      return unlockReceipt(priorAchievement.rows[0], true)
    }
    await enforceRateLimit(client, { playerId, action: 'achievement-unlock', limit: 60 })
    const rewards = await applyAchievementRewards(client, { playerId, achievement, transactionId: id })
    const result = { achievementId: achievement.id, name: achievement.name, trigger, rewardCount: rewards.length }
    const inserted = await client.query(
      `INSERT INTO fo_achievement_unlocks(player_id,achievement_id,transaction_id,input_fingerprint,rewards,result,metadata)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING achievement_id,transaction_id,rewards,result,unlocked_at`,
      [playerId, achievement.id, id, fingerprint, achievement.rewards, result, metadata]
    )
    if (ownsConnection) await client.query('COMMIT')
    return unlockReceipt(inserted.rows[0], false)
  } catch (error) {
    if (ownsConnection) await client.query('ROLLBACK')
    throw error
  } finally {
    if (ownsConnection) client.release()
  }
}

export async function recordAchievementEvent(db, { playerId, eventId, eventType, eventKey, metadata = {} }) {
  const id = safeId(eventId, 'achievement event id')
  const type = safeId(eventType, 'achievement event type')
  const key = safeId(eventKey, 'achievement event key')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO fo_achievement_events(event_id,player_id,event_type,event_key,metadata)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING`,
      [id, playerId, type, key, metadata]
    )
    const events = await client.query(`SELECT event_type,event_key,metadata FROM fo_achievement_events WHERE player_id=$1`, [playerId])
    const unlocked = []
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const progress = achievementProgressFromRows(achievement, events.rows)
      if (progress.complete) {
        const result = await unlockAchievement(client, {
          playerId,
          achievementId: achievement.id,
          transactionId: `achievement:${achievement.id}`,
          trigger: type,
          metadata: { eventId: id, eventKey: key },
        })
        if (!result.duplicate) unlocked.push(result)
      }
    }
    await client.query('COMMIT')
    return { eventId: id, duplicate: inserted.rowCount === 0, unlocked }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getAchievementState(db, playerId) {
  const [events, unlocks] = await Promise.all([
    db.query(`SELECT event_type,event_key,metadata,created_at FROM fo_achievement_events WHERE player_id=$1 ORDER BY created_at DESC LIMIT 500`, [playerId]).catch(() => ({ rows: [] })),
    db.query(`SELECT achievement_id,transaction_id,rewards,result,metadata,unlocked_at FROM fo_achievement_unlocks WHERE player_id=$1 ORDER BY unlocked_at DESC`, [playerId]).catch(() => ({ rows: [] })),
  ])
  const unlocked = new Map(unlocks.rows.map(row => [row.achievement_id, row]))
  return {
    definitions: ACHIEVEMENT_DEFINITIONS,
    unlocked: unlocks.rows,
    progress: ACHIEVEMENT_DEFINITIONS.map(achievement => ({
      achievementId: achievement.id,
      ...achievementProgressFromRows(achievement, events.rows),
      unlocked: unlocked.has(achievement.id),
    })),
  }
}

export async function resetAchievements(db, { playerId, achievementId = null }) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (achievementId) {
      const achievement = getAchievement(achievementId)
      await client.query(`DELETE FROM fo_achievement_unlocks WHERE player_id=$1 AND achievement_id=$2`, [playerId, achievement.id])
    } else {
      await client.query(`DELETE FROM fo_achievement_unlocks WHERE player_id=$1`, [playerId])
    }
    await client.query('COMMIT')
    return { reset: achievementId ?? 'all' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
