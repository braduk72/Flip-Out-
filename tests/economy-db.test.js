import test from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { createEconomyService } from '../src/utils/economyService.js'
import { purchasePayload, recordPurchaseGrant, toClientGrant } from '../api/_economy.js'

const hasDatabase = Boolean(process.env.DATABASE_URL)
const isPreview = process.env.VERCEL_ENV === 'preview'

test('preview database migration and duplicate purchase restoration', { skip: !hasDatabase || !isPreview }, async () => {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await db.connect()

  const nonce = `integration-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const stripeSessionId = `cs_${nonce}`
  const deviceUuid = `device-${nonce}`
  const transactionId = `purchase:${stripeSessionId}`
  let playerId

  try {
    const table = await db.query(`SELECT to_regclass('public.fo_economy_transactions') AS name`)
    assert.equal(table.rows[0].name, 'fo_economy_transactions')
    const account = await db.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`purchase-${nonce}@guest.invalid`])
    playerId = account.rows[0].player_id

    const args = {
      stripeSessionId,
      playerId,
      deviceUuid,
      payload: purchasePayload({ productId: 'coins_100', productType: 'coins', coins: 100 }),
    }
    const firstCallback = await recordPurchaseGrant(db, args)
    const duplicateCallback = await recordPurchaseGrant(db, args)
    assert.equal(firstCallback.inserted, true)
    assert.equal(duplicateCallback.inserted, false)

    const restored = await db.query(
      `SELECT transaction_id, source, payload
       FROM fo_economy_transactions
       WHERE device_uuid = $1 AND source = 'purchase'`,
      [deviceUuid]
    )
    assert.equal(restored.rowCount, 1)

    const storage = new MemoryStorage()
    const economy = createEconomyService(storage)
    const grants = restored.rows.map(row => {
      const grant = toClientGrant(row)
      return {
        id: grant.transactionId,
        source: grant.source,
        changes: { counters: { coins: grant.coins }, decks: grant.decks, extras: grant.extras },
      }
    })

    const firstRestore = economy.applyTransactions(grants)
    const repeatedRestore = economy.applyTransactions(grants)
    assert.equal(firstRestore[0].applied, true)
    assert.equal(repeatedRestore[0].duplicate, true)
    assert.equal(storage.getItem('fo_coins'), '100')
  } finally {
    try {
      await db.query('DELETE FROM fo_economy_transactions WHERE transaction_id = $1', [transactionId])
      // Purchase ledger and its uniquely named Preview account are immutable audit fixtures.
    } finally {
      await db.end()
    }
  }
})

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) { this.values.set(key, String(value)) }
}
