import test from 'node:test'
import assert from 'node:assert/strict'
import { linkLegacyTestPurchases, purchasePayload, recordPurchaseGrant } from '../api/_economy.js'
import { resolveVerifiedIdentity } from '../api/_platformIdentity.js'

function grantArgs(playerId, session = 'cs_test') {
  return { stripeSessionId: session, playerId, deviceUuid: `device-${playerId}`, payload: purchasePayload({ productId: 'coins_100', productType: 'coins', coins: 100 }) }
}

function purchaseDb() {
  const transactions = new Map()
  return { transactions, async query(sql, params) {
    if (sql.includes('SELECT player_id')) return { rowCount: transactions.has(params[0]) ? 1 : 0, rows: transactions.has(params[0]) ? [{ player_id: transactions.get(params[0]) }] : [] }
    if (transactions.has(params[0])) return { rowCount: 0, rows: [] }
    transactions.set(params[0], params[1])
    return { rowCount: 1, rows: [{ transaction_id: params[0], player_id: params[1] }] }
  } }
}

test('new guest purchase is owned by the authenticated guest account', async () => {
  const db = purchaseDb()
  const result = await recordPurchaseGrant(db, grantArgs('guest-1', 'cs_guest'))
  assert.equal(result.inserted, true)
  assert.equal(db.transactions.get('purchase:cs_guest'), 'guest-1')
})

test('new platform-authenticated purchase is owned by the protected account', async () => {
  const db = purchaseDb()
  await recordPurchaseGrant(db, grantArgs('platform-1', 'cs_platform'))
  assert.equal(db.transactions.get('purchase:cs_platform'), 'platform-1')
})

test('guest-to-platform upgrade preserves purchase ownership and link retry is safe', async () => {
  const purchases = purchaseDb()
  await recordPurchaseGrant(purchases, grantArgs('guest-1', 'cs_upgrade'))
  const identities = new Map()
  const identityDb = {
    async query(sql, params) {
      const key = `${params[0]}:${params[1]}`
      if (sql.includes('SELECT player_id FROM fo_account_identities')) return { rowCount: identities.has(key) ? 1 : 0, rows: identities.has(key) ? [{ player_id: identities.get(key) }] : [] }
      if (sql.includes('SELECT account_kind')) return { rowCount: 1, rows: [{ account_kind: 'guest' }] }
      if (sql.includes('INSERT INTO fo_account_identities')) { identities.set(key, params[2]); return { rowCount: 1, rows: [] } }
      if (sql.includes('UPDATE fo_accounts')) return { rowCount: 1, rows: [] }
      throw new Error('Unexpected query')
    },
  }
  const verified = { provider: 'game_center', subject: 'G:purchase-owner' }
  const first = await resolveVerifiedIdentity(identityDb, { verified, currentPlayerId: 'guest-1', upgrade: true })
  const retry = await resolveVerifiedIdentity(identityDb, { verified, currentPlayerId: 'guest-1', upgrade: true })
  assert.equal(first.playerId, 'guest-1')
  assert.equal(retry.playerId, 'guest-1')
  assert.equal(purchases.transactions.get('purchase:cs_upgrade'), 'guest-1')
})

test('duplicate webhook remains idempotent for the same account', async () => {
  const db = purchaseDb()
  const first = await recordPurchaseGrant(db, grantArgs('guest-1', 'cs_duplicate_owner'))
  const duplicate = await recordPurchaseGrant(db, grantArgs('guest-1', 'cs_duplicate_owner'))
  assert.equal(first.inserted, true)
  assert.equal(duplicate.inserted, false)
  assert.equal(db.transactions.size, 1)
})

test('cross-account purchase replay is rejected', async () => {
  const db = purchaseDb()
  await recordPurchaseGrant(db, grantArgs('guest-1', 'cs_cross'))
  await assert.rejects(recordPurchaseGrant(db, grantArgs('guest-2', 'cs_cross')), error => error.code === 'PURCHASE_ACCOUNT_MISMATCH')
})

test('legacy test purchase linking is Preview-only, retry-safe and conflict-aware', async () => {
  let linked = false
  const owner = 'guest-1'
  const client = { async query(sql) {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0, rows: [] }
    if (sql.includes('UPDATE fo_purchases')) { if (linked) return { rowCount: 0, rows: [] }; linked = true; return { rowCount: 1, rows: [{ stripe_session_id: 'cs_legacy' }] } }
    return { rowCount: 1, rows: [] }
  }, release() {} }
  const db = { async query(sql) {
    if (sql.includes('fo_player_devices')) return { rowCount: 1, rows: [{ player_id: owner }] }
    if (sql.includes('player_id IS NOT NULL')) return { rowCount: 0, rows: [] }
    throw new Error('Unexpected query')
  }, async connect() { return client } }
  const first = await linkLegacyTestPurchases(db, { playerId: owner, deviceUuid: 'legacy-device', preview: true })
  const retry = await linkLegacyTestPurchases(db, { playerId: owner, deviceUuid: 'legacy-device', preview: true })
  assert.deepEqual(first, { linked: 1, duplicate: false })
  assert.deepEqual(retry, { linked: 0, duplicate: true })
  await assert.rejects(linkLegacyTestPurchases(db, { playerId: owner, deviceUuid: 'legacy-device', preview: false }), /development-only/)
})
