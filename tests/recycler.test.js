import assert from 'node:assert/strict'
import test from 'node:test'
import { normaliseRecyclerItems, recyclerFingerprint, validateRecyclerSelection } from '../api/_recycler.js'

const recipe = { recipe_id: 'common-stars-v1', rarity: 'common', batch_size: 5, reward: { currencyId: 'stars', amount: 1 }, enabled: true }
const catalog = new Map([
  ['card:test:1', { id: 'card:test:1', type: 'card', rarity: 'common' }],
  ['card:test:2', { id: 'card:test:2', type: 'card', rarity: 'common' }],
  ['card:test:rare', { id: 'card:test:rare', type: 'card', rarity: 'rare' }],
  ['inventory:key', { id: 'inventory:key', type: 'key', rarity: 'common' }],
])

test('recycler selection combines duplicates and creates an order-independent fingerprint', () => {
  assert.deepEqual(normaliseRecyclerItems([
    { itemId: 'card:test:2', quantity: 2 },
    { itemId: 'card:test:1', quantity: 1 },
    { itemId: 'card:test:2', quantity: 2 },
  ]), [
    { itemId: 'card:test:1', quantity: 1 },
    { itemId: 'card:test:2', quantity: 4 },
  ])
  assert.equal(
    recyclerFingerprint('common-stars-v1', [{ itemId: 'card:test:1', quantity: 1 }, { itemId: 'card:test:2', quantity: 4 }]),
    recyclerFingerprint('common-stars-v1', [{ itemId: 'card:test:2', quantity: 4 }, { itemId: 'card:test:1', quantity: 1 }]),
  )
})

test('recycler accepts complete same-rarity batches and reports batch count', () => {
  assert.deepEqual(validateRecyclerSelection([
    { itemId: 'card:test:1', quantity: 4 },
    { itemId: 'card:test:2', quantity: 6 },
  ], recipe, catalog), {
    selection: [{ itemId: 'card:test:1', quantity: 4 }, { itemId: 'card:test:2', quantity: 6 }],
    cardsConsumed: 10,
    batches: 2,
  })
})

test('exactly five eligible common duplicates calculate exactly one Star', () => {
  const result = validateRecyclerSelection([{ itemId: 'card:test:1', quantity: 5 }], recipe, catalog)
  assert.equal(result.cardsConsumed, 5)
  assert.equal(result.batches * recipe.reward.amount, 1)
})

test('recycler rejects incomplete, wrong-rarity and non-card selections', () => {
  assert.throws(() => validateRecyclerSelection([{ itemId: 'card:test:1', quantity: 4 }], recipe, catalog), error => error.code === 'RECYCLER_INCOMPLETE_BATCH')
  assert.throws(() => validateRecyclerSelection([{ itemId: 'card:test:rare', quantity: 5 }], recipe, catalog), error => error.code === 'RECYCLER_RARITY_MISMATCH')
  assert.throws(() => validateRecyclerSelection([{ itemId: 'inventory:key', quantity: 5 }], recipe, catalog), /Only collectible cards/)
})
