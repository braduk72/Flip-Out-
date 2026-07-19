import { Capacitor, registerPlugin } from '@capacitor/core'
import { getDeviceUuid } from './deviceId.js'

const SESSION_KEY = 'fo_player_session'
const PLAYER_KEY = 'fo_player_id'
const GameCenterIdentity = registerPlugin('GameCenterIdentity')

export const platformIdentityAdapters = {
  ios: {
    async authenticate() { return GameCenterIdentity.authenticate() },
  },
  android: {
    async authenticate() { throw new Error('Google Play Games adapter is not configured') },
  },
  web: {
    async authenticate() { return null },
  },
}

async function identityRequest(body, token = null) {
  const response = await fetch('/api/fo-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw Object.assign(new Error(data.error), { status: response.status, code: data.code })
  return data
}

function storeIdentity(result) {
  const token = result.session?.token
  const playerId = result.playerId ?? result.player?.player_id
  if (token) localStorage.setItem(SESSION_KEY, token)
  if (playerId) localStorage.setItem(PLAYER_KEY, playerId)
  return result
}

export async function ensureGuestIdentity() {
  const result = await identityRequest({ action: 'guest', deviceUuid: getDeviceUuid() })
  return storeIdentity(result)
}

export async function upgradeGuestWithGameCenter(identity) {
  const token = localStorage.getItem(SESSION_KEY)
  try {
    return storeIdentity(await identityRequest({ action: 'game-center', identity, upgrade: true }, token))
  } catch (error) {
    if (error.code !== 'IDENTITY_CONFLICT') throw error
    // Existing protected identity wins. The guest is retained separately and is never merged.
    return storeIdentity(await identityRequest({ action: 'game-center', identity, upgrade: false }, token))
  }
}

export async function bootstrapPlatformIdentity() {
  const guest = await ensureGuestIdentity()
  const platform = Capacitor.getPlatform()
  if (platform !== 'ios') return guest
  try {
    const identity = await platformIdentityAdapters.ios.authenticate()
    return identity ? await upgradeGuestWithGameCenter(identity) : guest
  } catch {
    return guest // Declining or unavailable Game Center never blocks play.
  }
}

export function currentSessionToken() { return localStorage.getItem(SESSION_KEY) }
export function currentPlayerId() { return localStorage.getItem(PLAYER_KEY) }
