import assert from 'node:assert/strict'
import test from 'node:test'
import { personalAlbumFingerprint, validatePersonalAlbumName, PERSONAL_ALBUM_COST_COINS, PERSONAL_ALBUM_LIMIT } from '../api/_personalAlbums.js'

test('Personal Album constants preserve approved limit and Coin cost', () => {
  assert.equal(PERSONAL_ALBUM_LIMIT, 10)
  assert.equal(PERSONAL_ALBUM_COST_COINS, 500)
})

test('Personal Album names allow simple spaces and reject unsuitable names', () => {
  assert.equal(validatePersonalAlbumName('  Black   Cats  '), 'Black Cats')
  assert.equal(validatePersonalAlbumName('Christmas'), 'Christmas')
  assert.throws(() => validatePersonalAlbumName('A!'), error => error.code === 'INVALID_SUITABLE_NAME')
  assert.throws(() => validatePersonalAlbumName('Admin'), error => error.code === 'RESERVED_SUITABLE_NAME')
  assert.throws(() => validatePersonalAlbumName('shit cards'), error => error.code === 'PROFANE_SUITABLE_NAME')
})

test('Personal Album idempotency fingerprint is based on normalised name', () => {
  assert.equal(personalAlbumFingerprint({ name: 'Black   Cats' }), personalAlbumFingerprint({ name: 'Black Cats' }))
  assert.notEqual(personalAlbumFingerprint({ name: 'Black Cats' }), personalAlbumFingerprint({ name: 'Cute Animals' }))
})
