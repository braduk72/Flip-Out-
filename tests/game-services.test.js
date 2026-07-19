import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyAdvertCompletion } from '../api/_advertProvider.js'
import { DAILY_LOGIN_REWARDS, dailyLoginClaimId } from '../api/_gameServices.js'
import { REWARD_TABLES, simulateRewards } from '../api/_rewards.js'

test('unconfigured advert provider never fakes success', async () => {
  await assert.rejects(
    verifyAdvertCompletion({ provider: 'missing', receipt: 'forged', placement: 'daily-wheel', playerId: 'player' }),
    error => error.code === 'ADVERT_PROVIDER_UNAVAILABLE' && error.status === 503,
  )
})

test('daily login reward schedule remains data-stable', () => {
  assert.deepEqual(DAILY_LOGIN_REWARDS, [5, 10, 15, 20, 25, 50, 50])
})

test('daily login claim IDs are stable per account without cross-account collisions', () => {
  const date = '2026-07-19'
  const first = dailyLoginClaimId('11111111-1111-4111-8111-111111111111', date)
  const retry = dailyLoginClaimId('11111111-1111-4111-8111-111111111111', date)
  const secondAccount = dailyLoginClaimId('22222222-2222-4222-8222-222222222222', date)
  assert.equal(first, retry)
  assert.notEqual(first, secondAccount)
})

test('lockbox simulation is deterministic and machine-readable', () => {
  const report = simulateRewards(REWARD_TABLES.standardLockboxV1, 100000, 20260718)
  assert.equal(report.rolls, 100000)
  assert.equal(Object.values(report.counts).reduce((sum, count) => sum + count, 0), 100000)
  assert.ok(report.counts['stars:100'] > 68000 && report.counts['stars:100'] < 72000)
})
