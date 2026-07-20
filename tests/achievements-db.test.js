import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { getAchievementState, recordAchievementEvent, resetAchievements, unlockAchievement } from '../api/_achievements.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview achievements persist unlocks, events, retries and resets', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const player = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`achievement-${suffix}@test.invalid`])
    playerId = player.rows[0].player_id

    const transactionId = `achievement-test:${suffix}`
    const first = await unlockAchievement(pool, { playerId, achievementId: 'unicorn-poop', transactionId, trigger: 'dev-test' })
    const retry = await unlockAchievement(pool, { playerId, achievementId: 'unicorn-poop', transactionId, trigger: 'dev-test' })
    assert.equal(first.duplicate, false)
    assert.equal(retry.duplicate, true)

    const state = await getAchievementState(pool, playerId)
    assert.equal(state.unlocked.some(row => row.achievement_id === 'unicorn-poop'), true)

    await resetAchievements(pool, { playerId, achievementId: 'unicorn-poop' })
    const reset = await getAchievementState(pool, playerId)
    assert.equal(reset.unlocked.some(row => row.achievement_id === 'unicorn-poop'), false)

    for (const theme of ['cats', 'dogs', 'jungle', 'space', 'dinosaurs']) {
      await recordAchievementEvent(pool, { playerId, eventId: `booster-theme:${suffix}:${theme}`, eventType: 'booster-opened-theme', eventKey: theme, metadata: { source: 'test' } })
    }
    const completed = await getAchievementState(pool, playerId)
    assert.equal(completed.unlocked.some(row => row.achievement_id === 'raider-of-the-lost-arc-hive'), true)
  } finally {
    try {
      if (playerId) {
        await pool.query(`DELETE FROM fo_achievement_unlocks WHERE player_id=$1`, [playerId])
        await pool.query(`DELETE FROM fo_achievement_events WHERE player_id=$1`, [playerId])
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId])
      }
    } finally { await pool.end() }
  }
})
