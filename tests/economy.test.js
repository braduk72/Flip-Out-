import test from 'node:test'
import assert from 'node:assert/strict'
import { createEconomyService } from '../src/utils/economyService.js'
import { purchasePayload, recordPurchaseGrant } from '../api/_economy.js'

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

function purchaseGrant(id = 'purchase:cs_first') {
  return {
    id,
    source: 'purchase',
    changes: {
      counters: { coins: 100 },
      decks: ['sportscars'],
      extras: { freeze: 1 },
    },
  }
}

test('first-time purchase grant applies every entitlement once', () => {
  const storage = new MemoryStorage()
  const service = createEconomyService(storage)

  const result = service.applyTransaction(purchaseGrant())

  assert.equal(result.applied, true)
  assert.equal(storage.getItem('fo_coins'), '100')
  assert.deepEqual(JSON.parse(storage.getItem('fo_owned_decks')), ['sportscars'])
  assert.equal(storage.getItem('fo_extra_freeze'), '1')
  assert.equal(service.hasTransaction('purchase:cs_first'), true)
})

test('repeated restoration ignores historic purchase grants already applied', () => {
  const storage = new MemoryStorage()
  const service = createEconomyService(storage)
  const grants = [purchaseGrant('purchase:cs_one'), purchaseGrant('purchase:cs_two')]

  service.applyTransactions(grants)
  const secondRestore = service.applyTransactions(grants)

  assert.equal(storage.getItem('fo_coins'), '200')
  assert.equal(storage.getItem('fo_extra_freeze'), '2')
  assert.deepEqual(secondRestore.map(result => result.duplicate), [true, true])
})

test('duplicate webhook and verification callback converge on one server transaction', async () => {
  const db = createAtomicFakeDb()
  const args = serverPurchaseArgs('cs_duplicate')

  const webhook = await recordPurchaseGrant(db, args)
  const callback = await recordPurchaseGrant(db, args)

  assert.equal(webhook.inserted, true)
  assert.equal(callback.inserted, false)
  assert.equal(db.ids.size, 1)
})

test('interrupted response retry returns duplicate without granting value twice', () => {
  const storage = new MemoryStorage()
  const service = createEconomyService(storage)
  const grant = purchaseGrant('purchase:cs_retry')

  service.applyTransaction(grant) // write completed; caller never received the response
  const retry = service.applyTransaction(grant)

  assert.equal(retry.duplicate, true)
  assert.equal(storage.getItem('fo_coins'), '100')
})

test('concurrent duplicate purchase grants insert exactly one server transaction', async () => {
  const db = createAtomicFakeDb()
  const args = serverPurchaseArgs('cs_concurrent')

  const results = await Promise.all(Array.from({ length: 25 }, () => recordPurchaseGrant(db, args)))

  assert.equal(results.filter(result => result.inserted).length, 1)
  assert.equal(results.filter(result => !result.inserted).length, 24)
  assert.equal(db.ids.size, 1)
})

function serverPurchaseArgs(stripeSessionId) {
  return {
    stripeSessionId,
    playerId: 'player-1',
    deviceUuid: 'device-1',
    payload: purchasePayload({
      productId: 'coins_100',
      productType: 'coins',
      coins: 100,
    }),
  }
}

function createAtomicFakeDb() {
  const ids = new Map()
  return {
    ids,
    async query(sql, params) {
      const id = params[0]
      if (sql.includes('SELECT player_id')) return { rowCount: ids.has(id) ? 1 : 0, rows: ids.has(id) ? [{ player_id: ids.get(id) }] : [] }
      if (ids.has(id)) return { rowCount: 0, rows: [] }
      ids.set(id, params[1]) // models the database unique constraint at statement execution
      await Promise.resolve()
      return { rowCount: 1, rows: [{ transaction_id: id, player_id: params[1] }] }
    },
  }
}
