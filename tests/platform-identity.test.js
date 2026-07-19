import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { gameCenterPayload, getOrCreateGuest, resolveVerifiedIdentity, verifyGameCenterIdentity } from '../api/_platformIdentity.js'

function createGuestDb() {
  const devices = new Map()
  let next = 0
  const query = async (sql, params = []) => {
    if (sql.includes('JOIN fo_accounts')) return { rowCount: devices.has(params[0]) ? 1 : 0, rows: devices.has(params[0]) ? [{ player_id: devices.get(params[0]), account_kind: 'guest' }] : [] }
    if (sql.includes('INSERT INTO fo_accounts')) return { rowCount: 1, rows: [{ player_id: `guest-${++next}`, account_kind: 'guest' }] }
    if (sql.includes('INSERT INTO fo_player_devices')) { devices.set(params[0], params[1]); return { rowCount: 1, rows: [] } }
    return { rowCount: 0, rows: [] }
  }
  return { devices, query, async connect() { return { query, release() {} } } }
}

function createIdentityDb({ identities = new Map(), kinds = new Map() } = {}) {
  let next = 0
  return {
    identities, kinds,
    async query(sql, params = []) {
      const key = `${params[0]}:${params[1]}`
      if (sql.includes('SELECT player_id FROM fo_account_identities')) return { rowCount: identities.has(key) ? 1 : 0, rows: identities.has(key) ? [{ player_id: identities.get(key) }] : [] }
      if (sql.includes('INSERT INTO fo_accounts')) { const id = `protected-${++next}`; kinds.set(id, 'protected'); return { rowCount: 1, rows: [{ player_id: id }] } }
      if (sql.includes('SELECT account_kind')) return { rowCount: kinds.has(params[0]) ? 1 : 0, rows: kinds.has(params[0]) ? [{ account_kind: kinds.get(params[0]) }] : [] }
      if (sql.includes('INSERT INTO fo_account_identities')) { identities.set(key, String(params[2])); return { rowCount: 1, rows: [] } }
      if (sql.includes("UPDATE fo_accounts SET account_kind='protected'")) { kinds.set(String(params[0]), 'protected'); return { rowCount: 1, rows: [] } }
      throw new Error(`Unexpected query: ${sql}`)
    },
  }
}

test('guest creation is automatic and returning device gets the same guest', async () => {
  const db = createGuestDb()
  const first = await getOrCreateGuest(db, 'device-1')
  const returning = await getOrCreateGuest(db, 'device-1')
  assert.equal(first.created, true)
  assert.equal(returning.created, false)
  assert.equal(returning.player.player_id, first.player.player_id)
})

test('verified Game Center signature accepts the correct signed payload', async () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const identity = {
    gamePlayerID: 'G:123456', bundleID: 'uk.gizmogames.flipout', timestamp: Date.now(),
    salt: crypto.randomBytes(16).toString('base64'), publicKeyUrl: 'https://static.gc.apple.com/public-key/test.cer',
  }
  identity.signature = crypto.sign('sha256', gameCenterPayload(identity), privateKey).toString('base64')
  const verified = await verifyGameCenterIdentity(identity, { resolvePublicKey: async () => publicKey, now: identity.timestamp })
  assert.deepEqual(verified, { provider: 'game_center', subject: 'G:123456', metadata: { bundleID: 'uk.gizmogames.flipout' } })
})

test('invalid Game Center signature and untrusted key URL are rejected', async () => {
  const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const identity = { gamePlayerID: 'G:bad', bundleID: 'uk.gizmogames.flipout', timestamp: Date.now(), salt: 'c2FsdA==', signature: 'aW52YWxpZA==', publicKeyUrl: 'https://static.gc.apple.com/key.cer' }
  await assert.rejects(verifyGameCenterIdentity(identity, { resolvePublicKey: async () => publicKey, now: identity.timestamp }), /Invalid Game Center/)
  await assert.rejects(verifyGameCenterIdentity({ ...identity, publicKeyUrl: 'https://evil.example/key' }), /Untrusted/)
})

test('guest upgrade attaches verified identity to the same account and is duplicate-safe', async () => {
  const db = createIdentityDb({ kinds: new Map([['guest-1', 'guest']]) })
  const verified = { provider: 'game_center', subject: 'G:upgrade', metadata: {} }
  const upgraded = await resolveVerifiedIdentity(db, { verified, currentPlayerId: 'guest-1', upgrade: true })
  const duplicate = await resolveVerifiedIdentity(db, { verified, currentPlayerId: 'guest-1', upgrade: true })
  assert.equal(upgraded.playerId, 'guest-1')
  assert.equal(upgraded.upgraded, true)
  assert.equal(duplicate.playerId, 'guest-1')
  assert.equal(duplicate.created, false)
})

test('account switching never merges accounts accidentally', async () => {
  const identities = new Map([['game_center:G:returning', 'protected-1']])
  const db = createIdentityDb({ identities, kinds: new Map([['guest-1', 'guest'], ['protected-1', 'protected']]) })
  const verified = { provider: 'game_center', subject: 'G:returning', metadata: {} }
  const switched = await resolveVerifiedIdentity(db, { verified, currentPlayerId: 'guest-1', upgrade: false })
  assert.equal(switched.playerId, 'protected-1')
  assert.equal(switched.switched, true)
  assert.equal(db.kinds.get('guest-1'), 'guest')
})

test('upgrade conflict rejects rather than merging two accounts', async () => {
  const db = createIdentityDb({ identities: new Map([['game_center:G:owned', 'protected-1']]), kinds: new Map([['guest-1', 'guest']]) })
  await assert.rejects(resolveVerifiedIdentity(db, { verified: { provider: 'game_center', subject: 'G:owned' }, currentPlayerId: 'guest-1', upgrade: true }), error => error.code === 'IDENTITY_CONFLICT')
})

test('a protected account cannot absorb another identity through automatic upgrade', async () => {
  const db = createIdentityDb({ kinds: new Map([['protected-1', 'protected']]) })
  await assert.rejects(resolveVerifiedIdentity(db, { verified: { provider: 'game_center', subject: 'G:new' }, currentPlayerId: 'protected-1', upgrade: true }), error => error.code === 'ACCOUNT_MERGE_BLOCKED')
})
