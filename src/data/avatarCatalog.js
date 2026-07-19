const starterPortraits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14]

export const AVATAR_CATEGORIES = Object.freeze([
  { id: 'all', label: 'All' },
])

export const AVATAR_CATALOG = Object.freeze([
  ...starterPortraits.map(number => Object.freeze({
    id: `starter-${number}`,
    categoryId: 'all',
    label: `Starter avatar ${number}`,
    asset: `/images/a${number}.webp`,
    legacyPortrait: number,
    availability: 'starter',
  })),
  Object.freeze({
    id: 'beta-tester',
    categoryId: 'all',
    label: 'Beta Tester avatar',
    asset: '/images/a99.webp',
    legacyPortrait: 99,
    availability: 'promo',
  }),
])

export const ONBOARDING_AVATARS = Object.freeze(AVATAR_CATALOG.filter(avatar => avatar.availability === 'starter'))
export const AVATAR_BY_ID = new Map(AVATAR_CATALOG.map(avatar => [avatar.id, avatar]))

export function getAvatarById(avatarId) {
  return AVATAR_BY_ID.get(String(avatarId ?? '')) ?? null
}

export function getAvatarByLegacyPortrait(portrait) {
  return AVATAR_CATALOG.find(avatar => avatar.legacyPortrait === Number(portrait)) ?? null
}

