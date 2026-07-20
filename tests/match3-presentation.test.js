import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatch3EffectPlan, cascadeAnnouncer } from '../src/match3/effects.js'
import { cellIsInPresentation, createMatch3Presentation, match3ResolutionDuration, match3SwapDuration } from '../src/match3/presentation.js'

const previous = { score: 100 }
const next = {
  score: 850,
  combo: { label: 'Great combo!' },
  cascades: [
    { kind: 'special-combination', comboType: 'line+wrapped', label: 'Triple Cross Blast!', clearedCells: [{ r: 1, c: 1 }, { r: 1, c: 2 }], triggeredSpecials: [{ at: { r: 1, c: 1 }, type: 'row' }], createdSpecials: [], scoreGain: 500 },
    { kind: 'match', label: 'Sweet cascade!', clearedCells: [{ r: 1, c: 2 }, { r: 2, c: 2 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 2, c: 2 }, type: 'wrapped' }], scoreGain: 250 },
  ],
}

test('presentation data is deterministic and deduplicates affected cells', () => {
  const action = { from: { r: 1, c: 1 }, to: { r: 1, c: 2 } }
  const first = createMatch3Presentation(previous, next, action)
  const second = createMatch3Presentation(previous, next, action)
  assert.deepEqual(first, second)
  assert.deepEqual(first.cleared, [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }])
  assert.equal(first.label, 'Triple Cross Blast!')
  assert.equal(first.comboType, 'line+wrapped')
  assert.equal(first.scoreGained, 750)
  assert.equal(first.effectPlan.stages.length, 2)
  assert.equal(first.effectPlan.multiplierDisplay.cascadeCount, 2)
})

test('presentation membership supports tile animation classes', () => {
  const presentation = createMatch3Presentation(previous, next)
  assert.equal(cellIsInPresentation(presentation, 'triggered', 1, 1), true)
  assert.equal(cellIsInPresentation(presentation, 'created', 2, 2), true)
  assert.equal(cellIsInPresentation(presentation, 'cleared', 7, 7), false)
})

test('resolution timing is bounded and respects motion preferences', () => {
  assert.equal(match3ResolutionDuration(next.cascades, 'off'), 0)
  assert.equal(match3ResolutionDuration(next.cascades, 'reduced'), 180)
  assert.ok(match3ResolutionDuration(next.cascades, 'full') > 500)
  assert.ok(match3ResolutionDuration(Array(100).fill(next.cascades[0]), 'full') <= 1900)
})

test('invalid swaps have a bounded return animation without changing authoritative state', () => {
  const presentation = createMatch3Presentation({ score: 100 }, { score: 100, cascades: [] }, { action: 'move', from: { r: 0, c: 0 }, to: { r: 0, c: 1 } })
  assert.equal(presentation.phase, 'invalid-swap')
  assert.equal(presentation.invalidSwap, true)
  assert.equal(presentation.cascadeCount, 0)
  assert.equal(presentation.durationMs, match3SwapDuration('full'))
})

test('reduced motion preserves semantic phases with shorter timings', () => {
  const presentation = createMatch3Presentation(previous, next, { action: 'move', from: { r: 1, c: 1 }, to: { r: 1, c: 2 } }, 'reduced')
  assert.equal(presentation.phase, 'resolve')
  assert.ok(presentation.durationMs < match3ResolutionDuration(next.cascades, 'full'))
  assert.ok(presentation.label)
  assert.ok(presentation.effectPlan.particleCount <= 18)
  assert.equal(presentation.effectPlan.boardShake, 0)
})

test('effect framework maps special creation reasons to distinct animations', () => {
  const cascades = [
    { kind: 'match', multiplier: 1, clearedCells: [{ r: 0, c: 0 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 0, c: 0 }, type: 'row', reason: 'four' }], scoreGain: 100 },
    { kind: 'match', multiplier: 1.5, clearedCells: [{ r: 1, c: 1 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 1, c: 1 }, type: 'color', reason: 'five' }], scoreGain: 200 },
    { kind: 'match', multiplier: 2, clearedCells: [{ r: 2, c: 2 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 2, c: 2 }, type: 'wrapped', reason: 't' }], scoreGain: 300 },
    { kind: 'match', multiplier: 2.5, clearedCells: [{ r: 3, c: 3 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 3, c: 3 }, type: 'wrapped', reason: 'l' }], scoreGain: 400 },
    { kind: 'match', multiplier: 3, clearedCells: [{ r: 4, c: 4 }], triggeredSpecials: [], createdSpecials: [{ at: { r: 4, c: 4 }, type: 'wrapped', reason: 'square' }], scoreGain: 500 },
  ]
  const plan = buildMatch3EffectPlan(cascades)
  const animations = plan.stages.flatMap(stage => stage.createdSpecials.map(special => special.animation))
  assert.deepEqual(animations, ['rocket-impact', 'sun-materialise', 't-formation', 'l-formation', 'square-pop'])
  assert.equal(plan.multiplierDisplay.value, 3)
  assert.equal(plan.boardShake >= 5, true)
})

test('announcer lines remain reserved for exceptional cascades', () => {
  assert.equal(cascadeAnnouncer(1), null)
  assert.equal(cascadeAnnouncer(3), null)
  assert.equal(cascadeAnnouncer(4), 'OUTSTANDING!')
  assert.equal(cascadeAnnouncer(8), 'FLIP OUT!!')
})
