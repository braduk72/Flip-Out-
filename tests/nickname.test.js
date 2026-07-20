import test from 'node:test'
import assert from 'node:assert/strict'
import { setInitialDisplayName, validateDisplayName, validateSuitableName } from '../api/_nickname.js'

function createNicknameDb(accounts = new Map()) {
  return {
    async query(sql, params = []) {
      if (sql.includes('UPDATE fo_accounts')) {
        const [playerId, displayName] = params
        const current = accounts.get(playerId)
        if (current?.displayName != null) return { rowCount: 0, rows: [] }
        if (!current) return { rowCount: 0, rows: [] }
        accounts.set(playerId, { displayName })
        return { rowCount: 1, rows: [{ player_id: playerId, display_name: displayName }] }
      }
      if (sql.includes('SELECT display_name')) {
        const current = accounts.get(params[0])
        return current ? { rowCount: 1, rows: [{ display_name: current.displayName }] } : { rowCount: 0, rows: [] }
      }
      throw new Error(`Unexpected query: ${sql}`)
    },
  }
}

test('valid nickname is accepted and preserves display casing', () => {
  assert.equal(validateDisplayName('CatFan99'), 'CatFan99')
})

test('suitability validation supports longer public names without punctuation', () => {
  assert.equal(validateSuitableName('  Black   Cats  ', { label: 'Album name' }), 'Black Cats')
  assert.throws(() => validateSuitableName('Bad!Name', { label: 'Album name' }), error => error.code === 'INVALID_SUITABLE_NAME')
})

test('nickname validation rejects invalid length, spaces and punctuation', () => {
  for (const nickname of ['Ab', 'ABCDEFGHIJKLM', 'Brad SC', 'Brad!']) {
    assert.throws(() => validateDisplayName(nickname), error => error.code === 'INVALID_DISPLAY_NAME')
  }
})

test('nickname validation rejects profanity and reserved names case-insensitively', () => {
  assert.throws(() => validateDisplayName('Admin'), error => error.code === 'RESERVED_DISPLAY_NAME')
  assert.throws(() => validateDisplayName('sHiT'), error => error.code === 'PROFANE_DISPLAY_NAME')
})

test('duplicate display names are allowed because player IDs are the identity', async () => {
  const db = createNicknameDb(new Map([['player-a', { displayName: null }], ['player-b', { displayName: null }]]))
  assert.equal((await setInitialDisplayName(db, { playerId: 'player-a', displayName: 'Brad' })).displayName, 'Brad')
  assert.equal((await setInitialDisplayName(db, { playerId: 'player-b', displayName: 'Brad' })).displayName, 'Brad')
})

test('initial nickname claim is retry-safe and never overwrites an existing player', async () => {
  const db = createNicknameDb(new Map([['player-a', { displayName: null }]]))
  assert.deepEqual(await setInitialDisplayName(db, { playerId: 'player-a', displayName: 'Gizmo' }), { displayName: 'Gizmo', alreadySet: false })
  assert.deepEqual(await setInitialDisplayName(db, { playerId: 'player-a', displayName: 'Gizmo' }), { displayName: 'Gizmo', alreadySet: true })
  await assert.rejects(setInitialDisplayName(db, { playerId: 'player-a', displayName: 'Brad' }), error => error.code === 'DISPLAY_NAME_ALREADY_SET')
})

test('server validation rejects invalid requests even when client validation is bypassed', async () => {
  const db = createNicknameDb(new Map([['player-a', { displayName: null }]]))
  await assert.rejects(setInitialDisplayName(db, { playerId: 'player-a', displayName: 'Admin!' }), error => error.code === 'INVALID_DISPLAY_NAME')
})
