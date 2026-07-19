/**
 * Presentation contract for the future server-authoritative pack opening.
 * It deliberately renders nothing and reveals no card: a component can later
 * use these phases after the approved booster API has committed its contents.
 */
export const PACK_OPENING_PHASES = Object.freeze([
  'idle', 'enlarging', 'turning', 'tearing', 'opening', 'dealing', 'fan-ready', 'revealing', 'complete',
])

export const PACK_REVEAL_ACTIONS = Object.freeze(['reveal-card', 'reveal-all'])

export function createPackOpeningPresentation({ packId, cards = [] } = {}) {
  if (!packId) throw new Error('A pack ID is required for an opening presentation')
  return Object.freeze({
    packId,
    phase: 'idle',
    cards: cards.map(card => Object.freeze({ ...card, revealed: false })),
    allowedActions: PACK_REVEAL_ACTIONS,
  })
}
