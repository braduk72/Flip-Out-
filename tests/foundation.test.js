import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticateRequest, hashPassword, hashSessionToken, linkDevice, verifyPassword } from '../api/_auth.js'
import { REWARD_TABLES, seededRandom, selectWeightedReward, simulateRewards, validateRewardTable } from '../api/_rewards.js'
import { annualChoiceEligibility, ITEM_CATALOG, validateCatalog } from '../src/data/itemCatalog.js'
import { validateAmount, validateId } from '../api/_playerState.js'

test('password hashing authenticates the right password only', () => {
  const stored = hashPassword('correct horse battery staple')
  assert.equal(verifyPassword('correct horse battery staple', stored), true)
  assert.equal(verifyPassword('incorrect password', stored), false)
})

test('authenticated state access resolves bearer session and unauthenticated access rejects', async () => {
  const token = 'test-session-token'
  const db = { query: async (_sql, params) => ({ rows: params[0] === hashSessionToken(token) ? [{ player_id: 'p1', email: 'one@example.test' }] : [] }) }
  assert.equal((await authenticateRequest(db, { headers: { authorization: `Bearer ${token}` } })).player_id, 'p1')
  assert.equal(await authenticateRequest(db, { headers: {} }), null)
})

test('device progress linking is retry-safe and rejects cross-account takeover', async () => {
  const links = new Map()
  const db = { query: async (_sql, [device, player]) => {
    if (!links.has(device)) links.set(device, player)
    return { rows: [{ player_id: links.get(device) }] }
  } }
  assert.equal((await linkDevice(db, { playerId: 'p1', deviceUuid: 'd1' })).linked, true)
  assert.equal((await linkDevice(db, { playerId: 'p1', deviceUuid: 'd1' })).linked, true)
  await assert.rejects(linkDevice(db, { playerId: 'p2', deviceUuid: 'd1' }), /another account/)
})

test('server mutation validation rejects tampering and invalid values', () => {
  assert.throws(() => validateId('../coins'), /Invalid/)
  assert.throws(() => validateAmount(0), /non-zero/)
  assert.throws(() => validateAmount(1.5), /safe integer/)
})

test('canonical catalogue validates without duplicate IDs or invalid deck references', () => {
  assert.deepEqual(validateCatalog(), [])
  const duplicate = [ITEM_CATALOG[0], ITEM_CATALOG[0]]
  assert.match(validateCatalog(duplicate).join(' '), /Duplicate/)
  const invalid = [{ ...ITEM_CATALOG.find(item => item.type === 'card'), deckId: 'deck:missing' }]
  assert.match(validateCatalog(invalid).join(' '), /Invalid deck reference/)
})

test('gold variants are canonical items and annual cutoff includes 25 December only', () => {
  const goldCards = ITEM_CATALOG.filter(item => item.variant === 'gold' && item.baseDeckId)
  assert.ok(goldCards.length > 0)
  assert.ok(goldCards.every(item => item.tradable === false && item.stackable === false))
  const choices = annualChoiceEligibility([
    { id: 'a', type: 'card', status: 'available', releasedAt: '2025-12-25' },
    { id: 'b', type: 'card', status: 'available', releasedAt: '2025-12-26' },
    { id: 'c', type: 'card', status: 'available', releasedAt: '2024-12-25' },
  ], 2026)
  assert.deepEqual(choices.map(item => item.id), ['a'])
})

test('wheel keeps exact existing weighted boundaries and deterministic seeded rolls', () => {
  const table = REWARD_TABLES.dailyWheelV1
  assert.deepEqual(validateRewardTable(table), [])
  assert.equal(selectWeightedReward(table, 0).amount, 10)
  assert.equal(selectWeightedReward(table, 0.299999).amount, 10)
  assert.equal(selectWeightedReward(table, 0.30).amount, 50)
  assert.equal(selectWeightedReward(table, 0.999999).amount, 1000)
  const first = seededRandom(42)()
  assert.equal(first, seededRandom(42)())
})

test('Reward Theatre reward table validates and includes premium milestone rewards', () => {
  const table = REWARD_TABLES.rewardTheatreV1
  assert.deepEqual(validateRewardTable(table), [])
  assert.ok(table.entries.some(entry => entry.reward.currencyId === 'coins'))
  assert.ok(table.entries.some(entry => entry.reward.itemId === 'booster:random'))
})

test('100,000 wheel rolls remain within statistical sanity tolerance', () => {
  const result = simulateRewards(REWARD_TABLES.dailyWheelV1, 100000, 20260718)
  const expected = { 'stars:10': 30000, 'stars:50': 25000, 'stars:100': 18000, 'stars:150': 12000, 'stars:200': 8000, 'stars:250': 4000, 'stars:500': 2000, 'stars:1000': 1000 }
  for (const [key, count] of Object.entries(expected)) assert.ok(Math.abs(result.counts[key] - count) < 800, `${key} outside tolerance`)
})
