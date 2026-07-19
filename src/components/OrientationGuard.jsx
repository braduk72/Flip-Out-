import { useEffect, useState } from 'react'
import { applyWebOrientationPolicy, classifyMobileViewport } from '../mobile/orientationPolicy.js'

function currentViewport() {
  const coarsePointer = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false
  return { width: globalThis.innerWidth, height: globalThis.innerHeight, coarsePointer }
}

export default function OrientationGuard() {
  const [blocked, setBlocked] = useState(() => classifyMobileViewport(currentViewport()).blockLandscape)

  useEffect(() => {
    const pointerQuery = window.matchMedia?.('(pointer: coarse)')
    const update = () => {
      const viewport = currentViewport()
      const classification = classifyMobileViewport(viewport)
      document.documentElement.dataset.formFactor = classification.formFactor
      setBlocked(classification.blockLandscape)
      applyWebOrientationPolicy(viewport)
    }
    const initialViewport = currentViewport()
    document.documentElement.dataset.formFactor = classifyMobileViewport(initialViewport).formFactor
    applyWebOrientationPolicy(initialViewport)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    pointerQuery?.addEventListener?.('change', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      pointerQuery?.removeEventListener?.('change', update)
      delete document.documentElement.dataset.formFactor
    }
  }, [])

  return (
    <div className="phone-orientation-guard" role="alertdialog" aria-label="Portrait orientation required" aria-live="assertive" hidden={!blocked}>
      <span className="phone-orientation-icon" aria-hidden="true">↻</span>
      <strong>Rotate to portrait</strong>
      <p>Flip-Out is designed for portrait play on phones.</p>
    </div>
  )
}
