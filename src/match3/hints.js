import { legalMoves, objectiveProgress, swap } from './engine.js'

function objectiveGain(before, after) {
  return (before.level?.objectives ?? []).reduce((total, objective) => {
    const beforeValue = objectiveProgress(before, objective)
    const afterValue = objectiveProgress(after, objective)
    return total + Math.max(0, afterValue - beforeValue)
  }, 0)
}

function specialScore(state) {
  return state.cascades.reduce((total, cascade) => total
    + ((cascade.createdSpecials?.length ?? 0) * 35)
    + ((cascade.triggeredSpecials?.length ?? 0) * 45)
    + ((cascade.clearedCells?.length ?? 0) * 3), 0)
}

export function chooseMatch3HintMove(state) {
  if (!state || state.status !== 'active') return null
  const moves = legalMoves(state.board)
  if (!moves.length) return null
  const ranked = moves.map(move => {
    const result = swap(state, move.from, move.to)
    return {
      move,
      accepted: result.accepted,
      score: result.accepted
        ? (objectiveGain(state, result.state) * 1000)
          + (Number(result.state.score ?? 0) - Number(state.score ?? 0))
          + specialScore(result.state)
          + ((result.state.cascades?.length ?? 0) * 25)
        : -1,
    }
  }).filter(candidate => candidate.accepted)
    .sort((first, second) => second.score - first.score
      || first.move.from.r - second.move.from.r
      || first.move.from.c - second.move.from.c
      || first.move.to.r - second.move.to.r
      || first.move.to.c - second.move.to.c)
  return ranked[0]?.move ?? moves[0] ?? null
}
