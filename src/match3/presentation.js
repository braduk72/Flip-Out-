const cellKey = position => `${position.r}:${position.c}`

function uniquePositions(positions) {
  return [...new Map(positions.map(position => [cellKey(position), { r: position.r, c: position.c }])).values()]
}

export function match3ResolutionDuration(cascades = [], motionMode = 'full') {
  if (motionMode === 'off') return 0
  if (motionMode === 'reduced') return cascades.length ? 180 : 80
  const specialCount = cascades.reduce((total, cascade) => total + (cascade.triggeredSpecials?.length ?? 0) + (cascade.createdSpecials?.length ?? 0), 0)
  return Math.min(1500, 260 + (Math.max(1, cascades.length) * 170) + (Math.min(4, specialCount) * 70))
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
    intensity: Math.min(5, Math.max(1, cascades.length + Math.ceil(specialCount / 2))),
    durationMs: match3ResolutionDuration(cascades, motionMode),
  }
}

export function cellIsInPresentation(presentation, group, row, column) {
  return Boolean(presentation?.[group]?.some(position => position.r === row && position.c === column))
}
