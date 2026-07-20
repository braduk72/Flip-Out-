const CLASSIC_EFFECT_PACK = Object.freeze({
  id: 'classic',
  singleTile: ['crazy-arrow', 'homing-missile', 'bee', 'wind-up-robot'],
  area2x2: ['bomb', 'bowling-ball', 'falling-safe', 'angry-tomato'],
  area3x3: ['meteor', 'meateor-shower', 'orbital-laser', 'giant-boxing-glove'],
  line: ['rocket-trail', 'laser-sweep', 'spark-rail'],
  color: ['sun-bloom', 'rainbow-nova', 'solar-flare'],
  wrapped: ['shock-bomb', 'prize-pop', 'spark-crush'],
})

export const MATCH3_EFFECT_PACKS = Object.freeze({
  classic: CLASSIC_EFFECT_PACK,
  seasonalOverrideTemplate: Object.freeze({
    id: 'seasonal-template',
    description: 'Future seasons can override named mechanic presentations without changing Match-3 rules.',
    overrideKeys: ['singleTile', 'area2x2', 'area3x3', 'line', 'color', 'wrapped'],
  }),
})

export const EXCEPTIONAL_CASCADE_ANNOUNCERS = Object.freeze([
  { min: 8, line: 'FLIP OUT!!' },
  { min: 7, line: 'MEGA CASCADE!' },
  { min: 6, line: 'UNBELIEVABLE!' },
  { min: 5, line: 'INCREDIBLE!' },
  { min: 4, line: 'OUTSTANDING!' },
])

function hashString(value) {
  let hash = 2166136261
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pick(list, seed) {
  if (!list?.length) return 'spark-pop'
  return list[hashString(seed) % list.length]
}

function creationAnimation(reason, type) {
  if (reason === 'five' || type === 'color') return 'sun-materialise'
  if (reason === 'four' || type === 'row' || type === 'col') return 'rocket-impact'
  if (reason === 'square') return 'square-pop'
  if (reason === 't') return 't-formation'
  if (reason === 'l') return 'l-formation'
  return 'special-pop'
}

function cascadeCelebration(index, total) {
  const number = index + 1
  if (number >= 8) return 'huge'
  if (number >= 4) return 'large'
  if (number >= 2) return 'small'
  return total > 1 ? 'starter' : 'normal'
}

export function cascadeAnnouncer(cascadeCount) {
  return EXCEPTIONAL_CASCADE_ANNOUNCERS.find(entry => cascadeCount >= entry.min)?.line ?? null
}

export function buildMatch3EffectPlan(cascades = [], { packId = 'classic', motionMode = 'full' } = {}) {
  const pack = MATCH3_EFFECT_PACKS[packId] ?? MATCH3_EFFECT_PACKS.classic
  const cascadeCount = cascades.length
  const createdCount = cascades.reduce((sum, cascade) => sum + (cascade.createdSpecials?.length ?? 0), 0)
  const triggeredCount = cascades.reduce((sum, cascade) => sum + (cascade.triggeredSpecials?.length ?? 0), 0)
  const clearedCount = cascades.reduce((sum, cascade) => sum + (cascade.clearedCells?.length ?? 0), 0)
  const intensity = motionMode === 'off' ? 0 : Math.min(8, Math.max(1, cascadeCount + createdCount + Math.ceil(triggeredCount / 2)))
  const particleIntensity = motionMode === 'off' ? 0 : motionMode === 'reduced' ? Math.min(2, intensity) : intensity
  const stages = cascades.map((cascade, index) => {
    const specialKind = cascade.comboType?.includes('color') ? 'color'
      : cascade.comboType?.includes('wrapped') ? 'wrapped'
        : cascade.comboType?.includes('line') || ['row', 'col'].includes(cascade.comboType) ? 'line'
          : null
    const mechanic = specialKind ?? (cascade.clearedCells?.length >= 9 ? 'area3x3' : cascade.clearedCells?.length >= 4 ? 'area2x2' : 'singleTile')
    const effectList = specialKind ? pack[specialKind] : pack[mechanic]
    return {
      index,
      cascadeNumber: index + 1,
      multiplier: cascade.multiplier ?? 1,
      label: cascade.label ?? '',
      scoreGain: cascade.scoreGain ?? 0,
      clearedCount: cascade.clearedCells?.length ?? 0,
      celebration: cascadeCelebration(index, cascadeCount),
      intensity: Math.min(8, Math.max(1, index + 1 + (cascade.createdSpecials?.length ?? 0) + (cascade.triggeredSpecials?.length ?? 0))),
      effect: pick(effectList, `${pack.id}:${index}:${cascade.kind}:${cascade.comboType}:${cascade.scoreGain}`),
      createdSpecials: (cascade.createdSpecials ?? []).map((special, specialIndex) => ({
        ...special,
        animation: creationAnimation(special.reason, special.type),
        effect: pick(special.type === 'color' ? pack.color : special.type === 'wrapped' ? pack.wrapped : pack.line, `${pack.id}:created:${index}:${specialIndex}:${special.type}:${special.reason}`),
      })),
      triggeredSpecials: (cascade.triggeredSpecials ?? []).map((special, specialIndex) => ({
        ...special,
        effect: pick(special.type === 'color' ? pack.color : special.type === 'wrapped' ? pack.wrapped : pack.line, `${pack.id}:triggered:${index}:${specialIndex}:${special.type}`),
      })),
    }
  })
  return {
    packId: pack.id,
    cascadeCount,
    intensity,
    particleIntensity,
    particleCount: motionMode === 'off' ? 0 : Math.min(motionMode === 'reduced' ? 18 : 72, 10 + (particleIntensity * 8) + Math.min(16, clearedCount)),
    boardShake: motionMode === 'full' ? Math.min(8, cascadeCount + triggeredCount + createdCount) : 0,
    announcer: motionMode === 'off' ? null : cascadeAnnouncer(cascadeCount),
    multiplierDisplay: cascadeCount > 1 ? {
      value: cascades.at(-1)?.multiplier ?? 1,
      cascadeCount,
      scoreGained: cascades.reduce((sum, cascade) => sum + (cascade.scoreGain ?? 0), 0),
      freezeMs: motionMode === 'full' ? 360 : motionMode === 'reduced' ? 120 : 0,
    } : null,
    stages,
  }
}

export function createdSpecialPresentation(presentation, row, column) {
  return presentation?.effectPlan?.stages
    ?.flatMap(stage => stage.createdSpecials)
    .find(special => special.at?.r === row && special.at?.c === column) ?? null
}

