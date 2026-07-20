import test from 'node:test'
import assert from 'node:assert/strict'
import { initialMarketSeedItems, isDevToolkitAvailable, runDevToolkitAction, verifyDevToolkitAccess } from '../api/_foDevTools.js'

test('developer toolkit is Preview-only', () => {
  assert.equal(isDevToolkitAvailable({ VERCEL_ENV: 'preview' }), true)
  assert.equal(isDevToolkitAvailable({ VERCEL_ENV: 'production' }), false)
})

test('developer toolkit requires the configured secret', () => {
  const env = { VERCEL_ENV: 'preview', DEV_TOOLKIT_SECRET: '1234567890123456' }
  assert.equal(verifyDevToolkitAccess({ headers: { 'x-flipout-dev-secret': '1234567890123456' } }, env), true)
  assert.throws(() => verifyDevToolkitAccess({ headers: { 'x-flipout-dev-secret': 'wrong-secret-value' } }, env), error => error.code === 'DEV_TOOLKIT_FORBIDDEN')
})

test('developer toolkit fails closed when the secret is missing or environment is production', () => {
  assert.throws(() => verifyDevToolkitAccess({ headers: {} }, { VERCEL_ENV: 'preview' }), error => error.code === 'DEV_TOOLKIT_SECRET_MISSING')
  assert.throws(() => verifyDevToolkitAccess({ headers: {} }, { VERCEL_ENV: 'production', DEV_TOOLKIT_SECRET: '1234567890123456' }), error => error.code === 'DEV_TOOLKIT_PREVIEW_ONLY')
})

test('developer toolkit rejects unsupported actions before mutating state', async () => {
  await assert.rejects(
    runDevToolkitAction({}, { playerId: 'player-one', body: { action: 'grant-foil' } }),
    error => error.code === 'DEV_TOOLKIT_INVALID',
  )
})

test('developer toolkit initial market seed is deterministic and below the listing cap', () => {
  const first = initialMarketSeedItems()
  const second = initialMarketSeedItems()
  assert.deepEqual(first, second)
  assert.ok(first.length > 5)
  assert.ok(first.length <= 15)
  assert.equal(new Set(first.map(item => item.themeId)).size, first.length)
  assert.ok(first.every(item => item.priceCoins >= 10))
})
