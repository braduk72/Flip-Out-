import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import pg from 'pg'
import { claimRewardTheatre, getPendingRewardTheatre } from '../api/_rewardTheatre.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview Reward Theatre claims every fifth Match-3 milestone once', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const player = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`reward-theatre-${suffix}@test.invalid`])
    playerId = player.rows[0].player_id
    const completed = Object.fromEntries(Array.from({ length: 5 }, (_, index) => [String(index + 1), { coins: 10, score: index * 100 }]))
    await pool.query(
      `INSERT INTO fo_match3_progress(player_id,highest_unlocked_level,completed_levels)
       VALUES($1,6,$2)`,
      [playerId, completed],
    )

    const pending = await getPendingRewardTheatre(pool, { playerId })
    assert.equal(pending.available, true)
    assert.equal(pending.milestone, 5)

    const [first, retry] = await Promise.all([
      claimRewardTheatre(pool, { playerId, milestone: 5 }),
      claimRewardTheatre(pool, { playerId, milestone: 5 }),
    ])
    assert.equal([first, retry].filter(result => !result.duplicate).length, 1)
    assert.equal(first.claimId, retry.claimId)
    assert.deepEqual(first.reward, retry.reward)
    assert.equal(first.presentation.reels.length, 3)
    const laterRetry = await claimRewardTheatre(pool, { playerId, milestone: 5 })
    assert.equal(laterRetry.duplicate, true)
    assert.deepEqual(laterRetry.reward, first.reward)

    const claims = await pool.query(`SELECT COUNT(*)::int AS count FROM fo_reward_claims WHERE player_id=$1 AND claim_type='reward-theatre'`, [playerId])
    assert.equal(Number(claims.rows[0].count), 1)
    const after = await getPendingRewardTheatre(pool, { playerId })
    assert.equal(after.available, false)
  } finally {
    await pool.end()
  }
})
