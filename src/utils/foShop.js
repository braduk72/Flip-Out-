// Shop utilities: checkout, purchase application, restore

import { getDeviceUuid } from './deviceId.js'

// ── Apply a verified purchase to localStorage ─────────────────────────────────

export function applyPurchase({ product_type, coins, decks, extras, removeAds }) {
  // Coins
  if (coins > 0) {
    const cur = parseInt(localStorage.getItem('fo_coins') || '0')
    localStorage.setItem('fo_coins', String(cur + coins))
  }

  // Decks
  if (decks?.length) {
    const owned = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const merged = [...new Set([...owned, ...decks])]
    localStorage.setItem('fo_owned_decks', JSON.stringify(merged))
  }

  // Remove ads
  if (product_type === 'remove_ads' || removeAds) {
    localStorage.setItem('fo_no_ads', '1')
  }

  // Extras (power-ups stored as fo_extra_xray, fo_extra_freeze, etc.)
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      const cur = parseInt(localStorage.getItem(`fo_extra_${k}`) || '0')
      localStorage.setItem(`fo_extra_${k}`, String(cur + v))
    }
  }
}

// ── Start Stripe Checkout for a product ───────────────────────────────────────

export async function startCheckout(productId) {
  const deviceUuid = getDeviceUuid()
  const res = await fetch('/api/fo-checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deviceUuid, productId }),
  })
  if (!res.ok) throw new Error('Checkout request failed')
  const { url } = await res.json()
  window.location.href = url
}

// ── Verify session after Stripe redirect back to the app ──────────────────────

export async function verifySession(sessionId, deviceUuid) {
  const res = await fetch(`/api/fo-verify?session_id=${sessionId}&device=${deviceUuid}`)
  if (!res.ok) throw new Error('Verification failed')
  return res.json()  // { ok, product_type, coins, decks, extras, email }
}

// ── Restore purchases by device UUID (email sourced from Stripe) ─────────────

export async function restorePurchases() {
  const deviceUuid = getDeviceUuid()
  const res = await fetch('/api/fo-restore', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deviceUuid }),
  })
  if (!res.ok) throw new Error('Restore request failed')
  const data = await res.json()
  if (data.found) {
    applyPurchase(data)
    applyRestoredStats(data)
  }
  return data  // { found, coins, decks, removeAds, extras, streakBest, pvpWins }
}

// ── Sync game stats to the server (fire-and-forget) ──────────────────────────

export function syncStats(streakBest, pvpWins) {
  try {
    const deviceUuid = getDeviceUuid()
    fetch('/api/fo-sync-stats', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deviceUuid, streakBest, pvpWins }),
    }).catch(() => {})  // silent — stats sync is best-effort
  } catch (_) {}
}

// ── Apply restored stats — keeps whichever value is higher ───────────────────

export function applyRestoredStats({ streakBest = 0, pvpWins = 0 }) {
  const localStreak = parseInt(localStorage.getItem('fo_streak_best') || '0')
  const localPvp    = parseInt(localStorage.getItem('fo_pvp_wins')    || '0')
  if (streakBest > localStreak) localStorage.setItem('fo_streak_best', String(streakBest))
  if (pvpWins    > localPvp)    localStorage.setItem('fo_pvp_wins',    String(pvpWins))
}
