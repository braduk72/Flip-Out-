import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import pg from 'pg'
import { recordAuthorizedCoinGrant } from '../api/_coinLedger.js'
import { attemptMatch3Revive, startMatch3 } from '../api/_match3Sessions.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview Match-3 revive spends Coins once and retries return the same result', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  let sessionId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`match3-revive-${suffix}@test.invalid`])
    playerId = account.rows[0].player_id
    await recordAuthorizedCoinGrant(pool, { accountId: playerId, amount: 200, transactionId: `revive-bank:${suffix}`, transactionType: 'promotional-grant', sourceReferenceId: `revive-bank:${suffix}`, metadata: { source: 'test' } })
    const started = await startMatch3(pool, { playerId, levelId: 1, requestId: `match3-revive:${suffix}` })
    sessionId = started.session.sessionId
    await pool.query(`UPDATE fo_match3_sessions SET state=jsonb_set(jsonb_set(state,'{status}','"lost"'),'{movesRemaining}','0'::jsonb),status='lost' WHERE session_id=$1`, [sessionId])
    const actionId = `revive:${suffix}`
    const first = await attemptMatch3Revive(pool, { playerId, sessionId, actionId })
    const retry = await attemptMatch3Revive(pool, { playerId, sessionId, actionId })
    assert.equal(first.duplicate, false)
    assert.equal(retry.duplicate, true)
    assert.deepEqual(retry.revive, first.revive)
    assert.equal(first.revive.costCoins, 25)
    assert.equal(first.revive.oddsPercent, 75)
    const balance = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='coins'`, [playerId])
    assert.equal(Number(balance.rows[0].balance), 175)
    const spend = await pool.query(`SELECT amount,transaction_type FROM fo_coin_ledger WHERE transaction_id=$1`, [`match3-revive:${actionId}:cost`])
    assert.equal(Number(spend.rows[0].amount), -25)
    assert.equal(spend.rows[0].transaction_type, 'revive-cost')
  } finally {
    try {
      if (sessionId) await pool.query(`DELETE FROM fo_match3_sessions WHERE session_id=$1`, [sessionId])
      if (playerId) await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId])
    } finally { await pool.end() }
  }
})
