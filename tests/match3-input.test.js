import assert from 'node:assert/strict'
import test from 'node:test'
import { MATCH3_LEVELS } from '../src/match3/levels.js'
import { createGame, legalMoves } from '../src/match3/engine.js'
import { isMatch3BoardInputLocked } from '../src/match3/presentation.js'

test('a legal first move is available after the start sequence for every development level', () => {
  for (const level of MATCH3_LEVELS) {
    const state = createGame(level, 20260719 + level.id)
    assert.equal(state.status, 'active', `level ${level.id} starts active`)
    assert.ok(legalMoves(state.board).length > 0, `level ${level.id} starts with a legal move`)
    assert.equal(isMatch3BoardInputLocked({ status: state.status, busy: false, paused: false, presentation: null }), false, `level ${level.id} accepts input after start`)
  }
})

test('only real resolving, paused, busy or blocking states lock the board', () => {
  assert.equal(isMatch3BoardInputLocked({ status: 'active' }), false)
  assert.equal(isMatch3BoardInputLocked({ status: 'active', presentation: { durationMs: 0 } }), false)
  assert.equal(isMatch3BoardInputLocked({ status: 'active', presentation: { durationMs: 300 } }), true)
  assert.equal(isMatch3BoardInputLocked({ status: 'active', busy: true }), true)
  assert.equal(isMatch3BoardInputLocked({ status: 'active', paused: true }), true)
  assert.equal(isMatch3BoardInputLocked({ status: 'lost' }), true)
})

