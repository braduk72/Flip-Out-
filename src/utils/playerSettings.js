import { useEffect, useState } from 'react'

export const PLAYER_SETTINGS_EVENT = 'flipout:player-settings'

export const DEFAULT_PLAYER_SETTINGS = Object.freeze({
  moveHints: true,
  motionMode: 'full',
  screenShake: true,
})

const STORAGE_KEYS = Object.freeze({
  moveHints: 'fo_move_hints',
  motionMode: 'fo_motion',
  screenShake: 'fo_screen_shake',
})

function readBoolean(key, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = window.localStorage?.getItem(key)
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export function getPlayerSettings() {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_SETTINGS
  const storedMotion = window.localStorage?.getItem(STORAGE_KEYS.motionMode)
  const motionMode = ['off', 'reduced', 'full'].includes(storedMotion)
    ? storedMotion
    : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full'
  return {
    moveHints: readBoolean(STORAGE_KEYS.moveHints, DEFAULT_PLAYER_SETTINGS.moveHints),
    motionMode,
    screenShake: readBoolean(STORAGE_KEYS.screenShake, DEFAULT_PLAYER_SETTINGS.screenShake),
  }
}

export function savePlayerSettings(nextSettings = {}) {
  if (typeof window === 'undefined') return getPlayerSettings()
  const current = getPlayerSettings()
  const merged = { ...current, ...nextSettings }
  window.localStorage?.setItem(STORAGE_KEYS.moveHints, String(Boolean(merged.moveHints)))
  window.localStorage?.setItem(STORAGE_KEYS.screenShake, String(Boolean(merged.screenShake)))
  window.localStorage?.setItem(STORAGE_KEYS.motionMode, ['off', 'reduced', 'full'].includes(merged.motionMode) ? merged.motionMode : current.motionMode)
  window.dispatchEvent(new CustomEvent(PLAYER_SETTINGS_EVENT, { detail: getPlayerSettings() }))
  return getPlayerSettings()
}

export function usePlayerSettings() {
  const [settings, setSettings] = useState(getPlayerSettings)
  useEffect(() => {
    const update = () => setSettings(getPlayerSettings())
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    window.addEventListener('storage', update)
    window.addEventListener(PLAYER_SETTINGS_EVENT, update)
    motionQuery?.addEventListener?.('change', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(PLAYER_SETTINGS_EVENT, update)
      motionQuery?.removeEventListener?.('change', update)
    }
  }, [])
  return settings
}
