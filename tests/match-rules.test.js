import test from 'node:test'
import assert from 'node:assert/strict'
import { applyMatchEvent, createRegularMatchState, stateHash } from '../api/_matchRules.js'

function state(pairCount = 2) { return createRegularMatchState({ pairCount, cardIds: ['a', 'b', 'c'], now: 1000, randomInt: () => 0 }) }
function pairIndices(value) {
  const first = 0
  return [first, value.cards.findIndex((card, index) => index !== first && card.pairId === value.cards[first].pairId)]
}

test('authoritative rules create an uncompleted match and accept a valid move sequence', () => {
  let current = state(1)
  const [first, second] = pairIndices(current)
  current = applyMatchEvent(current, { type: 'flip', index: first, clientElapsedMs: 100 }, { now: 1100 })
  current = applyMatchEvent(current, { type: 'flip', index: second, clientElapsedMs: 200 }, { now: 1200 })
  current = applyMatchEvent(current, { type: 'resolve', claimedMatch: true, clientElapsedMs: 300 }, { now: 1300 })
  assert.equal(current.status, 'completed')
  assert.equal(current.winner, 'player')
  assert.equal(current.playerScore, 1)
  assert.equal(current.moves, 2)
})

test('authoritative rules reject impossible duplicate flips and score tampering', () => {
  let current = state()
  current = applyMatchEvent(current, { type: 'flip', index: 0 }, { now: 1100 })
  assert.throws(() => applyMatchEvent(current, { type: 'flip', index: 0 }, { now: 1200 }), error => error.code === 'IMPOSSIBLE_FLIP')
  const nonmatch = current.cards.findIndex((card, index) => index !== 0 && card.pairId !== current.cards[0].pairId)
  current = applyMatchEvent(current, { type: 'flip', index: nonmatch }, { now: 1200 })
  assert.throws(() => applyMatchEvent(current, { type: 'resolve', claimedMatch: true }, { now: 1300 }), error => error.code === 'SCORE_TAMPERING')
})

test('authoritative rules reject timer tampering and preserve resumable state', () => {
  const current = state()
  assert.throws(() => applyMatchEvent(current, { type: 'flip', index: 0, clientElapsedMs: 999999 }, { now: 1100 }), error => error.code === 'TIMER_TAMPERING')
  const resumed = applyMatchEvent(current, { type: 'resume' }, { now: 4000 })
  assert.equal(resumed.elapsedMs, 3000)
  assert.equal(stateHash(resumed).length, 64)
})
