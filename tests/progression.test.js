import test from 'node:test'
import assert from 'node:assert/strict'
import {
  annualChoice, auctionAmounts, claimDailyAction, consumePowerUp, continuationDecision, detectAnomaly,
  localDateKey, nextDailyStreak, openLockbox, resolveCloudSync, validateListing,
} from '../api/_progressionRules.js'

test('continue flow requires verified advert then permits one configured coin continuation', () => {
  assert.equal(continuationDecision({ advertUsed: false, advertVerified: false, coins: 100 }).allowed, false)
  assert.deepEqual(continuationDecision({ advertUsed: false, advertVerified: true, coins: 0 }), { allowed: true, method: 'advert', coinDelta: 0 })
  assert.equal(continuationDecision({ advertUsed: true, coinUsed: false, coins: 25 }).coinDelta, -25)
  assert.equal(continuationDecision({ advertUsed: true, coinUsed: true, coins: 100 }).allowed, false)
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
  assert.equal(validateListing({ item: { tradable: true }, quantity: 1, priceCoins: 50, sellerId: 'a', buyerId: 'b' }).allowed, true)
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
