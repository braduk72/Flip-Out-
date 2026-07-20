import { DECKS } from '../data/decks.js'
import { ITEM_CATALOG, RARITIES } from '../data/itemCatalog.js'

export const COLLECTION_ALBUMS = Object.freeze([
  { id: 'living-world', name: 'Living World', detail: 'Animals, plants and the natural world', setIds: ['babyAnimals', 'animalsOfAustralia', 'fruits', 'flowers', 'cats', 'woof', 'birdsOfPrey'] },
  { id: 'engines-discovery', name: 'Engines & Discovery', detail: 'Machines, travel and exploration', setIds: ['sportscars', 'fighterJets', 'policeVehicles', 'conquestOfSpace', 'oceanLiners'] },
  { id: 'heritage-legends', name: 'Heritage & Legends', detail: 'Landmarks, lost worlds and history', setIds: ['WorldLandmarks', 'mastersOfTheLostWorld', 'KingsandQueens'] },
])

export const COLLECTION_MILESTONES = Object.freeze([10, 25, 50, 75, 100])

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

function timestamp(value) {
  const parsed = Date.parse(value ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildCollectionData(state = {}, favouriteIds = []) {
  const inventoryById = new Map((state.inventory ?? []).map(row => [row.item_id, row]))
  const stuckEntries = new Map((state.themeAlbums?.entries ?? []).map(row => [`${row.card_item_id}:${row.variant ?? 'normal'}`, row]))
  const collectorEntries = new Map((state.themeAlbums?.collectors ?? []).map(row => [`${row.theme_id}:${row.collector_tier}`, row]))
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
    const stuckEntry = stuckEntries.get(`${item.id}:${albumVariant}`)
    const stuckInThemeAlbum = Boolean(stuckEntry)
    const personalAlbumIds = personalAlbumCards.get(`${item.id}:${albumVariant}`) ?? []
    return {
      ...item,
      setId,
      setName: deck?.name ?? 'Unknown Set',
      setColour: deck?.borderColor ?? '#22d3ee',
      number: numberFor(item),
      quantity,
      inventoryQuantity: quantity,
      boundQuantity,
      recyclableQuantity: Math.max(0, quantity - Math.max(1, boundQuantity)),
      stuckInThemeAlbum,
      albumStuckAt: stuckEntry?.stuck_at ?? null,
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
    const owned = setCards.filter(card => card.owned).length
    return {
      id: deck.id,
      name: deck.name,
      detail: `${setCards.length} cards`,
      colour: deck.borderColor,
      coverAssets: setCards.slice(0, 3).map(card => card.asset),
      owned,
      total: setCards.length,
      percent: setCards.length ? Math.round((owned / setCards.length) * 100) : 0,
      missing: Math.max(0, setCards.length - owned),
      complete: Boolean(setCards.length) && owned === setCards.length,
      favourites: setCards.filter(card => card.favourite).length,
      goldOwned: variants.some(card => card.isGold && card.owned),
      goldAvailable: variants.some(card => card.isGold),
      collectors: {
        bronze: collectorEntries.has(`${deck.id}:bronze`),
        silver: collectorEntries.has(`${deck.id}:silver`),
        gold: collectorEntries.has(`${deck.id}:gold`),
      },
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
  const baseOwned = baseCards.filter(card => card.owned).length
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
  const eligibleCards = cards.filter(card => card.rarity === recipe?.rarity && card.recyclableQuantity > 0)
  const selectedItems = eligibleCards.map(card => ({
    card,
    quantity: Math.max(0, Math.min(card.recyclableQuantity, Number(selection[card.id]) || 0)),
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
