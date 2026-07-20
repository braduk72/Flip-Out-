import { annualChoiceEligibility } from '../src/data/itemCatalog.js'

export const WHEEL_ACTIONS = Object.freeze(['wheel:free', 'wheel:advert', 'wheel:coins'])

export function localDateKey(date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const get = type => parts.find(part => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function continuationDecision({ advertUsed, coinUsed, advertVerified, coins, coinCost = 25 }) {
  if (!advertUsed) return advertVerified ? { allowed: true, method: 'advert', coinDelta: 0 } : { allowed: false, reason: 'verified-advert-required' }
  if (coinUsed) return { allowed: false, reason: 'continuation-limit' }
  if (coins < coinCost) return { allowed: false, reason: 'insufficient-coins' }
  return { allowed: true, method: 'coins', coinDelta: -coinCost }
}

export function claimDailyAction(previousActions, action, dateKey) {
  if (!WHEEL_ACTIONS.includes(action)) throw new Error('Invalid daily action')
  const id = `${action}:${dateKey}`
  return previousActions.has(id) ? { allowed: false, duplicate: true, id } : { allowed: true, duplicate: false, id }
}

export function consumePowerUp({ quantity, matchStatus, alreadyUsed }) {
  if (matchStatus !== 'active') return { allowed: false, reason: 'invalid-match-state' }
  if (alreadyUsed) return { allowed: false, reason: 'duplicate-activation' }
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { allowed: false, reason: 'not-owned' }
  return { allowed: true, quantityDelta: -1 }
}

export function openLockbox({ boxes, keys, alreadyOpened }) {
  if (alreadyOpened) return { allowed: false, duplicate: true }
  if (boxes < 1) return { allowed: false, reason: 'missing-box' }
  if (keys < 1) return { allowed: false, reason: 'missing-key' }
  return { allowed: true, boxDelta: -1, keyDelta: -1 }
}

export function auctionAmounts(grossCoins, feeBasisPoints = 2000) {
  if (!Number.isSafeInteger(grossCoins) || grossCoins <= 0) throw new Error('Price must be a positive integer')
  if (!Number.isSafeInteger(feeBasisPoints) || feeBasisPoints < 0 || feeBasisPoints > 10000) throw new Error('Invalid fee')
  const feeCoins = Math.floor(grossCoins * feeBasisPoints / 10000)
  return { grossCoins, feeCoins, netCoins: grossCoins - feeCoins }
}

export function validateListing({ item, quantity, priceCoins, sellerId, buyerId, minPrice = 1, maxPrice = 1000000 }) {
  if (!item?.tradable) return { allowed: false, reason: 'item-not-tradable' }
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { allowed: false, reason: 'invalid-quantity' }
  if (!Number.isSafeInteger(priceCoins) || priceCoins < minPrice || priceCoins > maxPrice) return { allowed: false, reason: 'invalid-price' }
  if (buyerId && buyerId === sellerId) return { allowed: false, reason: 'self-purchase' }
  return { allowed: true }
}

export function annualChoice(items, eventYear, selectedItemId) {
  const eligible = annualChoiceEligibility(items, eventYear)
  const selected = eligible.find(item => item.id === selectedItemId)
  return selected ? { allowed: true, item: selected } : { allowed: false, reason: 'ineligible-item' }
}

export function nextDailyStreak({ lastClaimKey, todayKey, yesterdayKey, streak = 0, graceDays = 0 }) {
  if (lastClaimKey === todayKey) return { claimable: false, duplicate: true, streak }
  if (lastClaimKey === yesterdayKey) return { claimable: true, streak: streak + 1 }
  return { claimable: true, streak: graceDays > 0 ? Math.max(1, streak) : 1 }
}

export function resolveCloudSync({ cloud, local }) {
  if (!cloud) return { action: 'upload', state: local.state, version: local.version }
  if (!local || cloud.revision >= (local.revision ?? 0)) return { action: 'download', state: cloud.state, version: cloud.version }
  return { action: 'reject-local-rollback', state: cloud.state, version: cloud.version }
}

export function detectAnomaly({ amount, claimsToday, clientTimestamp, now = Date.now() }) {
  const flags = []
  if (Math.abs(amount ?? 0) > 100000) flags.push('abnormal-value-change')
  if ((claimsToday ?? 0) > 100) flags.push('excessive-claims')
  if (clientTimestamp && Math.abs(now - new Date(clientTimestamp).getTime()) > 86400000) flags.push('client-clock-skew')
  return flags
}
