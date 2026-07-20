const TITLE_ID = /^title:(prefix|suffix):[a-z0-9-]+$/

export const PLAYER_TITLE_PREFIXES = Object.freeze([
  { id: 'title:prefix:captain', label: 'Captain', mode: 'before-name', source: 'starter' },
  { id: 'title:prefix:the-collector', label: 'The Collector', mode: 'standalone', source: 'starter' },
  { id: 'title:prefix:rookie', label: 'Rookie', mode: 'before-name', source: 'starter' },
  { id: 'title:prefix:star-chaser', label: 'Star Chaser', mode: 'before-name', source: 'starter' },
])

export const PLAYER_TITLE_SUFFIXES = Object.freeze([
  { id: 'title:suffix:the-magnificent', label: 'the Magnificent', source: 'starter' },
  { id: 'title:suffix:the-collector', label: 'the Collector', source: 'starter' },
  { id: 'title:suffix:puzzle-ace', label: 'Puzzle Ace', source: 'starter' },
  { id: 'title:suffix:of-the-arcade', label: 'of the Arcade', source: 'starter' },
])

export const PLAYER_TITLE_CATALOG = Object.freeze([...PLAYER_TITLE_PREFIXES, ...PLAYER_TITLE_SUFFIXES])
export const PLAYER_TITLE_BY_ID = new Map(PLAYER_TITLE_CATALOG.map(title => [title.id, title]))

export function isTitleId(value) {
  return TITLE_ID.test(String(value ?? ''))
}

export function getPlayerTitleById(value) {
  return PLAYER_TITLE_BY_ID.get(String(value ?? '')) ?? null
}

export function normaliseTitleSelection({ prefixId = null, suffixId = null } = {}) {
  const prefix = prefixId == null || prefixId === '' ? null : String(prefixId)
  const suffix = suffixId == null || suffixId === '' ? null : String(suffixId)
  if (prefix && !PLAYER_TITLE_PREFIXES.some(title => title.id === prefix)) throw Object.assign(new Error('Unknown title prefix'), { status: 400, code: 'INVALID_TITLE_PREFIX' })
  if (suffix && !PLAYER_TITLE_SUFFIXES.some(title => title.id === suffix)) throw Object.assign(new Error('Unknown title suffix'), { status: 400, code: 'INVALID_TITLE_SUFFIX' })
  return { prefixId: prefix, suffixId: suffix }
}

export function availablePlayerTitles(inventory = []) {
  const owned = new Set((inventory ?? []).filter(row => Number(row.quantity) > 0).map(row => row.item_id))
  const prefixes = PLAYER_TITLE_PREFIXES.filter(title => title.source === 'starter' || owned.has(title.id))
  const suffixes = PLAYER_TITLE_SUFFIXES.filter(title => title.source === 'starter' || owned.has(title.id))
  return { prefixes, suffixes }
}

export function formatPlayerTitle({ playerName = 'Player', prefixId = null, suffixId = null } = {}) {
  const name = String(playerName || 'Player')
  const prefix = getPlayerTitleById(prefixId)
  const suffix = getPlayerTitleById(suffixId)
  if (prefix?.mode === 'standalone' && !suffix) return prefix.label
  if (prefix && suffix) return `${prefix.label} ${name} ${suffix.label}`
  if (prefix) return prefix.mode === 'standalone' ? prefix.label : `${prefix.label} ${name}`
  if (suffix) return `${name} ${suffix.label}`
  return 'Choose a title'
}

