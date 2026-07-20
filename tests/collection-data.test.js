import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCollectionData, buildRecyclerModel, filterCollectionCards, formatRecyclerReward, readCollectionFavourites, writeCollectionFavourites } from '../src/ui/collectionData.js'

const state = {
  profile: { player_id: 'collector-one' },
  inventory: [
    { item_id: 'card:sportscars:1', quantity: 2, bound_quantity: 0 },
    { item_id: 'card:sportscars:gold', quantity: 1, bound_quantity: 0 },
    { item_id: 'card:cats:1', quantity: 1, bound_quantity: 0 },
    { item_id: 'inventory:lockbox:standard', quantity: 2, bound_quantity: 0 },
  ],
  transactions: [
    { item_id: 'card:sportscars:1', amount: 1, created_at: '2026-07-18T10:00:00Z' },
    { item_id: 'card:cats:1', amount: 1, created_at: '2026-07-19T10:00:00Z' },
  ],
}

test('collection model builds albums, sets, ownership, recency and statistics from authoritative data', () => {
  const model = buildCollectionData(state, ['card:sportscars:1'])
  assert.equal(model.albums.length, 3)
  assert.equal(model.sets.length, 15)
  assert.equal(model.stats.totalBase, 653)
  assert.equal(model.stats.goldTotal, 7)
  assert.equal(model.stats.foilTotal, 0)
  assert.equal(model.stats.uniqueOwned, 3)
  assert.equal(model.stats.duplicates, 1)
  assert.equal(model.stats.favourites, 1)
  assert.equal(model.recent[0].id, 'card:cats:1')
  assert.equal(model.nonCards[0].item_id, 'inventory:lockbox:standard')
  const cars = model.sets.find(entry => entry.id === 'sportscars')
  assert.equal(cars.owned, 1)
  assert.equal(cars.goldOwned, true)
})

test('official Theme Album entries count as collected without remaining in Inventory', () => {
  const model = buildCollectionData({
    inventory: [],
    themeAlbums: {
      entries: [{ card_item_id: 'card:cats:1', theme_id: 'cats', variant: 'normal', stuck_at: '2026-07-20T10:00:00Z' }],
      collectors: [{ theme_id: 'cats', collector_tier: 'bronze' }],
    },
  })
  const card = model.cards.find(entry => entry.id === 'card:cats:1')
  const cats = model.sets.find(set => set.id === 'cats')
  assert.equal(card.owned, true)
  assert.equal(card.quantity, 0)
  assert.equal(card.stuckInThemeAlbum, true)
  assert.equal(card.recyclableQuantity, 0)
  assert.equal(cats.owned, 1)
  assert.equal(cats.collectors.bronze, true)
})

test('Personal Album memberships are organisational and do not change ownership quantities', () => {
  const model = buildCollectionData({
    inventory: [{ item_id: 'card:cats:1', quantity: 1, bound_quantity: 0 }],
    personalAlbums: {
      albums: [{ album_id: '11111111-1111-4111-8111-111111111111', name: 'Black Cats' }],
      cards: [{ album_id: '11111111-1111-4111-8111-111111111111', item_id: 'card:cats:1', variant: 'normal' }],
      limit: 10,
      createCostCoins: 500,
    },
  })
  const card = model.cards.find(entry => entry.id === 'card:cats:1')
  assert.equal(card.owned, true)
  assert.equal(card.quantity, 1)
  assert.deepEqual(card.personalAlbumIds, ['11111111-1111-4111-8111-111111111111'])
  assert.equal(model.personalAlbums.createCostCoins, 500)
})

test('collection model exposes Inventory capacity readback without deriving it from Theme Album entries', () => {
  const model = buildCollectionData({
    inventory: [{ item_id: 'card:cats:1', quantity: 1, bound_quantity: 0 }],
    themeAlbums: { entries: [{ card_item_id: 'card:cats:2', theme_id: 'cats', variant: 'normal' }] },
    inventoryCapacity: { cardCapacity: 10, cardCount: 1, remainingCardSlots: 9 },
  })
  assert.deepEqual(model.inventoryCapacity, { cardCapacity: 10, cardCount: 1, remainingCardSlots: 9 })
})

test('card filters combine search, set, ownership, rarity, variants and deterministic sorting', () => {
  const model = buildCollectionData(state)
  const ownedCars = filterCollectionCards(model.cards, { query: 'Ferrari 488', setId: 'sportscars', ownership: 'owned' })
  assert.deepEqual(ownedCars.map(card => card.id), ['card:sportscars:1'])
  const gold = filterCollectionCards(model.cards, { variant: 'gold', rarity: 'legendary', sort: 'name' })
  assert.equal(gold.length, 7)
  assert.ok(gold.every(card => card.isGold && card.rarity === 'legendary'))
  const foil = filterCollectionCards(model.cards, { variant: 'foil' })
  assert.equal(foil.length, 0)
  const favourites = filterCollectionCards(buildCollectionData(state, ['card:cats:1']).cards, { favouritesOnly: true })
  assert.deepEqual(favourites.map(card => card.id), ['card:cats:1'])
})

test('favourites are retry-safe and isolated by player account', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  writeCollectionFavourites(storage, 'one', ['card:cats:1', 'card:cats:1'])
  writeCollectionFavourites(storage, 'two', ['card:woof:1'])
  assert.deepEqual(readCollectionFavourites(storage, 'one'), ['card:cats:1'])
  assert.deepEqual(readCollectionFavourites(storage, 'two'), ['card:woof:1'])
})

test('recycler model exposes only copies above the protected final copy and complete batches', () => {
  const model = buildCollectionData({ inventory: [
    { item_id: 'card:sportscars:1', quantity: 4, bound_quantity: 0 },
    { item_id: 'card:cats:1', quantity: 3, bound_quantity: 2 },
    { item_id: 'card:woof:1', quantity: 2, bound_quantity: 0 },
  ] })
  const recipe = { recipeId: 'common-stars-v1', rarity: 'common', batchSize: 5, reward: { currencyId: 'stars', amount: 1 } }
  assert.equal(model.cards.find(card => card.id === 'card:sportscars:1').recyclableQuantity, 3)
  assert.equal(model.cards.find(card => card.id === 'card:cats:1').recyclableQuantity, 1)
  const incomplete = buildRecyclerModel(model.cards, recipe, { 'card:sportscars:1': 3, 'card:cats:1': 1 })
  assert.equal(incomplete.complete, false)
  assert.equal(incomplete.cardsNeeded, 1)
  const complete = buildRecyclerModel(model.cards, recipe, { 'card:sportscars:1': 3, 'card:cats:1': 1, 'card:woof:1': 1 })
  assert.equal(complete.complete, true)
  assert.equal(complete.cardsSelected, 5)
  assert.deepEqual(complete.reward, { currencyId: 'stars', amount: 1 })
})

test('recycler reward copy uses singular Star for the one-Star recipe', () => {
  assert.equal(formatRecyclerReward({ currencyId: 'stars', amount: 1 }), '1 Star')
  assert.equal(formatRecyclerReward({ currencyId: 'stars', amount: 5 }), '5 Stars')
})
