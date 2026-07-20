import { useEffect, useState } from 'react'
import { PLAYER_SETTINGS_EVENT, getPlayerSettings } from '../utils/playerSettings.js'

export function getMotionMode() {
  if (typeof window === 'undefined') return 'off'
  return getPlayerSettings().motionMode
}

export function useMotionMode() {
  const [mode, setMode] = useState(getMotionMode)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const update = () => setMode(getMotionMode())
    query?.addEventListener?.('change', update)
    window.addEventListener('storage', update)
    window.addEventListener(PLAYER_SETTINGS_EVENT, update)
    return () => {
      query?.removeEventListener?.('change', update)
      window.removeEventListener('storage', update)
      window.removeEventListener(PLAYER_SETTINGS_EVENT, update)
    }
  }, [])
  return mode
}

export function usePageVisibility() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}
