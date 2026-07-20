import test from 'node:test'
import assert from 'node:assert/strict'
import { ACHIEVEMENT_DEFINITIONS, achievementFingerprint, achievementProgressFromRows, validateAchievementReward } from '../api/_achievements.js'

test('achievement definitions include the approved initial achievements', () => {
  const names = ACHIEVEMENT_DEFINITIONS.map(achievement => achievement.name)
  assert.ok(names.includes('Unicorn Poop'))
  assert.ok(names.includes('Raider of the Lost Arc-hive'))
  assert.equal(new Set(ACHIEVEMENT_DEFINITIONS.map(achievement => achievement.id)).size, ACHIEVEMENT_DEFINITIONS.length)
})

test('achievement fingerprints are stable and input-sensitive', () => {
  const first = achievementFingerprint({ achievementId: 'unicorn-poop', trigger: 'dev-toolkit', metadata: { reason: 'test' } })
  const retry = achievementFingerprint({ achievementId: 'unicorn-poop', trigger: 'dev-toolkit', metadata: { reason: 'test' } })
  const different = achievementFingerprint({ achievementId: 'unicorn-poop', trigger: 'card-obtained', metadata: { reason: 'test' } })
  assert.equal(first, retry)
  assert.notEqual(first, different)
})

test('Unicorn Poop completes only from a Rare Foil card event', () => {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(candidate => candidate.id === 'unicorn-poop')
  assert.equal(achievementProgressFromRows(achievement, [{ event_type: 'card-obtained', event_key: 'card:cats:1', metadata: { foilTier: 'normal' } }]).complete, false)
  assert.equal(achievementProgressFromRows(achievement, [{ event_type: 'card-obtained', event_key: 'card:cats:2', metadata: { foilTier: 'rare_foil' } }]).complete, true)
})

test('Raider of the Lost Arc-hive counts distinct booster themes', () => {
  const achievement = ACHIEVEMENT_DEFINITIONS.find(candidate => candidate.id === 'raider-of-the-lost-arc-hive')
  const rows = ['cats', 'cats', 'dogs', 'space', 'dinosaurs', 'jungle'].map((theme, index) => ({ event_type: 'booster-opened-theme', event_key: theme, metadata: { index } }))
  const progress = achievementProgressFromRows(achievement, rows)
  assert.equal(progress.current, 5)
  assert.equal(progress.target, 5)
  assert.equal(progress.complete, true)
})

test('achievement reward schema supports Coins, Stars and catalogue items', () => {
  assert.deepEqual(validateAchievementReward({ currencyId: 'coins', amount: 10 }), { currencyId: 'coins', amount: 10 })
  assert.deepEqual(validateAchievementReward({ currencyId: 'stars', amount: 100 }), { currencyId: 'stars', amount: 100 })
  assert.equal(validateAchievementReward({ itemId: 'powerup:match3-hammer', amount: 1 }).itemType, 'powerup')
  assert.throws(() => validateAchievementReward({ currencyId: 'gems', amount: 1 }), error => error.code === 'ACHIEVEMENT_REWARD_UNSUPPORTED')
})
