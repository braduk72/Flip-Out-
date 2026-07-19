import test from 'node:test'
import assert from 'node:assert/strict'
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
  assert.ok(match3ResolutionDuration(Array(100).fill(next.cascades[0]), 'full') <= 1500)
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
})
