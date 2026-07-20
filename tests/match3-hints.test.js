import test from 'node:test'
import assert from 'node:assert/strict'
import { legalMoves, objectiveProgress, swap } from '../src/match3/engine.js'
import { chooseMatch3HintMove } from '../src/match3/hints.js'
import { MATCH3_LEVELS } from '../src/match3/levels.js'

function objectiveGain(before, after) {
  return before.level.objectives.reduce((total, objective) => total + Math.max(0, objectiveProgress(after, objective) - objectiveProgress(before, objective)), 0)
}

test('Match-3 hint selection is deterministic and legal', () => {
  const state = {
    ...structuredClone(MATCH3_LEVELS[0]),
  }
  const game = {
    version: 2,
    level: state,
    rngState: 44,
    board: [
      [{ token: 'sun' }, { token: 'moon' }, { token: 'leaf' }, { token: 'water' }],
      [{ token: 'sun' }, { token: 'leaf' }, { token: 'moon' }, { token: 'water' }],
      [{ token: 'moon' }, { token: 'sun' }, { token: 'leaf' }, { token: 'fire' }],
      [{ token: 'gem' }, { token: 'fire' }, { token: 'gem' }, { token: 'fire' }],
    ],
    score: 0,
    movesRemaining: 10,
    progress: { collected: {}, blockers: 0, drops: 0 },
    status: 'active',
    cascades: [],
    combo: { count: 0, multiplier: 1, label: '', scoreGained: 0 },
    stats: { maxCombo: 0, specialsCreated: 0, specialsTriggered: 0 },
    analytics: [],
  }
  const first = chooseMatch3HintMove(game)
  const second = chooseMatch3HintMove(game)
  assert.deepEqual(first, second)
  assert.ok(legalMoves(game.board).map(JSON.stringify).includes(JSON.stringify(first)))
})

test('Match-3 hint prioritises objective progress among legal moves', () => {
  const state = {
    version: 2,
    level: { ...MATCH3_LEVELS[0], objectives: [{ type: 'collect', token: 'sun', target: 3 }] },
    rngState: 9,
    board: [
      [{ token: 'sun' }, { token: 'moon' }, { token: 'leaf' }, { token: 'water' }, { token: 'gem' }],
      [{ token: 'sun' }, { token: 'leaf' }, { token: 'moon' }, { token: 'water' }, { token: 'gem' }],
      [{ token: 'moon' }, { token: 'sun' }, { token: 'leaf' }, { token: 'fire' }, { token: 'water' }],
      [{ token: 'gem' }, { token: 'fire' }, { token: 'gem' }, { token: 'fire' }, { token: 'leaf' }],
      [{ token: 'water' }, { token: 'gem' }, { token: 'fire' }, { token: 'leaf' }, { token: 'moon' }],
    ],
    score: 0,
    movesRemaining: 10,
    progress: { collected: {}, blockers: 0, drops: 0 },
    status: 'active',
    cascades: [],
    combo: { count: 0, multiplier: 1, label: '', scoreGained: 0 },
    stats: { maxCombo: 0, specialsCreated: 0, specialsTriggered: 0 },
    analytics: [],
  }
  const hint = chooseMatch3HintMove(state)
  const hinted = swap(state, hint.from, hint.to).state
  const bestGain = Math.max(...legalMoves(state.board).map(move => objectiveGain(state, swap(state, move.from, move.to).state)))
  assert.equal(objectiveGain(state, hinted), bestGain)
})
