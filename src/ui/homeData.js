import { ITEM_BY_ID, ITEM_CATALOG } from '../data/itemCatalog.js'
import { playerGameApi } from '../utils/gameApi.js'

const CARD_TYPES = new Set(['card', 'card_variant'])

function balanceMap(rows = []) {
  return Object.fromEntries(rows.map(row => [row.currency_id, Number(row.balance)]))
}

function profileOverrides(storage) {
  if (!storage) return {}
  const level = Number(storage.getItem('fo_player_level'))
  const xp = Number(storage.getItem('fo_player_xp'))
  const xpTarget = Number(storage.getItem('fo_player_xp_target'))
  return {
    playerName: storage.getItem('fo_player_name') || null,
    level: Number.isSafeInteger(level) && level > 0 ? level : null,
    xp: Number.isSafeInteger(xp) && xp >= 0 ? xp : null,
    xpTarget: Number.isSafeInteger(xpTarget) && xpTarget > 0 ? xpTarget : null,
  }
}

export function normaliseHomeData({ playerPayload, match3Payload, liveOpsPayload, seasonStep = 0, storage = globalThis.localStorage } = {}) {
  const state = playerPayload?.state ?? {}
  const balances = balanceMap(state.balances)
  const inventory = state.inventory ?? []
  const cardInventory = inventory.filter(row => CARD_TYPES.has(ITEM_BY_ID.get(row.item_id)?.type))
  const newestTransaction = (state.transactions ?? []).find(row => CARD_TYPES.has(ITEM_BY_ID.get(row.item_id)?.type))
  const newestItem = newestTransaction ? ITEM_BY_ID.get(newestTransaction.item_id) : ITEM_BY_ID.get(cardInventory[0]?.item_id)
  const foilRows = inventory.filter(row => /foil/i.test(row.item_id))
  const profile = state.profile ?? {}
  const overrides = profileOverrides(storage)
  const accountKind = profile.account_kind ?? 'guest'
  const shortId = String(profile.player_id ?? '').slice(0, 6)
  const totalCards = ITEM_CATALOG.filter(item => CARD_TYPES.has(item.type)).length
  const ownedCards = cardInventory.length
  const challengeProgress = new Map((liveOpsPayload?.progress ?? []).map(row => [row.challenge_id, Number(row.progress)]))
  const activeChallenge = (liveOpsPayload?.challenges ?? [])[0]
  return {
    profile: {
      accountKind,
      playerId: profile.player_id ?? null,
      playerName: overrides.playerName || (accountKind === 'guest' ? 'Guest Player' : shortId ? `Player ${shortId}` : 'Player'),
      level: overrides.level,
      xp: overrides.xp,
      xpTarget: overrides.xpTarget,
    },
    currencies: {
      stars: Number.isFinite(balances.stars) ? balances.stars : 0,
      coins: Number.isFinite(balances.coins) ? balances.coins : 0,
    },
    match3: {
      level: Number(match3Payload?.progress?.highest_unlocked_level ?? 1),
      completed: Object.keys(match3Payload?.progress?.completed_levels ?? {}).length,
      resume: match3Payload?.resume ?? null,
    },
    collection: {
      owned: ownedCards,
      total: totalCards,
      newest: newestItem ? { name: newestItem.name, asset: newestItem.asset, rarity: newestItem.rarity } : null,
    },
    foil: {
      owned: foilRows.length,
      target: 10,
      available: foilRows.length > 0,
    },
    season: { current: Math.max(0, Number(seasonStep)), total: 32, label: 'Season 1' },
    dailyLogin: playerPayload?.dailyLogin ?? { available: false },
    community: activeChallenge ? {
      id: activeChallenge.challenge_id,
      title: activeChallenge.event_type === 'community' ? 'Community Challenge' : 'Active Challenge',
      current: challengeProgress.get(activeChallenge.challenge_id) ?? 0,
      target: Number(activeChallenge.target),
    } : null,
  }
}

export async function fetchHomeData({ seasonStep = 0, storage = globalThis.localStorage } = {}) {
  const [player, match3, liveOps] = await Promise.allSettled([
    playerGameApi.state(),
    playerGameApi.match3State(),
    playerGameApi.liveOps(),
  ])
  if (player.status === 'rejected') throw player.reason
  return normaliseHomeData({
    playerPayload: player.value,
    match3Payload: match3.status === 'fulfilled' ? match3.value : null,
    liveOpsPayload: liveOps.status === 'fulfilled' ? liveOps.value : null,
    seasonStep,
    storage,
  })
}

export async function claimHomeDailyReward() {
  return playerGameApi.dailyLogin(Intl.DateTimeFormat().resolvedOptions().timeZone)
}
