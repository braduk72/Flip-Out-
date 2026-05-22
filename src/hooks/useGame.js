import { useReducer, useRef, useCallback } from 'react'
import { getDeckImages } from '../data/decks'
import { pickRandomSpecials, SPECIAL_POOL } from '../data/specialCards'

// ── Board builder ─────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DIFFICULTY_PAIRS    = { Easy: 5, Medium: 7, Hard: 9,    Lethal: 9    }
const DIFFICULTY_AI_KNOWN = { Easy: 0.40, Medium: 0.85, Hard: 0.97, Lethal: 1.00 }
const DIFFICULTY_AI_MEM   = { Easy: 0.25, Medium: 0.75, Hard: 0.92, Lethal: 1.00 }

function buildBoard(deck, numPairs = 7, numSpecials = 2) {
  const images = getDeckImages(deck, numPairs)

  const regulars = images.flatMap(({ image, name }, i) => [
    { id: i * 2,     type: 'regular', pairId: i, image, name, specialType: null },
    { id: i * 2 + 1, type: 'regular', pairId: i, image, name, specialType: null },
  ])

  const specialTypes = pickRandomSpecials(numSpecials)
  const specials = specialTypes.map((type, i) => ({
    id: numPairs * 2 + i,
    type: 'special',
    pairId: null,
    image: `/images/cards/special/${type}.png`,
    specialType: type,
  }))

  return shuffle([...regulars, ...specials])
}

// ── Initial state ─────────────────────────────────────────────────────────────

function makeInitial(deck, numPairs = 7, prebuiltCards = null, initialTurn = 'player') {
  const devSpecials = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('specials')
  const boardPairs    = devSpecials ? 1 : numPairs
  const boardSpecials = devSpecials ? SPECIAL_POOL.length : 2
  return {
    cards:          prebuiltCards ?? buildBoard(deck, boardPairs, boardSpecials),
    flipped:        [],      // up to 2 card indices currently revealed
    matched:        [],      // card indices permanently matched
    consumed:       [],      // special card indices that have fired
    frozen:         [],      // card indices frozen by FREEZE
    playerScore:    0,
    aiScore:        0,
    turn:           initialTurn,
    stunned:        null,    // 'player' | 'ai'
    playerShield:   false,
    aiShield:       false,
    crownHolder:    null,    // 'player' | 'ai' — next opponent pair goes to them
    stopwatchEnd:   null,    // Date.now() + 10000 when active
    activeEffect:   null,    // { type, data } drives animation overlay
    pendingSpecial:  null,   // { index, whose } — special flipped, awaiting effect
    pendingResolve:  null,   // { whose } — both cards face-up, awaiting match check
    gameOver:       false,
    winner:         null,
    jokerUsed:      false,   // one joker allowed per round
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function neighbours(index, cols = 4) {
  const row = Math.floor(index / cols)
  const col = index % cols
  const result = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr, c = col + dc
      if (r >= 0 && c >= 0 && c < cols) result.push(r * cols + c)
    }
  }
  return result
}

function rowOrCol(index, cols = 4, rows = 4) {
  if (Math.random() < 0.5) {
    // return same row
    const row = Math.floor(index / cols)
    return Array.from({ length: cols }, (_, c) => row * cols + c)
  } else {
    // return same column
    const col = index % cols
    return Array.from({ length: rows }, (_, r) => r * cols + col)
  }
}

function otherTurn(turn) { return turn === 'player' ? 'ai' : 'player' }

function checkGameOver(state) {
  const total = state.cards.filter(c => c.type === 'regular').length / 2
  return state.playerScore + state.aiScore >= total
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'FLIP_CARD': {
      const { index } = action
      const card = state.cards[index]

      // Guard: card already flipped, matched, consumed, or frozen
      if (
        state.flipped.includes(index) ||
        state.matched.includes(index) ||
        state.consumed.includes(index) ||
        state.frozen.includes(index) ||
        state.gameOver
      ) return state

      // Guard: not player's turn
      if (state.turn !== 'player') return state

      // Special card — flip face-up first, fire effect after animation
      if (card.type === 'special') {
        return { ...state, flipped: [index], pendingSpecial: { index, whose: 'player' } }
      }

      const newFlipped = [...state.flipped, index]

      if (newFlipped.length === 1) {
        return { ...state, flipped: newFlipped }
      }

      // Second flip — show both face-up, resolve after zoom animation
      return { ...state, flipped: newFlipped, pendingResolve: { whose: 'player' } }
    }

    case 'AI_FLIP': {
      const { index } = action
      const card = state.cards[index]

      if (
        state.flipped.includes(index) ||
        state.matched.includes(index) ||
        state.consumed.includes(index) ||
        state.frozen.includes(index) ||
        state.gameOver ||
        state.turn !== 'ai'
      ) return state

      if (card.type === 'special') {
        return { ...state, flipped: [index], pendingSpecial: { index, whose: 'ai' } }
      }

      const newFlipped = [...state.flipped, index]
      if (newFlipped.length === 1) return { ...state, flipped: newFlipped }

      return { ...state, flipped: newFlipped, pendingResolve: { whose: 'ai' } }
    }

    case 'RESOLVE_FLIP': {
      const { whose } = action
      return resolveFlip({ ...state, pendingResolve: null }, state.flipped, whose)
    }

    case 'APPLY_SPECIAL': {
      const { index, whose, seed } = action
      return applySpecial({ ...state, pendingSpecial: null }, index, whose, seed ?? {})
    }

    case 'HIDE_FLIPPED':
      return { ...state, flipped: [], turn: otherTurn(state.turn) }

    case 'CLEAR_EFFECT':
      return { ...state, activeEffect: null }

    case 'CLEAR_FROZEN':
      return { ...state, frozen: [] }

    case 'STOPWATCH_END':
      return { ...state, stopwatchEnd: null, turn: otherTurn(state.turn) }

    case 'USE_JOKER': {
      if (state.jokerUsed || state.flipped.length !== 1 || state.turn !== 'player') return state
      const firstIdx = state.flipped[0]
      const firstCard = state.cards[firstIdx]
      if (firstCard.type !== 'regular') return state
      const matchIdx = state.cards.findIndex((c, i) =>
        c.type === 'regular' &&
        c.pairId === firstCard.pairId &&
        i !== firstIdx &&
        !state.matched.includes(i) &&
        !state.consumed.includes(i)
      )
      if (matchIdx === -1) return state
      return {
        ...state,
        flipped: [firstIdx, matchIdx],
        jokerUsed: true,
        pendingResolve: { whose: 'player' },
      }
    }

    case 'DICE_RESULT': {
      const { die1, die2 } = action
      const isDouble = die1 === die2
      return {
        ...state,
        activeEffect: { type: 'dice', data: { die1, die2, isDouble } },
        turn: isDouble ? state.turn : otherTurn(state.turn),
      }
    }

    case 'DEV_SPECIAL': {
      const { specialType, seed } = action
      // Temporarily patch card[0] to be the desired special type, apply the
      // effect, then restore the original card and remove it from consumed.
      const patchedCards = [...state.cards]
      patchedCards[0] = { ...patchedCards[0], type: 'special', specialType, pairId: null }
      const result = applySpecial(
        { ...state, cards: patchedCards, pendingSpecial: null },
        0, 'player', seed ?? {}
      )
      return { ...result, cards: state.cards, consumed: result.consumed.filter(i => i !== 0) }
    }

    default:
      return state
  }
}

function resolveFlip(state, flipped, whose) {
  const [a, b] = flipped
  const cardA = state.cards[a]
  const cardB = state.cards[b]
  const isMatch = cardA.pairId === cardB.pairId

  if (!isMatch) {
    return { ...state, flipped, activeEffect: { type: 'no_match', data: { a, b } } }
  }

  // Match!
  const newMatched = [...state.matched, a, b]
  let playerScore = state.playerScore
  let aiScore = state.aiScore

  if (state.crownHolder && state.crownHolder !== whose) {
    if (whose === 'player') aiScore += 1
    else playerScore += 1
  } else {
    if (whose === 'player') playerScore += 1
    else aiScore += 1
  }

  const newState = {
    ...state,
    flipped: [],
    matched: newMatched,
    playerScore,
    aiScore,
    crownHolder: null,
    activeEffect: { type: 'match', data: { a, b, whose } },
  }

  if (checkGameOver(newState)) {
    return {
      ...newState,
      gameOver: true,
      winner: newState.playerScore > newState.aiScore ? 'player'
        : newState.aiScore > newState.playerScore ? 'ai' : 'draw',
    }
  }

  return newState
}

function applySpecial(state, index, whose, seed = {}) {
  const card = state.cards[index]
  const opponent = otherTurn(whose)
  const consumed = [...state.consumed, index]
  const base = { ...state, consumed, flipped: [], activeEffect: null }

  switch (card.specialType) {

    case 'freeze': {
      const nb = neighbours(index).filter(
        i => !state.matched.includes(i) && !state.consumed.includes(i)
      )
      return {
        ...base,
        frozen: nb,
        turn: otherTurn(whose),
        activeEffect: { type: 'freeze', data: { index, frozen: nb } },
      }
    }

    case 'boom': {
      const nb = neighbours(index).filter(
        i => !state.matched.includes(i) && !state.consumed.includes(i)
      )
      return {
        ...base,
        turn: otherTurn(whose),
        activeEffect: { type: 'boom', data: { index, launched: nb } },
      }
    }

    case 'tornado': {
      const unmatched = state.cards
        .map((_, i) => i)
        .filter(i => !state.matched.includes(i) && !state.consumed.includes(i) && i !== index)
      return {
        ...base,
        turn: otherTurn(whose),
        activeEffect: { type: 'tornado', data: { trail: unmatched } },
      }
    }

    case 'magnet':
      return {
        ...base,
        turn: whose, // stays on same player — they still need to flip a card
        activeEffect: { type: 'magnet', data: { index } },
      }

    case 'bolt': {
      const shieldKey = opponent === 'player' ? 'playerShield' : 'aiShield'
      if (state[shieldKey]) {
        return {
          ...base,
          [shieldKey]: false,
          turn: otherTurn(whose),
          activeEffect: { type: 'bolt_blocked', data: { whose } },
        }
      }
      return {
        ...base,
        stunned: opponent,
        turn: otherTurn(whose),
        activeEffect: { type: 'bolt', data: { target: opponent } },
      }
    }

    case 'rocket': {
      const useRow = seed.useRow ?? (Math.random() < 0.5)
      const rIdx   = Math.floor(index / 4), cIdx = index % 4
      const rawLine = useRow
        ? Array.from({ length: 4 }, (_, c) => rIdx * 4 + c)
        : Array.from({ length: 4 }, (_, r) => r * 4 + cIdx)
      const line = rawLine.filter(i => !state.matched.includes(i) && !state.consumed.includes(i) && i !== index)
      return {
        ...base,
        turn: otherTurn(whose),
        activeEffect: { type: 'rocket', data: { line, index } },
      }
    }

    case 'dice': {
      const die1 = seed.die1 ?? Math.ceil(Math.random() * 6)
      const die2 = seed.die2 ?? Math.ceil(Math.random() * 6)
      const isDouble = die1 === die2
      return {
        ...base,
        turn: isDouble ? whose : otherTurn(whose),
        activeEffect: { type: 'dice', data: { die1, die2, isDouble } },
      }
    }

    case 'shield':
      return {
        ...base,
        [whose === 'player' ? 'playerShield' : 'aiShield']: true,
        turn: otherTurn(whose),
        activeEffect: { type: 'shield', data: { whose } },
      }

    case 'stopwatch':
      return {
        ...base,
        stopwatchEnd: Date.now() + 10000,
        turn: whose,
        activeEffect: { type: 'stopwatch', data: { whose } },
      }

    case 'crown':
      return {
        ...base,
        crownHolder: whose,
        turn: otherTurn(whose),
        activeEffect: { type: 'crown', data: { whose } },
      }

    case 'flashlight': {
      const pool = state.cards
        .map((_, i) => i)
        .filter(i => !state.matched.includes(i) && !state.consumed.includes(i) && i !== index)
      const picks = seed.picks ?? shuffle(pool).slice(0, 3)
      return {
        ...base,
        turn: whose,
        activeEffect: { type: 'flashlight', data: { picks } },
      }
    }

    case 'random': {
      const options = ['freeze','boom','tornado','magnet','bolt','rocket','dice','shield','stopwatch','crown','flashlight','shuffle','xray']
      const chosen = seed.chosen ?? options[Math.floor(Math.random() * options.length)]
      const fakeCard = { ...card, specialType: chosen }
      const fakeCards = [...state.cards]
      fakeCards[index] = fakeCard
      return applySpecial({ ...state, cards: fakeCards }, index, whose, seed.innerSeed ?? {})
    }

    case 'shuffle': {
      const unmatchedIdx = state.cards
        .map((_, i) => i)
        .filter(i => !state.matched.includes(i) && !state.consumed.includes(i))
      const shuffledCards = [...state.cards]
      const positions = seed.positions ?? shuffle(unmatchedIdx)
      const pulled = unmatchedIdx.map(i => state.cards[i])
      positions.forEach((pos, i) => { shuffledCards[pos] = pulled[i] })
      return {
        ...base,
        cards: shuffledCards,
        turn: otherTurn(whose),
        activeEffect: { type: 'shuffle', data: {} },
      }
    }

    case 'xray': {
      const unmatched = state.cards
        .map((_, i) => i)
        .filter(i => !state.matched.includes(i) && !state.consumed.includes(i))
      return {
        ...base,
        turn: otherTurn(whose),
        activeEffect: { type: 'xray', data: { revealed: unmatched } },
      }
    }

    default:
      return { ...base, turn: otherTurn(whose) }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGame(deck, difficulty = 'Medium', prebuiltCards = null, initialTurn = 'player') {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const numPairs = DIFFICULTY_PAIRS[difficulty] ?? 7
    return makeInitial(deck, numPairs, prebuiltCards, initialTurn)
  })
  const aiMemory = useRef({})    // { cardIndex: pairId } — what AI has seen
  const aiKnown  = DIFFICULTY_AI_KNOWN[difficulty] ?? 0.85
  const aiMem    = DIFFICULTY_AI_MEM[difficulty]   ?? 0.75

  const flipCard = useCallback(index => {
    dispatch({ type: 'FLIP_CARD', index })
  }, [])

  const aiFlip = useCallback(index => {
    dispatch({ type: 'AI_FLIP', index })
  }, [])

  const hideFlipped = useCallback(() => {
    dispatch({ type: 'HIDE_FLIPPED' })
  }, [])

  const clearEffect = useCallback(() => {
    dispatch({ type: 'CLEAR_EFFECT' })
  }, [])

  const clearFrozen = useCallback(() => {
    dispatch({ type: 'CLEAR_FROZEN' })
  }, [])

  const applyPendingSpecial = useCallback((index, whose, seed = null) => {
    dispatch({ type: 'APPLY_SPECIAL', index, whose, seed })
  }, [])

  const triggerDevSpecial = useCallback((specialType, seed = {}) => {
    dispatch({ type: 'DEV_SPECIAL', specialType, seed })
  }, [])

  const commitResolve = useCallback((whose) => {
    dispatch({ type: 'RESOLVE_FLIP', whose })
  }, [])

  const useJoker = useCallback(() => {
    dispatch({ type: 'USE_JOKER' })
  }, [])

  // Teach the AI what it sees
  const teachAI = useCallback((index, card) => {
    if (card.type === 'regular') {
      aiMemory.current[index] = card.pairId
    }
  }, [])

  // Ask AI to pick its best move
  const getAIMove = useCallback((cards, flipped, matched, consumed, frozen) => {
    const available = cards
      .map((c, i) => ({ c, i }))
      .filter(({ i }) =>
        !flipped.includes(i) &&
        !matched.includes(i) &&
        !consumed.includes(i) &&
        !frozen.includes(i)
      )

    if (!available.length) return null

    // If already has one flipped, try to find the matching second
    if (flipped.length === 1) {
      const firstCard = cards[flipped[0]]
      if (firstCard.type === 'regular') {
        // AI knows where the pair is?
        const knownMatch = Object.entries(aiMemory.current).find(
          ([idx, pairId]) =>
            pairId === firstCard.pairId &&
            parseInt(idx) !== flipped[0] &&
            !matched.includes(parseInt(idx)) &&
            !consumed.includes(parseInt(idx))
        )
        if (knownMatch && Math.random() < aiKnown) {
          return parseInt(knownMatch[0])
        }
      }
    }

    // Try to make a match from memory
    if (flipped.length === 0) {
      const seen = Object.entries(aiMemory.current)
      for (const [idxA, pairId] of seen) {
        const iA = parseInt(idxA)
        if (matched.includes(iA) || consumed.includes(iA) || frozen.includes(iA)) continue
        const matchB = seen.find(([idxB, pid]) => {
          const iB = parseInt(idxB)
          return pid === pairId && iB !== iA && !matched.includes(iB) && !consumed.includes(iB)
        })
        if (matchB && Math.random() < aiMem) return iA
      }
    }

    // Random pick
    return available[Math.floor(Math.random() * available.length)].i
  }, [])

  return { state, flipCard, aiFlip, hideFlipped, clearEffect, clearFrozen, teachAI, getAIMove, applyPendingSpecial, triggerDevSpecial, commitResolve, useJoker }
}

export { buildBoard }
