import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { completeMatchSession, createMatchSession, getMatchSession, recordMatchEvent } from '../api/_matchSessions.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview authoritative match sessions reject replay/tampering and complete once', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  const players = []
  let matchId
  try {
    for (const label of ['owner', 'other']) {
      const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`match-${label}-${suffix}@test.invalid`])
      players.push(account.rows[0].player_id)
    }
    const [owner, other] = players
    const created = await createMatchSession(pool, { playerId: owner, mode: 'solo', difficulty: 'Easy', deckId: 'cats' })
    matchId = created.matchId
    assert.match(matchId, /^match:/)
    await assert.rejects(getMatchSession(pool, { playerId: other, matchId }), error => error.status === 404)
    const internal = await pool.query(`SELECT state FROM fo_matches WHERE match_id=$1`, [matchId])
    const cards = internal.rows[0].state.cards
    const pairs = new Map()
    for (let index = 0; index < cards.length; index += 1) {
      const list = pairs.get(cards[index].pairId) ?? []
      list.push(index); pairs.set(cards[index].pairId, list)
    }
    let sequence = 0
    for (const indices of pairs.values()) {
      for (const index of indices) {
        sequence += 1
        await recordMatchEvent(pool, { playerId: owner, matchId, eventId: `event:${crypto.randomUUID()}`, sequence, event: { type: 'flip', index } })
      }
      sequence += 1
      await recordMatchEvent(pool, { playerId: owner, matchId, eventId: `event:${crypto.randomUUID()}`, sequence, event: { type: 'resolve', claimedMatch: true } })
    }
    const completed = await getMatchSession(pool, { playerId: owner, matchId })
    assert.equal(completed.status, 'completed')
    const completionId = `completion:${crypto.randomUUID()}`
    const callbacks = await Promise.all([
      completeMatchSession(pool, { playerId: owner, matchId, completionId }),
      completeMatchSession(pool, { playerId: owner, matchId, completionId }),
    ])
    assert.equal(callbacks.filter(result => !result.duplicate).length, 1)
    assert.equal(callbacks.filter(result => result.duplicate).length, 1)
    const balance = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='stars'`, [owner])
    assert.equal(Number(balance.rows[0].balance), 100)
    const progress = await pool.query(`SELECT COUNT(*)::int AS count FROM fo_match_progress_events WHERE match_id=$1`, [matchId])
    assert.equal(progress.rows[0].count, 1)
    await assert.rejects(recordMatchEvent(pool, { playerId: other, matchId, eventId: `event:${crypto.randomUUID()}`, sequence: sequence + 1, event: { type: 'flip', index: 0 } }), error => error.status === 404)
  } finally {
    try {
      if (matchId) await pool.query(`DELETE FROM fo_matches WHERE match_id=$1`, [matchId])
      if (players.length) {
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=ANY($1::uuid[])`, [players])
        await pool.query(`DELETE FROM fo_player_transactions WHERE player_id=ANY($1::uuid[])`, [players])
        await pool.query(`DELETE FROM fo_player_balances WHERE player_id=ANY($1::uuid[])`, [players])
        await pool.query(`DELETE FROM fo_economy_audit WHERE player_id=ANY($1::uuid[])`, [players])
        await pool.query(`DELETE FROM fo_accounts WHERE player_id=ANY($1::uuid[])`, [players])
      }
    } finally { await pool.end() }
  }
})
