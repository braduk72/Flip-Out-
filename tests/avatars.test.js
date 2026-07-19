import test from 'node:test'
import assert from 'node:assert/strict'
import { AVATAR_CATALOG, ONBOARDING_AVATARS, getAvatarById } from '../src/data/avatarCatalog.js'
import { setInitialAvatar, validateAvatarId } from '../api/_avatars.js'

function createAvatarDb(accounts = new Map()) {
  return {
    async query(sql, params = []) {
      if (sql.includes('UPDATE fo_accounts')) {
        const [playerId, avatarId] = params
        const current = accounts.get(playerId)
        if (!current || current.avatarId != null) return { rowCount: 0, rows: [] }
        accounts.set(playerId, { avatarId })
        return { rowCount: 1, rows: [{ player_id: playerId, selected_avatar_id: avatarId }] }
      }
      if (sql.includes('SELECT selected_avatar_id')) {
        const current = accounts.get(params[0])
        return current ? { rowCount: 1, rows: [{ selected_avatar_id: current.avatarId }] } : { rowCount: 0, rows: [] }
      }
      throw new Error(`Unexpected query: ${sql}`)
    },
  }
}

test('avatar catalogue registers reusable existing portrait assets once', () => {
  assert.ok(ONBOARDING_AVATARS.length >= 10)
  assert.equal(new Set(AVATAR_CATALOG.map(avatar => avatar.id)).size, AVATAR_CATALOG.length)
  assert.equal(new Set(AVATAR_CATALOG.map(avatar => avatar.asset)).size, AVATAR_CATALOG.length)
  assert.equal(getAvatarById('starter-1')?.asset, '/images/a1.webp')
})

test('valid starter avatar selection persists by ID and is retry-safe', async () => {
  const db = createAvatarDb(new Map([['player-a', { avatarId: null }]]))
  assert.deepEqual(await setInitialAvatar(db, { playerId: 'player-a', avatarId: 'starter-1' }), { avatarId: 'starter-1', alreadySet: false })
  assert.deepEqual(await setInitialAvatar(db, { playerId: 'player-a', avatarId: 'starter-1' }), { avatarId: 'starter-1', alreadySet: true })
  await assert.rejects(setInitialAvatar(db, { playerId: 'player-a', avatarId: 'starter-2' }), error => error.code === 'AVATAR_ALREADY_SET')
})

test('server rejects unavailable or unknown avatar IDs', () => {
  assert.throws(() => validateAvatarId('beta-tester'), error => error.code === 'INVALID_AVATAR')
  assert.throws(() => validateAvatarId('/images/a1.webp'), error => error.code === 'INVALID_AVATAR')
})

