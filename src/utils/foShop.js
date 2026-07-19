// Shop utilities: checkout, purchase application, restore

import { getDeviceUuid } from './deviceId.js'
import { economy } from './economyService.js'
import { currentSessionToken, ensureGuestIdentity } from './platformIdentity.js'

async function authenticatedHeaders() {
  if (!currentSessionToken()) await ensureGuestIdentity()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${currentSessionToken()}` }
}

// ── Apply a verified purchase to localStorage ─────────────────────────────────

export function applyPurchase({ transactionId, product_type, coins, decks, extras, removeAds }) {
  if (!transactionId) throw new Error('Verified purchase is missing its transaction id')
  return economy.applyTransaction({
    id: transactionId,
    source: 'purchase',
    changes: {
      counters: { coins: Number.parseInt(coins, 10) || 0 },
      decks: decks ?? [],
      extras: extras ?? {},
      flags: product_type === 'remove_ads' || removeAds ? { fo_no_ads: '1' } : {},
    },
  })
}

// ── Start Stripe Checkout for a product ───────────────────────────────────────

export async function startCheckout(productId) {
  const deviceUuid = getDeviceUuid()
  const res = await fetch('/api/fo-checkout', {
    method:  'POST',
    headers: await authenticatedHeaders(),
    body:    JSON.stringify({ deviceUuid, productId }),
  })
  if (!res.ok) throw new Error('Checkout request failed')
  const { url } = await res.json()
  window.location.href = url
}

// ── Verify session after Stripe redirect back to the app ──────────────────────

export async function verifySession(sessionId, deviceUuid) {
  const res = await fetch(`/api/fo-verify?session_id=${sessionId}&device=${deviceUuid}`, { headers: await authenticatedHeaders() })
  if (!res.ok) throw new Error('Verification failed')
  return res.json()  // { ok, product_type, coins, decks, extras, email }
}

// ── Restore purchases by device UUID (email sourced from Stripe) ─────────────

export async function restorePurchases() {
  const deviceUuid = getDeviceUuid()
  const res = await fetch('/api/fo-restore', {
    method:  'POST',
    headers: await authenticatedHeaders(),
    body:    JSON.stringify({ deviceUuid }),
  })
  if (!res.ok) throw new Error('Restore request failed')
  const data = await res.json()
  if (data.found) {
    data.results = (data.grants ?? []).map(applyPurchase)
    applyRestoredStats(data)
  }
  return data  // { found, grants, streakBest, pvpWins }
}

export async function linkLegacyTestPurchases() {
  const res = await fetch('/api/fo-restore', {
    method: 'POST',
    headers: await authenticatedHeaders(),
    body: JSON.stringify({ deviceUuid: getDeviceUuid(), linkLegacyTest: true }),
  })
  if (!res.ok) throw new Error('Legacy test purchase linking failed')
  return res.json()
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
  } catch {
    // Stats sync is best-effort.
  }
}

// ── Apply restored stats — keeps whichever value is higher ───────────────────

export function applyRestoredStats({ streakBest = 0, pvpWins = 0 }) {
  const localStreak = parseInt(localStorage.getItem('fo_streak_best') || '0')
  const localPvp    = parseInt(localStorage.getItem('fo_pvp_wins')    || '0')
  if (streakBest > localStreak) localStorage.setItem('fo_streak_best', String(streakBest))
  if (pvpWins    > localPvp)    localStorage.setItem('fo_pvp_wins',    String(pvpWins))
}
