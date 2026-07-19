// This list is intentionally explicit. Only real player portraits placed in
// public/images/avatars may enter the catalogue; never discover assets at run time.
const CURATED_AVATARS = Object.freeze([
  ['clash-badger', 'Badger'],
  ['clash-blackhole', 'Black hole'],
  ['clash-bolt', 'Bolt'],
  ['clash-cheetah', 'Cheetah'],
  ['clash-clock', 'Clockwork'],
  ['clash-computer', 'Computer'],
  ['clash-eel', 'Electric eel'],
  ['clash-ninja', 'Ninja'],
  ['clash-robot', 'Robot'],
  ['clash-shark', 'Shark'],
  ['clash-trex', 'Tyrannosaurus rex'],
  ['clash-wizard', 'Wizard'],
])

export const AVATAR_CATEGORIES = Object.freeze([{ id: 'all', label: 'All' }])

export const AVATAR_CATALOG = Object.freeze(CURATED_AVATARS.map(([id, label], index) => Object.freeze({
  id,
  categoryId: 'all',
  label,
  asset: `/images/avatars/${id}.webp`,
  legacyPortrait: index + 1,
  availability: 'starter',
})))

export const ONBOARDING_AVATARS = AVATAR_CATALOG
export const AVATAR_BY_ID = new Map(AVATAR_CATALOG.map(avatar => [avatar.id, avatar]))

// Preview profiles created before the curated catalogue can still be displayed.
// New submissions must use isCuratedAvatarId and therefore cannot add aliases.
const LEGACY_AVATAR_ALIASES = new Map([
  ...AVATAR_CATALOG.map(avatar => [`starter-${avatar.legacyPortrait}`, avatar.id]),
  ['starter-13', 'clash-wizard'],
  ['starter-14', 'clash-badger'],
  ['beta-tester', 'clash-robot'],
])

export function isCuratedAvatarId(avatarId) {
  return AVATAR_BY_ID.has(String(avatarId ?? ''))
}

export function getAvatarById(avatarId) {
  const requestedId = String(avatarId ?? '')
  return AVATAR_BY_ID.get(LEGACY_AVATAR_ALIASES.get(requestedId) ?? requestedId) ?? null
}

export function getAvatarByLegacyPortrait(portrait) {
  return AVATAR_CATALOG.find(avatar => avatar.legacyPortrait === Number(portrait)) ?? null
}
