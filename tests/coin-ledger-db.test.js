import test from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import crypto from 'node:crypto'
import { appendCoinTransaction, convertCoinsToStars, loadAndVerifyCoinLedger, recordAuthorizedCoinGrant, traceCoinCreation } from '../api/_coinLedger.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview' && Boolean(process.env.COIN_LEDGER_HMAC_SECRET)

test('Preview Coin ledger creation, replay, concurrency, conversion and tracing', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  const ids = [crypto.randomUUID(), crypto.randomUUID()]
  try {
    for (const id of ids) await pool.query(`INSERT INTO fo_accounts(player_id,email,password_hash,account_kind) VALUES($1,$2,'test','guest')`, [id, `ledger-${id}@test.invalid`])
    const purchase = await recordAuthorizedCoinGrant(pool, { accountId: ids[0], amount: 100, transactionId: `purchase:${suffix}`, transactionType: 'purchase', sourceReferenceId: `stripe:${suffix}` })
    assert.equal(purchase.balance, 100)
    const promo = await recordAuthorizedCoinGrant(pool, { accountId: ids[0], amount: 20, transactionId: `promo:${suffix}`, transactionType: 'promotional-grant', sourceReferenceId: `campaign:${suffix}` })
    assert.equal(promo.balance, 120)
    const duplicate = await recordAuthorizedCoinGrant(pool, { accountId: ids[0], amount: 100, transactionId: `purchase:${suffix}`, transactionType: 'purchase', sourceReferenceId: `stripe:${suffix}` })
    assert.equal(duplicate.duplicate, true)
    await assert.rejects(recordAuthorizedCoinGrant(pool, { accountId: ids[1], amount: 100, transactionId: `purchase-replay:${suffix}`, transactionType: 'purchase', sourceReferenceId: `stripe:${suffix}` }))

    async function spend(index) {
      const client = await pool.connect()
      try { await client.query('BEGIN'); const result = await appendCoinTransaction(client, { accountId: ids[0], transactionId: `spend:${suffix}:${index}`, amount: -35, transactionType: 'premium-spend', sourceReferenceId: `sku:${index}` }); await client.query('COMMIT'); return result }
      catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }
    const spends = await Promise.allSettled(Array.from({ length: 4 }, (_, index) => spend(index)))
    assert.equal(spends.filter(result => result.status === 'fulfilled').length, 3)
    assert.equal(spends.filter(result => result.status === 'rejected').length, 1)

    await recordAuthorizedCoinGrant(pool, { accountId: ids[0], amount: 10, transactionId: `refund:${suffix}`, transactionType: 'refund', sourceReferenceId: `refund-source:${suffix}` })
    const conversion = await convertCoinsToStars(pool, { accountId: ids[0], coins: 1, referenceId: `convert:${suffix}` })
    assert.equal(conversion.starsGranted, 10)
    const retry = await convertCoinsToStars(pool, { accountId: ids[0], coins: 1, referenceId: `convert:${suffix}` })
    assert.equal(retry.duplicate, true)
    const stars = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='stars'`, [ids[0]])
    assert.equal(Number(stars.rows[0].balance), 10)
    const verified = await loadAndVerifyCoinLedger(pool, ids[0])
    assert.equal(verified.valid, true)
    assert.equal(verified.balance, 24)
    assert.ok(traceCoinCreation(verified.rows, `conversion:convert:${suffix}:coins`).creationSources.length > 0)
  } finally {
    // The immutable Preview ledger deliberately retains these uniquely named audit fixtures.
    await pool.end()
  }
})
