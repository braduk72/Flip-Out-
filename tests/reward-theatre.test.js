import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { REWARD_TABLES, selectWeightedReward, simulateRewards, validateRewardTable } from '../api/_rewards.js'
import {
  buildRewardTheatrePresentation,
  completedMatch3LevelCount,
  nextRewardTheatreMilestone,
  rewardLabel,
  rewardTheatreClaimId,
} from '../api/_rewardTheatre.js'
import { ITEM_BY_ID, validateCatalog } from '../src/data/itemCatalog.js'

test('Reward Theatre table is reusable and catalogue-backed', () => {
  const table = REWARD_TABLES.rewardTheatreV1
  assert.deepEqual(validateRewardTable(table), [])
  assert.equal(table.id, 'reward-theatre-v1')
  assert.ok(table.entries.some(entry => entry.reward.currencyId === 'coins'))
  assert.ok(table.entries.some(entry => entry.reward.itemId?.startsWith('booster:')))
  assert.ok(table.entries.some(entry => entry.reward.itemId?.startsWith('powerup:match3-')))
  for (const entry of table.entries.filter(row => row.reward.itemId)) assert.ok(ITEM_BY_ID.has(entry.reward.itemId), `${entry.reward.itemId} exists in catalogue`)
  assert.deepEqual(validateCatalog(), [])
})

test('Reward Theatre milestone eligibility occurs every five completed Match-3 levels', () => {
  const completedLevels = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [String(index + 1), { score: index * 100 }]))
  assert.equal(completedMatch3LevelCount(completedLevels), 9)
  assert.equal(nextRewardTheatreMilestone({ completedLevels }), 5)
  assert.equal(nextRewardTheatreMilestone({ completedLevels, claimedMilestones: [5] }), null)
  assert.equal(nextRewardTheatreMilestone({ completedLevels: { ...completedLevels, 10: { score: 1000 } }, claimedMilestones: [5] }), 10)
})

test('Reward Theatre claim IDs are stable and account-scoped', () => {
  const player = '11111111-1111-4111-8111-111111111111'
  assert.equal(rewardTheatreClaimId(player, 5), rewardTheatreClaimId(player, 5))
  assert.notEqual(rewardTheatreClaimId(player, 5), rewardTheatreClaimId('22222222-2222-4222-8222-222222222222', 5))
  assert.throws(() => rewardTheatreClaimId(player, 6), error => error.code === 'REWARD_THEATRE_INVALID_MILESTONE')
})

test('Reward Theatre prize wheel is deterministic and lands on the committed prize', () => {
  const claimId = rewardTheatreClaimId('11111111-1111-4111-8111-111111111111', 5)
  const reward = { itemId: 'booster:random', amount: 1, tableId: 'reward-theatre-v1', milestone: 5 }
  const first = buildRewardTheatrePresentation({ claimId, reward, milestone: 5 })
  const second = buildRewardTheatrePresentation({ claimId, reward, milestone: 5 })
  assert.deepEqual(first, second)
  assert.equal(first.type, 'lucky-prize-wheel')
  assert.equal(first.framework, 'reward-theatre-presentation-v1')
  assert.equal(first.wheel.segmentCount, 24)
  assert.equal(first.wheel.segments.length, 24)
  assert.equal(first.label, 'Random Booster Pack')
  assert.equal(first.wheel.segments[first.wheel.targetIndex].label, 'Random Booster')
  assert.equal(first.wheel.segments[first.wheel.targetIndex].winning, true)
  const stoppedAngle = ((first.wheel.finalRotationDeg + first.wheel.targetAngleDeg) % 360 + 360) % 360
  assert.equal(stoppedAngle, 0)
})

test('Reward Theatre presentation remains separate from committed reward data', () => {
  const claimId = rewardTheatreClaimId('11111111-1111-4111-8111-111111111111', 10)
  const reward = { currencyId: 'coins', amount: 25, tableId: 'reward-theatre-v1', milestone: 10 }
  const presentation = buildRewardTheatrePresentation({ claimId, reward, milestone: 10 })
  assert.deepEqual(presentation.reward, reward)
  assert.equal(presentation.wheel.segments[presentation.wheel.targetIndex].reward.currencyId, 'coins')
  assert.equal(presentation.wheel.segments[presentation.wheel.targetIndex].reward.amount, 25)
})

test('Reward Theatre weighted simulation is deterministic', () => {
  const report = simulateRewards(REWARD_TABLES.rewardTheatreV1, 10000, 20260720)
  assert.equal(report.rolls, 10000)
  assert.equal(Object.values(report.counts).reduce((sum, count) => sum + count, 0), 10000)
  assert.equal(selectWeightedReward(REWARD_TABLES.rewardTheatreV1, 0).amount, 10)
  assert.equal(rewardLabel({ currencyId: 'coins', amount: 25 }), '25 Coins')
})

test('Reward Theatre presentation CSS does not use infinite theatre animations', () => {
  const css = fs.readFileSync(new URL('../src/screens/Match3.module.css', import.meta.url), 'utf8')
  const theatreCss = css
    .split('\n')
    .filter(line => /theatre|wheel|prize/i.test(line))
    .join('\n')
  assert.equal(/animation[^;{}]*infinite/i.test(theatreCss), false)
})
