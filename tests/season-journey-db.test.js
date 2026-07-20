import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { grantSeasonScore, spendSeasonTickets } from '../api/_seasonJourney.js'
import { ACTIVE_SEASON, SEASON_COLLECTOR_CARD_ID } from '../src/data/seasonJourney.js'

const enabled = Boolean(process.env.DATABASE_URL)

async function inTransaction(pool, work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

test('Preview Season Journey grants score, tickets, claims and archive idempotently', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`season-${suffix}@test.invalid`])
    playerId = account.rows[0].player_id
    const first = await inTransaction(pool, client => grantSeasonScore(client, { playerId, eventId: `season-score:${suffix}:one`, source: 'season-db-test', scoreAmount: 1000 }))
    const retry = await inTransaction(pool, client => grantSeasonScore(client, { playerId, eventId: `season-score:${suffix}:one`, source: 'season-db-test', scoreAmount: 1000 }))
    assert.equal(first.duplicate, false)
    assert.equal(first.journeyLevel, 1)
    assert.equal(first.ticketsEarned, 1)
    assert.equal(retry.duplicate, true)

    const claim = await spendSeasonTickets(pool, { playerId, claimId: `season-claim:${suffix}:stars`, choiceId: 'choice:stars:250' })
    const claimRetry = await spendSeasonTickets(pool, { playerId, claimId: `season-claim:${suffix}:stars`, choiceId: 'choice:stars:250' })
    assert.equal(claim.duplicate, false)
    assert.equal(claimRetry.duplicate, true)
    assert.deepEqual(claim.reward, { currencyId: 'stars', amount: 250 })

    const [a, b] = await Promise.all([
      inTransaction(pool, client => grantSeasonScore(client, { playerId, eventId: `season-score:${suffix}:level100`, source: 'season-db-test', scoreAmount: 99000 })),
      inTransaction(pool, client => grantSeasonScore(client, { playerId, eventId: `season-score:${suffix}:level100`, source: 'season-db-test', scoreAmount: 99000 })),
    ])
    assert.equal([a, b].filter(result => !result.duplicate).length, 1)
    const progress = await pool.query(`SELECT season_score,journey_level,season_tickets,collector_awarded_at FROM fo_season_progress WHERE player_id=$1 AND season_id=$2`, [playerId, ACTIVE_SEASON.id])
    assert.equal(Number(progress.rows[0].season_score), 100000)
    assert.equal(Number(progress.rows[0].journey_level), 100)
    assert.equal(Number(progress.rows[0].season_tickets), 99)
    assert.ok(progress.rows[0].collector_awarded_at)
    const archive = await pool.query(`SELECT collector_item_id,proof_level FROM fo_season_archive WHERE player_id=$1 AND season_id=$2`, [playerId, ACTIVE_SEASON.id])
    assert.equal(archive.rowCount, 1)
    assert.equal(archive.rows[0].collector_item_id, SEASON_COLLECTOR_CARD_ID)
    assert.equal(Number(archive.rows[0].proof_level), 100)
    const inventory = await pool.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id=$2`, [playerId, SEASON_COLLECTOR_CARD_ID])
    assert.equal(Number(inventory.rows[0].quantity), 1)
  } finally {
    try {
      if (playerId) {
        await pool.query(`DELETE FROM fo_season_reward_claims WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_season_archive WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_season_ticket_transactions WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_season_score_events WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_season_progress WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_transactions WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_balances WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_accounts WHERE player_id=$1`, [playerId]).catch(() => {})
      }
    } finally {
      await pool.end()
    }
  }
})
