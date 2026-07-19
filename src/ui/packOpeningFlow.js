export const PACK_OPENING_PHASES = Object.freeze([
  'idle', 'appearing', 'enlarging', 'lifting', 'turning', 'settling', 'tearing', 'opening', 'dealing', 'uncovering', 'fan-ready', 'revealing', 'celebration-paused', 'complete',
])

export const PACK_REVEAL_ACTIONS = Object.freeze(['reveal-card', 'reveal-all'])
export const BOOSTER_ANIMATION_FRAMES = Object.freeze(Array.from({ length: 10 }, (_, index) => `/ui/booster-animation/booster_${String(index + 1).padStart(2, '0')}.webp`))

// Frames are reference poses, not a video. CSS interpolates physical movement
// between these stages and cards fan procedurally after uncovering.
export const PACK_OPENING_TIMELINE = Object.freeze([
  { phase: 'appearing', frame: 1, duration: 180 },
  { phase: 'enlarging', frame: 2, duration: 130 },
  { phase: 'lifting', frame: 2, duration: 260 },
  { phase: 'turning', frame: 3, duration: 340 },
  { phase: 'settling', frame: 4, duration: 170 },
  { phase: 'tearing', frame: 5, duration: 150 },
  { phase: 'opening', frame: 6, duration: 360 },
  { phase: 'dealing', frame: 7, duration: 160 },
  { phase: 'uncovering', frame: 8, duration: 420 },
  { phase: 'fan-ready', frame: 10, duration: 560 },
])

export const FOIL_REVEAL_PROFILES = Object.freeze({
  standard: Object.freeze({ smoke: 'purple', particles: 'sparkle', glow: 'violet', bloom: 'soft', hapticMs: 12, sound: 'foil-reveal' }),
  rare: Object.freeze({ smoke: 'gold', particles: 'sparkle', glow: 'gold', bloom: 'strong', hapticMs: 18, sound: 'foil-rare-reveal' }),
})

export const CARD_FAN_POSES = Object.freeze([
  Object.freeze({ x: -132, y: 20, rotate: -18, delay: 0 }),
  Object.freeze({ x: -68, y: 5, rotate: -9, delay: 55 }),
  Object.freeze({ x: 0, y: 0, rotate: 0, delay: 110 }),
  Object.freeze({ x: 68, y: 5, rotate: 9, delay: 165 }),
  Object.freeze({ x: 132, y: 20, rotate: 18, delay: 220 }),
])

export function packPhaseFrame(phase) {
  return PACK_OPENING_TIMELINE.find(step => step.phase === phase)?.frame ?? 1
}

export function packOpeningDuration(motion = 'full') {
  const total = PACK_OPENING_TIMELINE.reduce((sum, step) => sum + step.duration, 0)
  return motion === 'off' ? 0 : motion === 'reduced' ? Math.round(total * 0.28) : total
}

export function createPackOpeningPresentation({ packId, cards = [], interruption = null } = {}) {
  if (!packId) throw new Error('A pack ID is required for an opening presentation')
  if (cards.length !== 5) throw new Error('A booster opening presentation requires exactly five server-provided cards')
  return Object.freeze({
    packId,
    phase: 'idle',
    cards: cards.map(card => Object.freeze({ ...card, revealed: false })),
    interruption,
    allowedActions: PACK_REVEAL_ACTIONS,
  })
}

export function allPackCardsRevealed(cards) {
  return cards.length > 0 && cards.every(card => card.revealed)
}
