import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectorTiersForCompletion,
  resolveThemeAlbumCard,
  themeAlbumFingerprint,
  themeAlbumTotals,
} from '../api/_themeAlbums.js'

const catalog = new Map([
  ['card:test:1', { id: 'card:test:1', type: 'card', deckId: 'deck:test', rarity: 'common' }],
  ['card:test:gold', { id: 'card:test:gold', type: 'card_variant', variant: 'gold', baseDeckId: 'deck:test', rarity: 'legendary' }],
  ['powerup:test', { id: 'powerup:test', type: 'powerup', rarity: 'common' }],
])

test('Theme Album card resolution accepts normal catalogue cards only', () => {
  assert.deepEqual(resolveThemeAlbumCard('card:test:1', 'normal', catalog), {
    item: catalog.get('card:test:1'),
    itemId: 'card:test:1',
    themeId: 'test',
    variant: 'normal',
  })
  assert.throws(() => resolveThemeAlbumCard('powerup:test', 'normal', catalog), error => error.code === 'THEME_ALBUM_CARD_UNSUPPORTED')
  assert.throws(() => resolveThemeAlbumCard('card:test:gold', 'normal', catalog), error => error.code === 'THEME_ALBUM_COLLECTOR_CARD')
  assert.throws(() => resolveThemeAlbumCard('card:test:1', 'foil', catalog), error => error.code === 'THEME_ALBUM_FOIL_UNSUPPORTED')
})

test('Theme Album idempotency fingerprint is stable and variant-sensitive', () => {
  assert.equal(
    themeAlbumFingerprint({ itemId: 'card:test:1', variant: 'normal' }),
    themeAlbumFingerprint({ itemId: 'card:test:1', variant: 'normal' }),
  )
  assert.notEqual(
    themeAlbumFingerprint({ itemId: 'card:test:1', variant: 'normal' }),
    themeAlbumFingerprint({ itemId: 'card:test:2', variant: 'normal' }),
  )
})

test('Theme Album totals are data-driven by theme size', () => {
  const totals = themeAlbumTotals([
    { id: 'card:a:1', type: 'card', deckId: 'deck:a' },
    { id: 'card:a:2', type: 'card', deckId: 'deck:a' },
    { id: 'card:b:1', type: 'card', deckId: 'deck:b' },
    { id: 'card:b:gold', type: 'card_variant', variant: 'gold', baseDeckId: 'deck:b' },
  ])
  assert.equal(totals.get('a'), 2)
  assert.equal(totals.get('b'), 1)
})

test('collector tiers are awarded from normal and Foil completion independently', () => {
  assert.deepEqual(collectorTiersForCompletion({ normalCount: 3, foilCount: 0, total: 3 }), ['bronze'])
  assert.deepEqual(collectorTiersForCompletion({ normalCount: 0, foilCount: 3, total: 3 }), ['silver'])
  assert.deepEqual(collectorTiersForCompletion({ normalCount: 3, foilCount: 3, total: 3 }), ['bronze', 'silver', 'gold'])
  assert.deepEqual(collectorTiersForCompletion({ normalCount: 2, foilCount: 3, total: 3 }), ['silver'])
})
