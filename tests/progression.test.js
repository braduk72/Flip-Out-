import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXCHANGE_DEFAULT_EXPIRY_DAYS, EXCHANGE_MAX_ACTIVE_LISTINGS, EXCHANGE_MIN_LISTING_PRICE_COINS,
  REVIVE_TIERS, annualChoice, auctionAmounts, claimDailyAction, consumePowerUp, continuationDecision, detectAnomaly,
  localDateKey, nextDailyStreak, openLockbox, resolveCloudSync, reviveDecision, validateListing,
} from '../api/_progressionRules.js'

test('revive flow is Coin-only and uses the approved three-attempt odds ladder', () => {
  assert.deepEqual(REVIVE_TIERS.map(tier => [tier.costCoins, tier.successChance]), [[25, 0.75], [50, 0.5], [100, 0.25]])
  assert.deepEqual(reviveDecision({ attempt: 1, coins: 25, randomValue: 0.74 }), { allowed: true, method: 'coins', attempt: 1, label: 'Revive One', costCoins: 25, successChance: 0.75, oddsPercent: 75, success: true, coinDelta: -25 })
  assert.equal(reviveDecision({ attempt: 1, coins: 24, randomValue: 0 }).reason, 'insufficient-coins')
  assert.equal(reviveDecision({ attempt: 2, coins: 50, randomValue: 0.5 }).success, false)
  assert.equal(reviveDecision({ attempt: 4, coins: 1000, randomValue: 0 }).reason, 'revive-limit')
  assert.equal(continuationDecision({ attemptsUsed: 2, coins: 100, randomValue: 0.24 }).success, true)
})

test('free, advert and coin wheel limits are independent and retry-safe', () => {
  const used = new Set(['wheel:free:2026-07-18'])
  assert.equal(claimDailyAction(used, 'wheel:free', '2026-07-18').duplicate, true)
  assert.equal(claimDailyAction(used, 'wheel:advert', '2026-07-18').allowed, true)
  assert.equal(claimDailyAction(used, 'wheel:coins', '2026-07-18').allowed, true)
})

test('timezone day boundaries use configured player timezone', () => {
  const instant = new Date('2026-01-01T00:30:00Z')
  assert.equal(localDateKey(instant, 'UTC'), '2026-01-01')
  assert.equal(localDateKey(instant, 'America/Los_Angeles'), '2025-12-31')
})

test('power-up ownership, duplicate activation and match state are validated', () => {
  assert.deepEqual(consumePowerUp({ quantity: 1, matchStatus: 'active', alreadyUsed: false }), { allowed: true, quantityDelta: -1 })
  assert.equal(consumePowerUp({ quantity: 0, matchStatus: 'active', alreadyUsed: false }).reason, 'not-owned')
  assert.equal(consumePowerUp({ quantity: 1, matchStatus: 'active', alreadyUsed: true }).reason, 'duplicate-activation')
  assert.equal(consumePowerUp({ quantity: 1, matchStatus: 'complete', alreadyUsed: false }).reason, 'invalid-match-state')
})

test('lockbox opening consumes one box and key and rejects duplicates or missing inventory', () => {
  assert.deepEqual(openLockbox({ boxes: 1, keys: 1, alreadyOpened: false }), { allowed: true, boxDelta: -1, keyDelta: -1 })
  assert.equal(openLockbox({ boxes: 0, keys: 1 }).reason, 'missing-box')
  assert.equal(openLockbox({ boxes: 1, keys: 0 }).reason, 'missing-key')
  assert.equal(openLockbox({ boxes: 1, keys: 1, alreadyOpened: true }).duplicate, true)
})

test('auction fee is exactly 20 percent using integer coins', () => {
  assert.deepEqual(auctionAmounts(101), { grossCoins: 101, feeCoins: 20, netCoins: 81 })
  assert.throws(() => auctionAmounts(10.5), /integer/)
  assert.equal(EXCHANGE_MIN_LISTING_PRICE_COINS, 10)
  assert.equal(EXCHANGE_MAX_ACTIVE_LISTINGS, 20)
  assert.equal(EXCHANGE_DEFAULT_EXPIRY_DAYS, 7)
  assert.equal(validateListing({ item: { tradable: true }, quantity: 1, priceCoins: 9 }).reason, 'invalid-price')
  assert.equal(validateListing({ item: { tradable: true }, quantity: 1, priceCoins: 50, sellerId: 'a', buyerId: 'b' }).allowed, true)
  assert.equal(validateListing({ item: { tradable: true }, quantity: 1, priceCoins: 10000000, sellerId: 'a', buyerId: 'b' }).allowed, true)
  assert.equal(validateListing({ item: { tradable: false }, quantity: 1, priceCoins: 50 }).reason, 'item-not-tradable')
  assert.equal(validateListing({ item: { tradable: true }, quantity: 1, priceCoins: 50, sellerId: 'a', buyerId: 'a' }).reason, 'self-purchase')
})

test('annual choice enforces preceding year through 25 December', () => {
  const items = [
    { id: 'included', type: 'card', status: 'available', releasedAt: '2025-12-25' },
    { id: 'excluded', type: 'card', status: 'available', releasedAt: '2025-12-26' },
  ]
  assert.equal(annualChoice(items, 2026, 'included').allowed, true)
  assert.equal(annualChoice(items, 2026, 'excluded').allowed, false)
})

test('daily streak continues, rejects duplicate and resets', () => {
  assert.equal(nextDailyStreak({ lastClaimKey: '2026-07-17', todayKey: '2026-07-18', yesterdayKey: '2026-07-17', streak: 4 }).streak, 5)
  assert.equal(nextDailyStreak({ lastClaimKey: '2026-07-18', todayKey: '2026-07-18', yesterdayKey: '2026-07-17', streak: 5 }).duplicate, true)
  assert.equal(nextDailyStreak({ lastClaimKey: '2026-07-10', todayKey: '2026-07-18', yesterdayKey: '2026-07-17', streak: 5 }).streak, 1)
})

test('cloud sync prevents stale local rollback and supports first sync', () => {
  assert.equal(resolveCloudSync({ cloud: null, local: { state: { x: 1 }, version: 1 } }).action, 'upload')
  assert.equal(resolveCloudSync({ cloud: { state: { x: 2 }, version: 1, revision: 3 }, local: { state: { x: 1 }, version: 1, revision: 2 } }).action, 'download')
  assert.equal(resolveCloudSync({ cloud: { state: { x: 2 }, version: 1, revision: 3 }, local: { state: { x: 9 }, version: 1, revision: 4 } }).action, 'reject-local-rollback')
})

test('anti-cheat anomaly hooks flag impossible value, claims and clock skew', () => {
  assert.deepEqual(detectAnomaly({ amount: 100001, claimsToday: 101, clientTimestamp: '2020-01-01T00:00:00Z', now: Date.parse('2026-01-01') }), ['abnormal-value-change', 'excessive-claims', 'client-clock-skew'])
})
