import { useEffect, useState } from 'react'

export function getMotionMode() {
  if (typeof window === 'undefined') return 'off'
  const stored = window.localStorage?.getItem('fo_motion')
  if (stored === 'off' || stored === 'reduced' || stored === 'full') return stored
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full'
}

export function useMotionMode() {
  const [mode, setMode] = useState(getMotionMode)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const update = () => setMode(getMotionMode())
    query?.addEventListener?.('change', update)
    window.addEventListener('storage', update)
    return () => {
      query?.removeEventListener?.('change', update)
      window.removeEventListener('storage', update)
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
