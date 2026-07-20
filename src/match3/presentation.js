import { buildMatch3EffectPlan } from './effects.js'

const cellKey = position => `${position.r}:${position.c}`

function uniquePositions(positions) {
  return [...new Map(positions.map(position => [cellKey(position), { r: position.r, c: position.c }])).values()]
}

export function match3ResolutionDuration(cascades = [], motionMode = 'full') {
  if (motionMode === 'off') return 0
  if (motionMode === 'reduced') return cascades.length ? 180 : 80
  const specialCount = cascades.reduce((total, cascade) => total + (cascade.triggeredSpecials?.length ?? 0) + (cascade.createdSpecials?.length ?? 0), 0)
  const exceptionalPause = cascades.length >= 4 ? 220 : cascades.length >= 2 ? 120 : 0
  return Math.min(1900, 300 + (Math.max(1, cascades.length) * 190) + (Math.min(5, specialCount) * 90) + exceptionalPause)
}

export function match3SwapDuration(motionMode = 'full') {
  if (motionMode === 'off') return 0
  return motionMode === 'reduced' ? 100 : 280
}

export function match3ShuffleDuration(motionMode = 'full') {
  if (motionMode === 'off') return 0
  return motionMode === 'reduced' ? 180 : 820
}

function analyticsCount(state, type) {
  return (state?.analytics ?? []).filter(event => event?.type === type).length
}

export function createMatch3Presentation(previousState, nextState, action = {}, motionMode = 'full') {
  const cascades = nextState?.cascades ?? []
  const cleared = uniquePositions(cascades.flatMap(cascade => cascade.clearedCells ?? []))
  const triggered = uniquePositions(cascades.flatMap(cascade => (cascade.triggeredSpecials ?? []).map(special => special.at)))
  const created = uniquePositions(cascades.flatMap(cascade => (cascade.createdSpecials ?? []).map(special => special.at)))
  const specialEvent = cascades.find(cascade => cascade.kind === 'special-combination')
  const finalCascade = cascades.at(-1)
  const label = specialEvent?.label ?? (cascades.length > 1 ? nextState?.combo?.label : finalCascade?.label) ?? ''
  const scoreGained = Number(nextState?.score ?? 0) - Number(previousState?.score ?? 0)
  const specialCount = cascades.reduce((total, cascade) => total + (cascade.triggeredSpecials?.length ?? 0) + (cascade.createdSpecials?.length ?? 0), 0)
  const effectPlan = buildMatch3EffectPlan(cascades, { motionMode })

  const isMove = action.action === 'move'
  const hasResolution = cascades.length > 0
  const deadBoardShuffle = analyticsCount(nextState, 'dead-board-shuffle') > analyticsCount(previousState, 'dead-board-shuffle')
  const playerShuffle = action.action === 'power-up' && action.powerUp === 'shuffle'
  const hasShuffle = deadBoardShuffle || playerShuffle || action.action === 'shuffle'
  const phase = hasResolution ? hasShuffle ? 'resolve-shuffle' : 'resolve' : hasShuffle ? 'shuffle' : isMove ? 'invalid-swap' : 'settled'
  const resolutionDuration = hasResolution ? match3ResolutionDuration(cascades, motionMode) : 0
  const shuffleDuration = hasShuffle ? match3ShuffleDuration(motionMode) : 0
  return {
    swapped: action.from && action.to ? [action.from, action.to] : [],
    cleared,
    triggered,
    created,
    cascades,
    cascadeCount: cascades.length,
    scoreGained,
    label,
    comboType: specialEvent?.comboType ?? cascades[0]?.comboType ?? null,
    intensity: effectPlan.intensity || Math.min(5, Math.max(1, cascades.length + Math.ceil(specialCount / 2))),
    effectPlan,
    phase,
    invalidSwap: phase === 'invalid-swap',
    deadBoardShuffle,
    shuffle: hasShuffle,
    shuffleLabel: deadBoardShuffle ? 'No more moves' : playerShuffle ? 'Board shuffled' : '',
    durationMs: hasResolution ? resolutionDuration + shuffleDuration : hasShuffle ? shuffleDuration : match3SwapDuration(motionMode),
  }
}

export function cellIsInPresentation(presentation, group, row, column) {
  return Boolean(presentation?.[group]?.some(position => position.r === row && position.c === column))
}

export function isMatch3BoardInputLocked({ status = 'active', paused = false, busy = false, presentation = null } = {}) {
  return status !== 'active' || paused || busy || Number(presentation?.durationMs ?? 0) > 0
}
