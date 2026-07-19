import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { TEST_AUDIO_FLAG, stopDocumentAudio } from '../src/utils/audioSafety.js'

let priorAudioPreferences
let priorAudioFlag

function restoreStorageValue(key, value) {
  if (value == null) localStorage.removeItem(key)
  else localStorage.setItem(key, value)
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

window.HTMLElement.prototype.scrollTo = vi.fn()
window.HTMLElement.prototype.setPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()

beforeEach(() => {
  priorAudioPreferences = { music: localStorage.getItem('fo_music'), sfx: localStorage.getItem('fo_sfx') }
  priorAudioFlag = globalThis[TEST_AUDIO_FLAG]
  globalThis[TEST_AUDIO_FLAG] = true
  localStorage.setItem('fo_music', 'off')
  localStorage.setItem('fo_sfx', 'off')
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  stopDocumentAudio()
  cleanup()
  localStorage.clear()
  restoreStorageValue('fo_music', priorAudioPreferences?.music)
  restoreStorageValue('fo_sfx', priorAudioPreferences?.sfx)
  if (priorAudioFlag === undefined) delete globalThis[TEST_AUDIO_FLAG]
  else globalThis[TEST_AUDIO_FLAG] = priorAudioFlag
  delete document.documentElement.dataset.motion
  vi.useRealTimers()
})
