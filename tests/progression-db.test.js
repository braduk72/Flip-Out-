import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { mutatePlayerValue } from '../api/_playerState.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview authoritative state enforces idempotency, concurrency and account isolation', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  let playerOne
  let playerTwo
  try {
    const one = await pool.query(`INSERT INTO fo_accounts(email,password_hash) VALUES($1,'test') RETURNING player_id`, [`foundation-${suffix}@example.test`])
    const two = await pool.query(`INSERT INTO fo_accounts(email,password_hash) VALUES($1,'test') RETURNING player_id`, [`foundation-other-${suffix}@example.test`])
    playerOne = one.rows[0].player_id
    playerTwo = two.rows[0].player_id
    await mutatePlayerValue(pool, { playerId: playerOne, transactionId: `test-grant:${suffix}`, source: 'test', currencyId: 'stars', amount: 100 })
    const duplicate = await mutatePlayerValue(pool, { playerId: playerOne, transactionId: `test-grant:${suffix}`, source: 'test', currencyId: 'stars', amount: 100 })
    assert.equal(duplicate.duplicate, true)
    const attempts = await Promise.allSettled(Array.from({ length: 4 }, (_, index) => mutatePlayerValue(pool, {
      playerId: playerOne, transactionId: `test-spend:${suffix}:${index}`, source: 'test', currencyId: 'stars', amount: -30,
    })))
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 3)
    const balance = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='stars'`, [playerOne])
    assert.equal(Number(balance.rows[0].balance), 10)
    await assert.rejects(mutatePlayerValue(pool, { playerId: playerOne, transactionId: `test-negative:${suffix}`, source: 'test', currencyId: 'stars', amount: -11 }), /Insufficient/)
    await assert.rejects(mutatePlayerValue(pool, { playerId: playerTwo, transactionId: `test-grant:${suffix}`, source: 'test', currencyId: 'stars', amount: 1 }), /another account/)
  } finally {
    if (playerOne || playerTwo) await pool.query(`DELETE FROM fo_accounts WHERE player_id = ANY($1::uuid[])`, [[playerOne, playerTwo].filter(Boolean)])
    await pool.end()
  }
})
