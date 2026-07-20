import assert from 'node:assert/strict'
import test from 'node:test'
import { normaliseRecyclerItems, recyclerFingerprint, validateRecyclerSelection } from '../api/_recycler.js'

const normalRecipe = { recipe_id: 'shredder-normal-cards-v1', rarity: 'common', batch_size: 5, reward: { currencyId: 'coins', amount: 10 }, enabled: true, selection_type: 'normal-card-any' }
const foilRecipe = { recipe_id: 'shredder-foil-card-v1', rarity: 'common', batch_size: 1, reward: { currencyId: 'coins', amount: 25 }, enabled: true, selection_type: 'foil-card-any' }
const catalog = new Map([
  ['card:test:1', { id: 'card:test:1', type: 'card', rarity: 'common' }],
  ['card:test:2', { id: 'card:test:2', type: 'card', rarity: 'common' }],
  ['card:test:rare', { id: 'card:test:rare', type: 'card', rarity: 'rare' }],
  ['card:test:gold', { id: 'card:test:gold', type: 'card_variant', variant: 'gold', rarity: 'common' }],
  ['card:test:foil', { id: 'card:test:foil', type: 'card_variant', variant: 'foil', rarity: 'common' }],
  ['inventory:key', { id: 'inventory:key', type: 'key', rarity: 'common' }],
])

test('shredder selection combines cards and creates an order-independent fingerprint', () => {
  assert.deepEqual(normaliseRecyclerItems([
    { itemId: 'card:test:2', quantity: 2 },
    { itemId: 'card:test:1', quantity: 1 },
    { itemId: 'card:test:2', quantity: 2 },
  ]), [
    { itemId: 'card:test:1', quantity: 1 },
    { itemId: 'card:test:2', quantity: 4 },
  ])
  assert.equal(
    recyclerFingerprint('shredder-normal-cards-v1', [{ itemId: 'card:test:1', quantity: 1 }, { itemId: 'card:test:2', quantity: 4 }]),
    recyclerFingerprint('shredder-normal-cards-v1', [{ itemId: 'card:test:2', quantity: 4 }, { itemId: 'card:test:1', quantity: 1 }]),
  )
})

test('shredder accepts any five normal unbound cards and reports batch count', () => {
  assert.deepEqual(validateRecyclerSelection([
    { itemId: 'card:test:1', quantity: 4 },
    { itemId: 'card:test:rare', quantity: 1 },
  ], normalRecipe, catalog), {
    selection: [{ itemId: 'card:test:1', quantity: 4 }, { itemId: 'card:test:rare', quantity: 1 }],
    cardsConsumed: 5,
    batches: 1,
    selectionType: 'normal-card-any',
  })
})

test('exactly five eligible normal cards calculate exactly ten Coins', () => {
  const result = validateRecyclerSelection([{ itemId: 'card:test:1', quantity: 5 }], normalRecipe, catalog)
  assert.equal(result.cardsConsumed, 5)
  assert.equal(result.batches * normalRecipe.reward.amount, 10)
})

test('one eligible Foil calculates exactly twenty-five Coins', () => {
  const result = validateRecyclerSelection([{ itemId: 'card:test:foil', quantity: 1 }], foilRecipe, catalog)
  assert.equal(result.cardsConsumed, 1)
  assert.equal(result.batches * foilRecipe.reward.amount, 25)
})

test('shredder rejects incomplete, collector, non-card and wrong-kind selections', () => {
  assert.throws(() => validateRecyclerSelection([{ itemId: 'card:test:1', quantity: 4 }], normalRecipe, catalog), error => error.code === 'RECYCLER_INCOMPLETE_BATCH')
  assert.throws(() => validateRecyclerSelection([{ itemId: 'card:test:gold', quantity: 5 }], normalRecipe, catalog), error => error.code === 'RECYCLER_COLLECTOR_CARD')
  assert.throws(() => validateRecyclerSelection([{ itemId: 'inventory:key', quantity: 5 }], normalRecipe, catalog), /Only collectible cards/)
  assert.throws(() => validateRecyclerSelection([{ itemId: 'card:test:1', quantity: 1 }], foilRecipe, catalog), error => error.code === 'RECYCLER_FOIL_REQUIRED')
})
