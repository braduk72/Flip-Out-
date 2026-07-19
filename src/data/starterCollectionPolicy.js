/**
 * Contract only — no collection is granted from this module yet.
 * The product owner will set commonCardCount before an authoritative server
 * grant is implemented. Selection must query the active-theme catalogue at
 * grant time; it must never fall back to a fixed starter deck.
 */
export const STARTER_COLLECTION_POLICY = Object.freeze({
  status: 'planned',
  commonCardCount: null,
  commonSelection: Object.freeze({
    rarity: 'common',
    themes: 'all-active-themes',
    selection: 'random',
    fixedDeckIds: Object.freeze([]),
  }),
  guaranteedFoil: Object.freeze({
    rarity: 'common',
    count: 1,
    themes: 'all-active-themes',
    selection: 'random',
  }),
})

export function isStarterCollectionConfigured(policy = STARTER_COLLECTION_POLICY) {
  return Number.isInteger(policy.commonCardCount) && policy.commonCardCount > 0
}
