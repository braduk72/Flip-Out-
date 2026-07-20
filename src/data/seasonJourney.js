export const ACTIVE_SEASON_ID = 'season:2026-preview'
export const SEASON_SCORE_PER_MATCH3_COMPLETION = 100
export const SEASON_SCORE_PER_LEVEL = 1000
export const SEASON_TICKETS_PER_LEVEL = 1
export const SEASON_MAX_JOURNEY_LEVEL = 100
export const SEASON_POST_100_SUPPLY_INTERVAL = 5
export const FREE_MISSION_REROLLS_PER_DAY = 2
export const MISSION_REROLL_TOKEN_ID = 'inventory:mission-reroll-token'
export const SEASON_COLLECTOR_CARD_ID = 'season:2026-preview:collector-card'

export const ACTIVE_SEASON = Object.freeze({
  id: ACTIVE_SEASON_ID,
  name: 'Preview Season',
  startsAt: '2026-07-01T00:00:00.000Z',
  endsAt: '2026-12-31T23:59:59.999Z',
  scorePerLevel: SEASON_SCORE_PER_LEVEL,
  ticketsPerLevel: SEASON_TICKETS_PER_LEVEL,
  collectorItemId: SEASON_COLLECTOR_CARD_ID,
})

export const SEASON_MISSION_DEFINITIONS = Object.freeze([
  { id: 'daily:match3-complete-1', cadence: 'daily', label: 'Complete 1 Match-3 level', eventType: 'match3-level-complete', target: 1, seasonScore: 150 },
  { id: 'daily:match3-blue-tiles', cadence: 'daily', label: 'Clear 40 blue Match-3 tiles', eventType: 'match3-token-cleared', token: 'blue', target: 40, seasonScore: 120 },
  { id: 'daily:match3-cascade-3', cadence: 'daily', label: 'Trigger 3 cascades', eventType: 'match3-cascade', target: 3, seasonScore: 100 },
  { id: 'weekly:match3-complete-10', cadence: 'weekly', label: 'Complete 10 Match-3 levels', eventType: 'match3-level-complete', target: 10, seasonScore: 900 },
  { id: 'weekly:match3-specials-20', cadence: 'weekly', label: 'Create 20 special pieces', eventType: 'match3-special-created', target: 20, seasonScore: 700 },
])

export const SEASON_REWARD_PAGES = Object.freeze([
  {
    id: 'page:starter-supplies',
    unlockLevel: 1,
    choices: Object.freeze([
      { id: 'choice:stars:250', ticketCost: 1, reward: { currencyId: 'stars', amount: 250 }, label: '250 Stars' },
      { id: 'choice:hammer:1', ticketCost: 1, reward: { itemId: 'powerup:match3-hammer', amount: 1 }, label: 'Hammer' },
      { id: 'choice:reroll:1', ticketCost: 1, reward: { itemId: MISSION_REROLL_TOKEN_ID, amount: 1 }, label: 'Mission Reroll Token' },
    ]),
  },
  {
    id: 'page:collector-push',
    unlockLevel: 25,
    choices: Object.freeze([
      { id: 'choice:stars:1000', ticketCost: 2, reward: { currencyId: 'stars', amount: 1000 }, label: '1,000 Stars' },
      { id: 'choice:random-booster:1', ticketCost: 3, reward: { itemId: 'booster:random', amount: 1 }, label: 'Random Booster' },
    ]),
  },
  {
    id: 'page:level-100',
    unlockLevel: SEASON_MAX_JOURNEY_LEVEL,
    choices: Object.freeze([
      { id: 'choice:collector-card', ticketCost: 0, reward: { itemId: SEASON_COLLECTOR_CARD_ID, amount: 1 }, label: 'Preview Collector Card', collectorOnly: true },
    ]),
  },
])

export const POST_100_SUPPLY_REWARDS = Object.freeze([
  { id: 'post100:stars', reward: { currencyId: 'stars', amount: 500 }, weight: 60 },
  { id: 'post100:powerup', reward: { itemId: 'powerup:match3-shuffle', amount: 1 }, weight: 30 },
  { id: 'post100:reroll-token', reward: { itemId: MISSION_REROLL_TOKEN_ID, amount: 1 }, weight: 10 },
])

const DISALLOWED_MISSION_EVENTS = new Set([
  'purchase',
  'coin-purchase',
  'open-paid-booster',
  'exchange-buy',
  'exchange-sell',
  'trade',
  'auction',
  'watch-advert',
  'premium',
])

export function journeyLevelForScore(score, season = ACTIVE_SEASON) {
  const safeScore = Math.max(0, Math.floor(Number(score) || 0))
  return Math.min(SEASON_MAX_JOURNEY_LEVEL, Math.floor(safeScore / season.scorePerLevel))
}

export function post100SupplyCount(score, season = ACTIVE_SEASON) {
  const safeScore = Math.max(0, Math.floor(Number(score) || 0))
  const overflow = Math.max(0, safeScore - (SEASON_MAX_JOURNEY_LEVEL * season.scorePerLevel))
  return Math.floor(overflow / (season.scorePerLevel * SEASON_POST_100_SUPPLY_INTERVAL))
}

export function seasonTicketsForLevelDelta(previousLevel, nextLevel, season = ACTIVE_SEASON) {
  const from = Math.max(0, Math.min(SEASON_MAX_JOURNEY_LEVEL, Math.floor(Number(previousLevel) || 0)))
  const to = Math.max(0, Math.min(SEASON_MAX_JOURNEY_LEVEL, Math.floor(Number(nextLevel) || 0)))
  return Math.max(0, to - from) * season.ticketsPerLevel
}

export function findSeasonChoice(choiceId, pages = SEASON_REWARD_PAGES) {
  for (const page of pages) {
    const choice = page.choices.find(candidate => candidate.id === choiceId)
    if (choice) return { page, choice }
  }
  return null
}

export function validateSeasonJourneyDesign({
  season = ACTIVE_SEASON,
  missions = SEASON_MISSION_DEFINITIONS,
  pages = SEASON_REWARD_PAGES,
  post100Rewards = POST_100_SUPPLY_REWARDS,
} = {}) {
  const errors = []
  if (!season.id || !season.collectorItemId) errors.push('Active season must define an id and collector item.')
  if (season.scorePerLevel <= 0 || season.ticketsPerLevel <= 0) errors.push('Season levels must have positive score and ticket values.')
  for (const mission of missions) {
    if (!['daily', 'weekly'].includes(mission.cadence)) errors.push(`${mission.id} must be daily or weekly.`)
    if (DISALLOWED_MISSION_EVENTS.has(mission.eventType)) errors.push(`${mission.id} uses disallowed economy/social event ${mission.eventType}.`)
    if (mission.reward?.currencyId === 'coins' || mission.reward?.currencyId === 'seasonTickets') errors.push(`${mission.id} must not directly reward Coins or Season Tickets.`)
    if (!Number.isSafeInteger(mission.target) || mission.target <= 0) errors.push(`${mission.id} must have a positive integer target.`)
    if (!Number.isSafeInteger(mission.seasonScore) || mission.seasonScore <= 0) errors.push(`${mission.id} must reward positive Season Score.`)
  }
  for (const page of pages) {
    if (!Number.isSafeInteger(page.unlockLevel) || page.unlockLevel < 0 || page.unlockLevel > SEASON_MAX_JOURNEY_LEVEL) errors.push(`${page.id} has an invalid unlock level.`)
    for (const choice of page.choices) {
      if (!Number.isSafeInteger(choice.ticketCost) || choice.ticketCost < 0) errors.push(`${choice.id} has an invalid ticket cost.`)
      if (choice.reward?.currencyId === 'coins') errors.push(`${choice.id} must not create Coins.`)
      if (choice.reward?.itemId === season.collectorItemId && page.unlockLevel !== SEASON_MAX_JOURNEY_LEVEL) errors.push(`${choice.id} awards the collector card before level 100.`)
    }
  }
  for (const entry of post100Rewards) {
    if (entry.reward?.currencyId === 'coins') errors.push(`${entry.id} post-100 supplies must not create Coins.`)
    if (entry.reward?.itemId === season.collectorItemId) errors.push(`${entry.id} post-100 supplies must not award the collector card.`)
  }
  return errors
}
