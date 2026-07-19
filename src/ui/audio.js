import { useCallback, useMemo } from 'react'

export const UI_AUDIO_EVENTS = Object.freeze({
  BUTTON_PRESS: 'button-press',
  CAROUSEL_CHANGE: 'carousel-change',
  COIN_STORE_OPEN: 'coin-store-open',
  PLAY_ACTIVATION: 'play-activation',
  SPARKLE: 'subtle-sparkle',
  MATCH3_PREVIEW_CASCADE: 'match3-preview-cascade',
})

// Temporary synthesised placeholders. They are intentionally not final SFX assets.
const PLACEHOLDER_TONES = Object.freeze({
  [UI_AUDIO_EVENTS.BUTTON_PRESS]: [330, 0.035],
  [UI_AUDIO_EVENTS.CAROUSEL_CHANGE]: [440, 0.045],
  [UI_AUDIO_EVENTS.COIN_STORE_OPEN]: [523, 0.07],
  [UI_AUDIO_EVENTS.PLAY_ACTIVATION]: [659, 0.09],
  [UI_AUDIO_EVENTS.SPARKLE]: [880, 0.04],
  [UI_AUDIO_EVENTS.MATCH3_PREVIEW_CASCADE]: [740, 0.045],
})

export function playUiAudio(eventName, { enabled = true } = {}) {
  if (!enabled || typeof window === 'undefined') return false
  const tone = PLACEHOLDER_TONES[eventName]
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!tone || !AudioContext) return false
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = tone[0]
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + tone[1])
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + tone[1] + 0.01)
    oscillator.addEventListener('ended', () => context.close().catch(() => {}), { once: true })
    return true
  } catch {
    return false
  }
}

export function useUiAudio(enabled = true) {
  const play = useCallback(name => playUiAudio(name, { enabled }), [enabled])
  return useMemo(() => ({
    buttonPress: () => play(UI_AUDIO_EVENTS.BUTTON_PRESS),
    carouselChange: () => play(UI_AUDIO_EVENTS.CAROUSEL_CHANGE),
    coinStoreOpen: () => play(UI_AUDIO_EVENTS.COIN_STORE_OPEN),
    playActivation: () => play(UI_AUDIO_EVENTS.PLAY_ACTIVATION),
    sparkle: () => play(UI_AUDIO_EVENTS.SPARKLE),
    previewCascade: () => play(UI_AUDIO_EVENTS.MATCH3_PREVIEW_CASCADE),
  }), [play])
}
