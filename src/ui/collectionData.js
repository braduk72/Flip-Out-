import { DECKS } from '../data/decks.js'
import { ITEM_CATALOG, RARITIES } from '../data/itemCatalog.js'

export const COLLECTION_ALBUMS = Object.freeze([
  { id: 'living-world', name: 'Living World', detail: 'Animals, plants and the natural world', setIds: ['babyAnimals', 'animalsOfAustralia', 'fruits', 'flowers', 'cats', 'woof', 'birdsOfPrey'] },
  { id: 'engines-discovery', name: 'Engines & Discovery', detail: 'Machines, travel and exploration', setIds: ['sportscars', 'fighterJets', 'policeVehicles', 'conquestOfSpace', 'oceanLiners'] },
  { id: 'heritage-legends', name: 'Heritage & Legends', detail: 'Landmarks, lost worlds and history', setIds: ['WorldLandmarks', 'mastersOfTheLostWorld', 'KingsandQueens'] },
])

export const COLLECTION_MILESTONES = Object.freeze([10, 25, 50, 75, 100])

export const RARITY_STARS = Object.freeze({
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
})

export const THEME_ALBUM_PRESENTATION = Object.freeze({
  cats: {
    family: 'cats',
    mood: 'Warm scrapbook',
    background: 'radial-gradient(circle at 15% 15%, rgba(251, 191, 36, .24), transparent 32%), linear-gradient(135deg, #2d1b42, #151024)',
    texture: 'soft fabric grain',
    motif: 'paw prints',
    plaque: 'stitched gold ribbon',
    accent: '#fbbf24',
  },
  woof: {
    family: 'cats',
    mood: 'Companion scrapbook',
    background: 'radial-gradient(circle at 85% 8%, rgba(196, 181, 253, .18), transparent 35%), linear-gradient(135deg, #211535, #10172a)',
    texture: 'soft paper',
    motif: 'pet badges',
    plaque: 'stitched violet ribbon',
    accent: '#c4b5fd',
  },
  mastersOfTheLostWorld: {
    family: 'dinosaurs',
    mood: 'Excavation journal',
    background: 'radial-gradient(circle at 12% 10%, rgba(251, 191, 36, .18), transparent 35%), linear-gradient(135deg, #33220b, #111827)',
    texture: 'stone and fossil rubbings',
    motif: 'fossils',
    plaque: 'aged museum brass',
    accent: '#d97706',
  },
  conquestOfSpace: {
    family: 'space',
    mood: 'Deep-space observatory',
    background: 'radial-gradient(circle at 85% 12%, rgba(34, 211, 238, .2), transparent 34%), linear-gradient(135deg, #050816, #11154a)',
    texture: 'star field',
    motif: 'constellations',
    plaque: 'instrument-panel cyan',
    accent: '#22d3ee',
  },
  sportscars: {
    family: 'cars',
    mood: 'Chrome workshop',
    background: 'radial-gradient(circle at 90% 15%, rgba(248, 113, 113, .18), transparent 32%), linear-gradient(135deg, #250b12, #111827)',
    texture: 'leather and dashboard grain',
    motif: 'chrome trim',
    plaque: 'painted enamel badge',
    accent: '#ef4444',
  },
  birdsOfPrey: {
    family: 'wildlife',
    mood: 'Field journal',
    background: 'radial-gradient(circle at 18% 10%, rgba(74, 222, 128, .15), transparent 32%), linear-gradient(135deg, #17251a, #101827)',
    texture: 'natural paper',
    motif: 'feathers and botanical marks',
    plaque: 'botanical label',
    accent: '#86efac',
  },
})

const CARD_TYPES = new Set(['card', 'card_variant'])
const RARITY_ORDER = new Map(RARITIES.map((rarity, index) => [rarity, index]))
const deckById = new Map(DECKS.map(deck => [deck.id, deck]))

function setIdFor(item) {
  const reference = item.deckId ?? item.baseDeckId
  return String(reference ?? '').replace(/^deck:/, '')
}

function numberFor(item) {
  const value = item.id.split(':').at(-1)
  return /^\d+$/.test(value) ? Number(value) : Number.MAX_SAFE_INTEGER
}

function rarityStars(rarity) {
  return RARITY_STARS[rarity] ?? 1
}

function variantKey(itemId, variant = 'normal') {
  return `${itemId}:${variant}`
}

function collectorKey(themeId, tier) {
  return `${themeId}:${tier}`
}

function collectorCardsFor({ deck, collectors, variants }) {
  const goldVariant = variants.find(card => card.isGold)
  return [
    {
      tier: 'gold',
      label: 'Gold Collector Card',
      requirement: 'Complete Normal and Foil sets',
      earned: collectors.gold,
      asset: goldVariant?.asset ?? null,
      name: goldVariant?.name ?? `${deck.name} Gold Collector Card`,
    },
    {
      tier: 'bronze',
      label: 'Bronze Collector Card',
      requirement: 'Complete every Normal card',
      earned: collectors.bronze,
      asset: null,
      name: `${deck.name} Bronze Collector Card`,
    },
    {
      tier: 'silver',
      label: 'Silver Collector Card',
      requirement: 'Complete every Foil card',
      earned: collectors.silver,
      asset: null,
      name: `${deck.name} Silver Collector Card`,
    },
  ]
}

function themePresentation(deck) {
  return THEME_ALBUM_PRESENTATION[deck.id] ?? {
    family: 'classic',
    mood: 'Premium collector album',
    background: `radial-gradient(circle at 88% 10%, color-mix(in srgb, ${deck.borderColor ?? '#22d3ee'} 28%, transparent), transparent 34%), linear-gradient(135deg, #111827, #070b18)`,
    texture: 'collector paper',
    motif: 'subtle foil lines',
    plaque: 'illuminated title plaque',
    accent: deck.borderColor ?? '#22d3ee',
  }
}

function timestamp(value) {
  const parsed = Date.parse(value ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildCollectionData(state = {}, favouriteIds = []) {
  const inventoryById = new Map((state.inventory ?? []).map(row => [row.item_id, row]))
  const stuckEntries = new Map((state.themeAlbums?.entries ?? []).map(row => [variantKey(row.card_item_id, row.variant ?? 'normal'), row]))
  const collectorEntries = new Map((state.themeAlbums?.collectors ?? []).map(row => [collectorKey(row.theme_id, row.collector_tier), row]))
  const personalAlbumCards = new Map()
  for (const row of state.personalAlbums?.cards ?? []) {
    const key = `${row.item_id}:${row.variant ?? 'normal'}`
    const albums = personalAlbumCards.get(key) ?? []
    albums.push(row.album_id)
    personalAlbumCards.set(key, albums)
  }
  const favouriteSet = new Set(favouriteIds)
  const obtained = new Map()
  for (const row of state.transactions ?? []) {
    if (!row.item_id || Number(row.amount) <= 0 || obtained.has(row.item_id)) continue
    obtained.set(row.item_id, row.created_at ?? null)
  }

  const cards = ITEM_CATALOG.filter(item => CARD_TYPES.has(item.type)).map(item => {
    const setId = setIdFor(item)
    const deck = deckById.get(setId)
    const inventory = inventoryById.get(item.id)
    const quantity = Number(inventory?.quantity) || 0
    const boundQuantity = Number(inventory?.bound_quantity) || 0
    const variant = item.variant ?? 'base'
    const albumVariant = variant === 'base' ? 'normal' : variant
    const stuckEntry = stuckEntries.get(variantKey(item.id, albumVariant))
    const normalStuckEntry = stuckEntries.get(variantKey(item.id, 'normal'))
    const foilStuckEntry = stuckEntries.get(variantKey(item.id, 'foil'))
    const stuckInThemeAlbum = Boolean(stuckEntry)
    const personalAlbumIds = personalAlbumCards.get(`${item.id}:${albumVariant}`) ?? []
    return {
      ...item,
      setId,
      setName: deck?.name ?? 'Unknown Set',
      setColour: deck?.borderColor ?? '#22d3ee',
      number: numberFor(item),
      rarityStars: rarityStars(item.rarity),
      quantity,
      inventoryQuantity: quantity,
      boundQuantity,
      recyclableQuantity: Math.max(0, quantity - Math.max(1, boundQuantity)),
      shreddableQuantity: Math.max(0, quantity - boundQuantity),
      stuckInThemeAlbum,
      normalStuckInThemeAlbum: Boolean(normalStuckEntry),
      foilStuckInThemeAlbum: Boolean(foilStuckEntry),
      albumStuckAt: stuckEntry?.stuck_at ?? null,
      eligibleForThemeAlbum: quantity > 0 && !stuckInThemeAlbum && variant === 'base',
      personalAlbumIds,
      owned: quantity > 0 || stuckInThemeAlbum,
      favourite: favouriteSet.has(item.id),
      obtainedAt: obtained.get(item.id) ?? null,
      variant,
      isFoil: variant === 'foil' || /foil/i.test(item.id),
      isGold: variant === 'gold',
    }
  })

  const sets = DECKS.map(deck => {
    const setCards = cards.filter(card => card.setId === deck.id && card.variant === 'base')
    const variants = cards.filter(card => card.setId === deck.id && card.variant !== 'base')
    const normalStuck = setCards.filter(card => card.normalStuckInThemeAlbum).length
    const foilStuck = setCards.filter(card => card.foilStuckInThemeAlbum).length
    const inventoryOwned = setCards.filter(card => card.inventoryQuantity > 0).length
    const owned = normalStuck
    const total = setCards.length
    const overallFilled = normalStuck + foilStuck
    const overallTotal = total * 2
    const collectors = {
      bronze: collectorEntries.has(collectorKey(deck.id, 'bronze')),
      silver: collectorEntries.has(collectorKey(deck.id, 'silver')),
      gold: collectorEntries.has(collectorKey(deck.id, 'gold')),
    }
    const collectorCards = collectorCardsFor({ deck, collectors, variants })
    return {
      id: deck.id,
      name: deck.name,
      detail: `${setCards.length} cards`,
      colour: deck.borderColor,
      coverAssets: setCards.slice(0, 3).map(card => card.asset),
      coverAsset: setCards[0]?.asset ?? (deck.backFile ? `${deck.path}/${deck.backFile}` : '/images/back.webp'),
      presentation: themePresentation(deck),
      cards: setCards.sort((a, b) => a.number - b.number),
      owned,
      total,
      normalStuck,
      normalTotal: total,
      normalPercent: total ? Math.round((normalStuck / total) * 100) : 0,
      foilStuck,
      foilTotal: total,
      foilPercent: total ? Math.round((foilStuck / total) * 100) : 0,
      overallFilled,
      overallTotal,
      overallPercent: overallTotal ? Math.round((overallFilled / overallTotal) * 100) : 0,
      inventoryOwned,
      eligibleInventory: setCards.filter(card => card.eligibleForThemeAlbum).length,
      percent: total ? Math.round((owned / total) * 100) : 0,
      missing: Math.max(0, total - owned),
      complete: Boolean(total) && owned === total,
      favourites: setCards.filter(card => card.favourite).length,
      goldOwned: variants.some(card => card.isGold && card.owned),
      goldAvailable: variants.some(card => card.isGold),
      collectors,
      collectorCards,
    }
  })
  const setById = new Map(sets.map(set => [set.id, set]))
  const albums = COLLECTION_ALBUMS.map(album => {
    const albumSets = album.setIds.map(id => setById.get(id)).filter(Boolean)
    const owned = albumSets.reduce((sum, set) => sum + set.owned, 0)
    const total = albumSets.reduce((sum, set) => sum + set.total, 0)
    return { ...album, sets: albumSets, owned, total, percent: total ? Math.round((owned / total) * 100) : 0, complete: Boolean(total) && owned === total }
  })

  const baseCards = cards.filter(card => card.variant === 'base')
  const uniqueOwned = cards.filter(card => card.owned).length
  const baseOwned = baseCards.filter(card => card.normalStuckInThemeAlbum).length
  const recent = cards.filter(card => card.owned && card.obtainedAt).sort((a, b) => timestamp(b.obtainedAt) - timestamp(a.obtainedAt)).slice(0, 12)
  const rarity = Object.fromEntries(RARITIES.map(name => [name, {
    total: cards.filter(card => card.rarity === name).length,
    owned: cards.filter(card => card.rarity === name && card.owned).length,
  }]))
  const milestones = COLLECTION_MILESTONES.map(percent => {
    const target = Math.ceil(baseCards.length * percent / 100)
    return { percent, target, complete: baseOwned >= target }
  })
  const nonCards = (state.inventory ?? []).map(row => ({
    ...row,
    quantity: Number(row.quantity) || 0,
    definition: ITEM_CATALOG.find(item => item.id === row.item_id),
  })).filter(row => row.quantity > 0 && row.definition && !CARD_TYPES.has(row.definition.type))

  return {
    cards,
    sets,
    officialThemeAlbums: sets,
    albums,
    personalAlbums: state.personalAlbums ?? { albums: [], cards: [], limit: 10, createCostCoins: 500 },
    inventoryCapacity: state.inventoryCapacity ?? { cardCapacity: null, cardCount: null, remainingCardSlots: null },
    recent,
    nonCards,
    stats: {
      uniqueOwned,
      totalCollectibles: cards.length,
      baseOwned,
      totalBase: baseCards.length,
      completion: baseCards.length ? Math.round((baseOwned / baseCards.length) * 100) : 0,
      duplicates: cards.reduce((sum, card) => sum + Math.max(0, card.quantity - 1), 0),
      recyclableDuplicates: cards.reduce((sum, card) => sum + card.recyclableQuantity, 0),
      favourites: cards.filter(card => card.favourite).length,
      completedSets: sets.filter(set => set.complete).length,
      totalSets: sets.length,
      goldOwned: cards.filter(card => card.isGold && card.owned).length,
      goldTotal: cards.filter(card => card.isGold).length,
      foilOwned: cards.filter(card => card.isFoil && card.owned).length,
      foilTotal: cards.filter(card => card.isFoil).length,
      rarity,
      milestones,
      nextMilestone: milestones.find(milestone => !milestone.complete) ?? milestones.at(-1),
    },
  }
}

export function buildRecyclerModel(cards = [], recipe = null, selection = {}) {
  const batchSize = Number(recipe?.batchSize) || 0
  const selectionType = recipe?.selectionType ?? 'duplicates-by-rarity'
  const eligibilityQuantity = card => selectionType === 'duplicates-by-rarity' ? card.recyclableQuantity : card.shreddableQuantity
  const eligibleCards = cards.filter(card => {
    if (selectionType === 'normal-card-any') return card.type === 'card' && eligibilityQuantity(card) > 0
    if (selectionType === 'foil-card-any') return card.isFoil && eligibilityQuantity(card) > 0
    return card.rarity === recipe?.rarity && eligibilityQuantity(card) > 0
  })
  const selectedItems = eligibleCards.map(card => ({
    card,
    quantity: Math.max(0, Math.min(eligibilityQuantity(card), Number(selection[card.id]) || 0)),
  })).filter(entry => entry.quantity > 0)
  const cardsSelected = selectedItems.reduce((sum, entry) => sum + entry.quantity, 0)
  const batches = batchSize > 0 ? Math.floor(cardsSelected / batchSize) : 0
  const complete = batchSize > 1 && cardsSelected > 0 && cardsSelected % batchSize === 0
  const rewardAmount = complete ? Number(recipe?.reward?.amount ?? 0) * batches : 0
  const targetCards = batchSize > 0 ? Math.max(batchSize, Math.ceil(cardsSelected / batchSize) * batchSize) : 1
  return {
    eligibleCards,
    selectedItems,
    cardsSelected,
    batchSize,
    batches,
    complete,
    selectionType,
    reward: complete ? { ...recipe.reward, amount: rewardAmount } : null,
    nextBatchProgress: batchSize > 0 ? cardsSelected % batchSize : 0,
    targetCards,
    cardsNeeded: complete ? 0 : targetCards - cardsSelected,
  }
}

export function formatRecyclerReward(reward = {}) {
  const amount = Number(reward.amount) || 0
  const rawLabel = reward.currencyId ?? reward.itemId ?? 'reward'
  const label = rawLabel === 'stars' ? 'Star' : rawLabel === 'coins' ? 'Coin' : String(rawLabel)
  return `${amount} ${amount === 1 ? label : `${label}s`}`
}

export function filterCollectionCards(cards, {
  query = '', setId = 'all', ownership = 'all', rarity = 'all', variant = 'all', favouritesOnly = false, sort = 'set',
} = {}) {
  const needle = query.trim().toLocaleLowerCase()
  const result = cards.filter(card => {
    if (setId !== 'all' && card.setId !== setId) return false
    if (ownership === 'owned' && !card.owned) return false
    if (ownership === 'missing' && card.owned) return false
    if (rarity !== 'all' && card.rarity !== rarity) return false
    if (variant === 'base' && card.variant !== 'base') return false
    if (variant === 'gold' && !card.isGold) return false
    if (variant === 'foil' && !card.isFoil) return false
    if (favouritesOnly && !card.favourite) return false
    return !needle || `${card.name} ${card.setName} ${card.rarity} ${card.variant}`.toLocaleLowerCase().includes(needle)
  })
  return result.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'rarity') return (RARITY_ORDER.get(b.rarity) ?? 0) - (RARITY_ORDER.get(a.rarity) ?? 0) || a.name.localeCompare(b.name)
    if (sort === 'newest') return timestamp(b.obtainedAt) - timestamp(a.obtainedAt) || a.name.localeCompare(b.name)
    return a.setName.localeCompare(b.setName) || a.number - b.number || a.variant.localeCompare(b.variant)
  })
}

export function readCollectionFavourites(storage, playerId = 'guest') {
  try {
    const value = JSON.parse(storage?.getItem(`fo_collection_favourites:${playerId}`) ?? '[]')
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string'))] : []
  } catch { return [] }
}

export function writeCollectionFavourites(storage, playerId = 'guest', ids = []) {
  storage?.setItem(`fo_collection_favourites:${playerId}`, JSON.stringify([...new Set(ids)]))
}
