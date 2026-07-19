const TEST_AUDIO_FLAG = '__FLIPOUT_TEST_AUDIO_DISABLED__'

/** True only in the automated harness. This flag is never set by the player. */
export function isAutomatedAudioDisabled() {
  return typeof globalThis !== 'undefined' && globalThis[TEST_AUDIO_FLAG] === true
}

/** Stop disposable HTML media created by a test before its DOM is torn down. */
export function stopDocumentAudio() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('audio, video').forEach(media => {
    try {
      media.pause()
      media.currentTime = 0
    } catch {
      // A detached media element is already silent.
    }
  })
}

export { TEST_AUDIO_FLAG }
