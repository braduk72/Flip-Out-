import crypto from 'node:crypto'

export const MATCH_RULES_VERSION = 'memory-v1'
export const DIFFICULTY_PAIRS = Object.freeze({ Easy: 6, Medium: 6, Hard: 8, Lethal: 8 })

function shuffle(values, randomInt = max => crypto.randomInt(max)) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function createRegularMatchState({ pairCount, cardIds, now = Date.now(), randomInt }) {
  if (!Number.isSafeInteger(pairCount) || pairCount < 1 || pairCount > 16) throw new Error('Invalid pair count')
  if (!Array.isArray(cardIds) || cardIds.length < pairCount) throw new Error('Not enough cards for match')
  const selected = shuffle(cardIds, randomInt).slice(0, pairCount)
  const cards = shuffle(selected.flatMap((cardId, pairId) => [{ cardId, pairId, type: 'regular' }, { cardId, pairId, type: 'regular' }]), randomInt)
  return { rulesVersion: MATCH_RULES_VERSION, cards, flipped: [], matched: [], consumed: [], turn: 'player', playerScore: 0, aiScore: 0, moves: 0, status: 'active', winner: null, startedAt: now, elapsedMs: 0, powerUpActivations: [] }
}

export function publicMatchState(state) {
  return { ...state, cards: state.cards.map((card, index) => ({ index, cardId: card.cardId, type: card.type })) }
}

export function stateHash(state) {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex')
}

function fail(message, code = 'INVALID_MATCH_EVENT') { throw Object.assign(new Error(message), { status: 409, code }) }

export function applyMatchEvent(state, event, { now = Date.now() } = {}) {
  if (!state || state.rulesVersion !== MATCH_RULES_VERSION) fail('Unsupported match rules', 'RULES_VERSION_MISMATCH')
  if (state.status !== 'active' && event.type !== 'resume') fail('Match is not active')
  if (event.clientElapsedMs != null) {
    const elapsed = now - Number(state.startedAt)
    if (!Number.isFinite(event.clientElapsedMs) || event.clientElapsedMs < 0 || event.clientElapsedMs > elapsed + 5000) fail('Timer tampering detected', 'TIMER_TAMPERING')
  }
  if (event.type === 'resume') return { ...state, elapsedMs: Math.max(state.elapsedMs ?? 0, now - Number(state.startedAt)) }
  if (event.type === 'flip') {
    if (state.turn !== 'player') fail('It is not the player turn')
    const index = Number(event.index)
    if (!Number.isSafeInteger(index) || !state.cards[index]) fail('Impossible card index', 'IMPOSSIBLE_FLIP')
    if (state.flipped.includes(index) || state.matched.includes(index) || state.consumed.includes(index) || state.flipped.length >= 2) fail('Card cannot be flipped', 'IMPOSSIBLE_FLIP')
    return { ...state, flipped: [...state.flipped, index], moves: state.moves + 1, elapsedMs: now - Number(state.startedAt) }
  }
  if (event.type === 'resolve') {
    if (state.flipped.length !== 2) fail('Two cards must be flipped before resolving')
    const [first, second] = state.flipped
    const isMatch = state.cards[first].pairId === state.cards[second].pairId
    if (event.claimedMatch != null && Boolean(event.claimedMatch) !== isMatch) fail('Score tampering detected', 'SCORE_TAMPERING')
    const matched = isMatch ? [...state.matched, first, second] : state.matched
    const playerScore = state.playerScore + (isMatch ? 1 : 0)
    const complete = matched.length === state.cards.length
    return { ...state, flipped: [], matched, playerScore, turn: isMatch ? 'player' : 'ai', status: complete ? 'completed' : 'active', winner: complete ? 'player' : null, elapsedMs: now - Number(state.startedAt) }
  }
  if (event.type === 'ai-turn') {
    if (state.turn !== 'ai') fail('AI turn is not available')
    const available = state.cards.map((_, index) => index).filter(index => !state.matched.includes(index) && !state.consumed.includes(index))
    if (available.length < 2) fail('No AI move available')
    const first = available[0]
    const matching = available.find(index => index !== first && state.cards[index].pairId === state.cards[first].pairId)
    const second = matching ?? available[1]
    const isMatch = state.cards[first].pairId === state.cards[second].pairId
    const matched = isMatch ? [...state.matched, first, second] : state.matched
    const aiScore = state.aiScore + (isMatch ? 1 : 0)
    const complete = matched.length === state.cards.length
    return { ...state, matched, aiScore, turn: isMatch ? 'ai' : 'player', status: complete ? 'completed' : 'active', winner: complete ? (aiScore > state.playerScore ? 'ai' : aiScore < state.playerScore ? 'player' : 'draw') : null, elapsedMs: now - Number(state.startedAt) }
  }
  fail('Unknown match event')
}
