export const TABLET_SMALLEST_WIDTH = 600

export function classifyMobileViewport({ width, height, coarsePointer }) {
  const safeWidth = Math.max(0, Number(width) || 0)
  const safeHeight = Math.max(0, Number(height) || 0)
  if (!coarsePointer) return { formFactor: 'desktop', blockLandscape: false }
  const tablet = Math.min(safeWidth, safeHeight) >= TABLET_SMALLEST_WIDTH
  return {
    formFactor: tablet ? 'tablet' : 'phone',
    blockLandscape: !tablet && safeWidth > safeHeight,
  }
}

export async function applyWebOrientationPolicy({ width, height, coarsePointer, orientation = globalThis.screen?.orientation } = {}) {
  const classification = classifyMobileViewport({ width, height, coarsePointer })
  try {
    if (classification.formFactor === 'tablet') orientation?.unlock?.()
    if (classification.formFactor === 'phone') await orientation?.lock?.('portrait')
  } catch {
    // Browsers commonly restrict locking to installed or fullscreen apps.
    // The phone-landscape guard remains the reliable web fallback.
  }
  return classification
}
