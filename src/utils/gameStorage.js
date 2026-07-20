// Persistent game storage — writes to both localStorage and a 1-year cookie.
// On load, if localStorage is empty for a key, the cookie backup is used.
// This survives browser "clear cache/history" actions that skip cookies.

const COOKIE_NAME = 'fo_save'
const COOKIE_DAYS = 365

// Keys we want backed up to the cookie
const BACKUP_KEYS = [
  'fo_coins', 'fo_trophies', 'fo_owned_decks',
  'fo_gauntlet_step', 'fo_season1_step',
  'fo_portrait', 'fo_difficulty',
  'fo_music', 'fo_sfx', 'fo_music_vol', 'fo_sfx_vol',
  'fo_streak_best', 'fo_pvp_wins',
  'fo_dlb_last', 'fo_dlb_day',
  'fo_gold_card', 'fo_rob_names',
  'fo_remove_ads', 'fo_tiebreakers',
  'fo_economy_transactions', 'fo_spin_bonus', 'fo_free_unlocks',
  'fo_unlocked_avatars', 'fo_jokers', 'fo_joker_date',
  'fo_no_ads',
]

// ── Cookie helpers ────────────────────────────────────────────────────────────

function readCookie() {
  try {
    const match = document.cookie.split(';').find(c => c.trim().startsWith(COOKIE_NAME + '='))
    if (!match) return {}
    return JSON.parse(decodeURIComponent(match.trim().slice(COOKIE_NAME.length + 1)))
  } catch {
    return {}
  }
}

function writeCookie(data) {
  try {
    const expires = new Date()
    expires.setDate(expires.getDate() + COOKIE_DAYS)
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch {
    /* ignore storage/cookie failures in restricted browser modes */
  }
}

export function snapshotToCookie() {
  const data = {}
  for (const key of BACKUP_KEYS) {
    const val = localStorage.getItem(key)
    if (val !== null) data[key] = val
  }
  writeCookie(data)
}

// ── Restore on startup ────────────────────────────────────────────────────────

export function restoreFromCookie() {
  const saved = readCookie()
  if (!Object.keys(saved).length) return
  for (const [key, val] of Object.entries(saved)) {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, val)
    }
  }
}

// ── Drop-in localStorage wrappers ─────────────────────────────────────────────

export function gsGet(key, fallback = null) {
  const val = localStorage.getItem(key)
  if (val !== null) return val
  const saved = readCookie()
  return saved[key] ?? fallback
}

export function gsSet(key, value) {
  localStorage.setItem(key, value)
  if (BACKUP_KEYS.includes(key)) snapshotToCookie()
}

export function gsRemove(key) {
  localStorage.removeItem(key)
  if (BACKUP_KEYS.includes(key)) snapshotToCookie()
}
