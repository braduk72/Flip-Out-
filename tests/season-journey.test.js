import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTIVE_SEASON,
  FREE_MISSION_REROLLS_PER_DAY,
  MISSION_REROLL_TOKEN_ID,
  POST_100_SUPPLY_REWARDS,
  SEASON_COLLECTOR_CARD_ID,
  SEASON_MISSION_DEFINITIONS,
  SEASON_REWARD_PAGES,
  findSeasonChoice,
  journeyLevelForScore,
  post100SupplyCount,
  seasonTicketsForLevelDelta,
  validateSeasonJourneyDesign,
} from '../src/data/seasonJourney.js'
import { ITEM_BY_ID, validateCatalog } from '../src/data/itemCatalog.js'
import { match3SeasonScoreEventId } from '../api/_seasonJourney.js'

test('Season Journey keeps Season Score and Season Tickets separate', () => {
  assert.equal(journeyLevelForScore(0), 0)
  assert.equal(journeyLevelForScore(999), 0)
  assert.equal(journeyLevelForScore(1000), 1)
  assert.equal(journeyLevelForScore(100000), 100)
  assert.equal(seasonTicketsForLevelDelta(0, 3), 3)
  assert.equal(seasonTicketsForLevelDelta(3, 3), 0)
  assert.equal(seasonTicketsForLevelDelta(99, 100), 1)
  assert.equal(seasonTicketsForLevelDelta(100, 120), 0)
})

test('Season mission definitions are gameplay-only and do not reward Coins or Tickets directly', () => {
  assert.deepEqual(validateSeasonJourneyDesign(), [])
  assert.ok(SEASON_MISSION_DEFINITIONS.length >= 5)
  assert.ok(SEASON_MISSION_DEFINITIONS.every(mission => ['daily', 'weekly'].includes(mission.cadence)))
  assert.ok(SEASON_MISSION_DEFINITIONS.every(mission => mission.eventType.startsWith('match3-')))
})

test('Season reward pages use choice spending and keep the collector card at level 100 only', () => {
  const collectorChoices = SEASON_REWARD_PAGES.flatMap(page => page.choices.map(choice => ({ page, choice }))).filter(row => row.choice.reward.itemId === SEASON_COLLECTOR_CARD_ID)
  assert.equal(collectorChoices.length, 1)
  assert.equal(collectorChoices[0].page.unlockLevel, 100)
  assert.equal(findSeasonChoice('choice:stars:250').choice.reward.currencyId, 'stars')
  assert.equal(findSeasonChoice('choice:collector-card').choice.collectorOnly, true)
})

test('Mission reroll tokens and season collector card are catalogue-backed and non-tradable', () => {
  assert.deepEqual(validateCatalog(), [])
  assert.equal(ITEM_BY_ID.get(MISSION_REROLL_TOKEN_ID).tradable, false)
  assert.equal(ITEM_BY_ID.get(SEASON_COLLECTOR_CARD_ID).tradable, false)
  assert.equal(ITEM_BY_ID.get(SEASON_COLLECTOR_CARD_ID).stackable, false)
})

test('Post-100 supplies are fallback supplies and never the level-100 collector card', () => {
  assert.equal(post100SupplyCount(ACTIVE_SEASON.scorePerLevel * 100), 0)
  assert.equal(post100SupplyCount(ACTIVE_SEASON.scorePerLevel * 105), 1)
  assert.ok(POST_100_SUPPLY_REWARDS.every(entry => entry.reward.itemId !== SEASON_COLLECTOR_CARD_ID))
  assert.ok(POST_100_SUPPLY_REWARDS.every(entry => entry.reward.currencyId !== 'coins'))
})

test('Season score event IDs are deterministic and Match-3 session scoped', () => {
  assert.equal(match3SeasonScoreEventId('match3:abc-123'), 'season-score:match3:match3:abc-123')
  assert.throws(() => match3SeasonScoreEventId('../bad'), /Invalid/)
})

test('Mission reroll policy grants two free rerolls per day before token or coin fallback', () => {
  assert.equal(FREE_MISSION_REROLLS_PER_DAY, 2)
  assert.equal(ITEM_BY_ID.get(MISSION_REROLL_TOKEN_ID).type, 'mission_reroll')
})
