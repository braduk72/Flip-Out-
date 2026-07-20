import crypto from 'node:crypto'
import { appendCoinTransaction } from './_coinLedger.js'
import { applyReward, enforceRateLimit, secureWeightedReward } from './_gameServices.js'
import { REWARD_TABLES } from './_rewards.js'
import { ITEM_BY_ID } from '../src/data/itemCatalog.js'

export const REWARD_THEATRE_TABLE = REWARD_TABLES.rewardTheatreV1
export const REWARD_THEATRE_INTERVAL = 5
export const REWARD_THEATRE_MAX_MATCH3_LEVEL = 20

const SYMBOLS = Object.freeze([
  { id: 'coins-10', kind: 'coins', label: '10 Coins', reward: { currencyId: 'coins', amount: 10 } },
  { id: 'coins-25', kind: 'coins', label: '25 Coins', reward: { currencyId: 'coins', amount: 25 } },
  { id: 'hammer', kind: 'powerup', label: 'Hammer', reward: { itemId: 'powerup:match3-hammer', amount: 1 } },
  { id: 'shuffle', kind: 'powerup', label: 'Shuffle', reward: { itemId: 'powerup:match3-shuffle', amount: 1 } },
  { id: 'line-blast', kind: 'powerup', label: 'Line Blast', reward: { itemId: 'powerup:match3-line-blast', amount: 1 } },
  { id: 'themed-booster', kind: 'booster', label: 'Themed Booster', reward: { itemId: 'booster:themed', amount: 1 } },
  { id: 'random-booster', kind: 'booster', label: 'Random Booster', reward: { itemId: 'booster:random', amount: 1 } },
])

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i

function safeId(value, label = 'id') {
  const id = String(value ?? '')
  if (!SAFE_ID.test(id)) throw Object.assign(new Error(`Invalid ${label}`), { status: 400 })
  return id
}

function normaliseCompletedLevels(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

export function completedMatch3LevelCount(completedLevels) {
  return Object.keys(normaliseCompletedLevels(completedLevels)).filter(level => Number.isSafeInteger(Number(level)) && Number(level) > 0).length
}

export function rewardTheatreClaimId(playerId, milestone) {
  const level = Number(milestone)
  if (!Number.isSafeInteger(level) || level < REWARD_THEATRE_INTERVAL || level > REWARD_THEATRE_MAX_MATCH3_LEVEL || level % REWARD_THEATRE_INTERVAL !== 0) {
    throw Object.assign(new Error('Invalid Reward Theatre milestone'), { status: 400, code: 'REWARD_THEATRE_INVALID_MILESTONE' })
  }
  return safeId(`reward-theatre:${safeId(playerId, 'player id')}:match3:${level}`, 'reward theatre claim id')
}

export function nextRewardTheatreMilestone({ completedLevels = {}, claimedMilestones = [] } = {}) {
  const complete = completedMatch3LevelCount(completedLevels)
  const claimed = new Set(claimedMilestones.map(Number))
  for (let milestone = REWARD_THEATRE_INTERVAL; milestone <= REWARD_THEATRE_MAX_MATCH3_LEVEL; milestone += REWARD_THEATRE_INTERVAL) {
    if (complete >= milestone && !claimed.has(milestone)) return milestone
  }
  return null
}

export async function getPendingRewardTheatre(db, { playerId }) {
  const [progress, claims] = await Promise.all([
    db.query(`SELECT completed_levels FROM fo_match3_progress WHERE player_id=$1`, [playerId]),
    db.query(`SELECT reward->>'milestone' AS milestone FROM fo_reward_claims WHERE player_id=$1 AND claim_type='reward-theatre'`, [playerId]).catch(() => ({ rows: [] })),
  ])
  const completedLevels = progress.rows[0]?.completed_levels ?? {}
  const milestone = nextRewardTheatreMilestone({ completedLevels, claimedMilestones: claims.rows.map(row => row.milestone).filter(Boolean) })
  return milestone ? { available: true, milestone, claimId: rewardTheatreClaimId(playerId, milestone), rewardTableId: REWARD_THEATRE_TABLE.id } : { available: false }
}

function rewardKey(reward) {
  if (reward.currencyId) return `${reward.currencyId}:${reward.amount}`
  return `${reward.itemId}:${reward.amount}`
}

function symbolForReward(reward) {
  const key = rewardKey(reward)
  return SYMBOLS.find(symbol => rewardKey(symbol.reward) === key) ?? { id: key.replaceAll(':', '-'), kind: reward.currencyId ?? 'item', label: rewardLabel(reward), reward }
}

export function rewardLabel(reward) {
  if (reward.currencyId) return `${Number(reward.amount).toLocaleString()} ${reward.currencyId === 'coins' ? 'Coins' : reward.currencyId}`
  const item = ITEM_BY_ID.get(reward.itemId)
  return `${Number(reward.amount) > 1 ? `${reward.amount} × ` : ''}${item?.name ?? reward.itemId}`
}

function seededIndex(seed, max) {
  const hash = crypto.createHash('sha256').update(seed).digest()
  return hash.readUInt32BE(0) % max
}

export function buildRewardTheatrePresentation({ claimId, reward, milestone }) {
  const target = symbolForReward(reward)
  const reels = Array.from({ length: 3 }, (_, reelIndex) => {
    const offset = seededIndex(`${claimId}:reel:${reelIndex}`, SYMBOLS.length)
    const decoys = Array.from({ length: 8 }, (_, symbolIndex) => SYMBOLS[(offset + symbolIndex + reelIndex) % SYMBOLS.length])
    return { reel: reelIndex + 1, symbols: [...decoys, target], targetIndex: decoys.length }
  })
  return {
    type: 'animated-reels',
    skin: 'classic',
    milestone,
    label: rewardLabel(reward),
    reward,
    reels,
    durationMs: 2200,
  }
}

async function applyRewardTheatrePrize(client, { playerId, claimId, milestone, reward }) {
  if (reward.currencyId === 'coins') {
    return appendCoinTransaction(client, {
      accountId: playerId,
      transactionId: claimId,
      amount: Number(reward.amount),
      transactionType: 'promotional-grant',
      sourceReferenceId: claimId,
      metadata: { source: 'reward-theatre', milestone, rewardTableId: reward.tableId },
      allowCreation: true,
    })
  }
  return applyReward(client, {
    playerId,
    transactionId: claimId,
    source: 'reward-theatre',
    reward,
    metadata: { milestone, rewardTableId: reward.tableId },
  })
}

export async function claimRewardTheatre(db, { playerId, milestone: requestedMilestone }) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'reward-theatre', limit: 12 })
    const requestedClaimId = requestedMilestone ? rewardTheatreClaimId(playerId, Number(requestedMilestone)) : null
    if (requestedClaimId) {
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [requestedClaimId])
      const alreadyClaimed = await client.query(`SELECT reward FROM fo_reward_claims WHERE claim_id=$1 AND player_id=$2 AND claim_type='reward-theatre'`, [requestedClaimId, playerId])
      if (alreadyClaimed.rowCount) {
        const reward = alreadyClaimed.rows[0].reward
        await client.query('COMMIT')
        return { duplicate: true, claimId: requestedClaimId, milestone: Number(requestedMilestone), reward, presentation: buildRewardTheatrePresentation({ claimId: requestedClaimId, reward, milestone: Number(requestedMilestone) }) }
      }
    }
    const progress = await client.query(`SELECT completed_levels FROM fo_match3_progress WHERE player_id=$1 FOR UPDATE`, [playerId])
    const claims = await client.query(`SELECT reward->>'milestone' AS milestone FROM fo_reward_claims WHERE player_id=$1 AND claim_type='reward-theatre' FOR UPDATE`, [playerId]).catch(() => ({ rows: [] }))
    const milestone = nextRewardTheatreMilestone({ completedLevels: progress.rows[0]?.completed_levels ?? {}, claimedMilestones: claims.rows.map(row => row.milestone).filter(Boolean) })
    if (!milestone) throw Object.assign(new Error('No Reward Theatre milestone is available'), { status: 409, code: 'REWARD_THEATRE_NOT_AVAILABLE' })
    if (requestedMilestone && Number(requestedMilestone) !== milestone) throw Object.assign(new Error('Reward Theatre milestone is not currently claimable'), { status: 409, code: 'REWARD_THEATRE_MILESTONE_MISMATCH' })
    const claimId = rewardTheatreClaimId(playerId, milestone)
    if (!requestedClaimId) await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [claimId])
    const existing = await client.query(`SELECT reward FROM fo_reward_claims WHERE claim_id=$1 AND player_id=$2`, [claimId, playerId])
    if (existing.rowCount) {
      const reward = existing.rows[0].reward
      await client.query('COMMIT')
      return { duplicate: true, claimId, milestone, reward, presentation: buildRewardTheatrePresentation({ claimId, reward, milestone }) }
    }
    const reward = secureWeightedReward(REWARD_THEATRE_TABLE)
    await applyRewardTheatrePrize(client, { playerId, claimId, milestone, reward })
    const storedReward = { ...reward, milestone }
    await client.query(
      `INSERT INTO fo_reward_claims(claim_id,player_id,claim_type,reward_table_id,reward)
       VALUES($1,$2,'reward-theatre',$3,$4)`,
      [claimId, playerId, REWARD_THEATRE_TABLE.id, storedReward],
    )
    await client.query('COMMIT')
    return { duplicate: false, claimId, milestone, reward: storedReward, presentation: buildRewardTheatrePresentation({ claimId, reward: storedReward, milestone }) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
