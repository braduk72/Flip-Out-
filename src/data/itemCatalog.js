import { DECKS } from './decks.js'
import { SPECIAL_CARDS } from './specialCards.js'

const DEFAULT_RELEASE = '2026-01-01'

export const RARITIES = Object.freeze(['common', 'uncommon', 'rare', 'epic', 'legendary'])

function deckItems(deck) {
  const start = deck.cardStart ?? 1
  const cards = Array.from({ length: deck.cardCount }, (_, offset) => {
    const number = start + offset
    return {
      id: `card:${deck.id}:${number}`,
      type: 'card',
      deckId: `deck:${deck.id}`,
      name: deck.cardNames?.[offset] ?? `${deck.name} #${number}`,
      asset: `${deck.path}/${number}.webp`,
      rarity: 'common',
      releasedAt: deck.releasedAt ?? DEFAULT_RELEASE,
      tradable: true,
      stackable: true,
      status: 'available',
    }
  })
  const items = [{
    id: `deck:${deck.id}`, type: 'deck', name: deck.name, asset: deck.backFile ? `${deck.path}/${deck.backFile}` : '/images/back.webp',
    rarity: 'common', releasedAt: deck.releasedAt ?? DEFAULT_RELEASE, tradable: false, stackable: false, status: 'available',
  }, ...cards]
  if (deck.goldFile) items.push({
    id: `card:${deck.id}:gold`, type: 'card_variant', variant: 'gold', baseDeckId: `deck:${deck.id}`,
    name: `${deck.name} Gold Collector Card`, asset: `${deck.path}/${deck.goldFile}`, rarity: 'legendary',
    releasedAt: deck.releasedAt ?? DEFAULT_RELEASE, tradable: true, stackable: true, status: 'available',
  })
  return items
}

export const ITEM_CATALOG = Object.freeze([
  ...DECKS.flatMap(deckItems),
  ...Object.values(SPECIAL_CARDS).filter(item => !item.id.endsWith('_blocked')).map(item => ({
    id: `powerup:${item.id}`, type: 'powerup', name: item.name, asset: item.image, rarity: item.id === 'tiebreaker' ? 'rare' : 'common',
    releasedAt: DEFAULT_RELEASE, tradable: false, stackable: true, status: 'available',
  })),
  { id: 'inventory:spin', type: 'unlock', name: 'Bonus Spin', asset: '/images/spin1.webp', rarity: 'common', releasedAt: DEFAULT_RELEASE, tradable: false, stackable: true, status: 'available' },
  { id: 'inventory:lockbox:standard', type: 'lockbox', name: 'Standard Lockbox', asset: '/images/chest.webp', rarity: 'rare', releasedAt: DEFAULT_RELEASE, tradable: false, stackable: true, status: 'available' },
  { id: 'inventory:key:standard', type: 'key', name: 'Standard Key', asset: '/images/padlock.webp', rarity: 'rare', releasedAt: DEFAULT_RELEASE, tradable: false, stackable: true, status: 'available' },
  ...['hammer', 'shuffle', 'line-blast', 'color-clear', 'extra-moves'].map(id => ({ id: `powerup:match3-${id}`, type: 'powerup', name: `Match-3 ${id.replaceAll('-', ' ')}`, asset: '/images/specialcards/tiebreaker.webp', rarity: 'common', releasedAt: DEFAULT_RELEASE, tradable: false, stackable: true, status: 'available' })),
])

export const ITEM_BY_ID = new Map(ITEM_CATALOG.map(item => [item.id, item]))

export function validateCatalog(items = ITEM_CATALOG) {
  const ids = new Set()
  const errors = []
  for (const item of items) {
    if (!item.id || ids.has(item.id)) errors.push(`Duplicate or missing item id: ${item.id ?? '<missing>'}`)
    ids.add(item.id)
    if (!RARITIES.includes(item.rarity)) errors.push(`Invalid rarity for ${item.id}`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.releasedAt)) errors.push(`Invalid release date for ${item.id}`)
    if (!item.asset) errors.push(`Missing asset for ${item.id}`)
    if (item.deckId && !items.some(candidate => candidate.id === item.deckId)) errors.push(`Invalid deck reference for ${item.id}`)
  }
  return errors
}

export function annualChoiceEligibility(items, eventYear) {
  const year = Number(eventYear) - 1
  const from = `${year}-01-01`
  const through = `${year}-12-25`
  return items.filter(item => item.status === 'available' && item.releasedAt >= from && item.releasedAt <= through && item.type !== 'deck')
}
