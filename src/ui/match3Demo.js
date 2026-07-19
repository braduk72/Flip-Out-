import { createGame, legalMoves, swap } from '../match3/engine.js'
import { getMatch3Level } from '../match3/levels.js'

export function createMatch3Demo(seed = 20260719, levelId = 1) {
  return { game: createGame(getMatch3Level(levelId), seed), seed, levelId, step: 0, lastMove: null, lastCascades: [] }
}

export function advanceMatch3Demo(demo) {
  let current = demo
  if (current.game.status !== 'active') current = createMatch3Demo(current.seed + 1, current.levelId)
  const moves = legalMoves(current.game.board)
  if (!moves.length) return createMatch3Demo(current.seed + 1, current.levelId)
  const move = moves[(current.seed + current.step * 7) % moves.length]
  const result = swap(current.game, move.from, move.to)
  if (!result.accepted) return createMatch3Demo(current.seed + 1, current.levelId)
  return {
    ...current,
    game: result.state,
    step: current.step + 1,
    lastMove: move,
    lastCascades: result.state.cascades,
  }
}
