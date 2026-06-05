import { useRef, useCallback } from 'react'

// Module-level set so stopAll() can reach sounds fired from any instance
const _active = new Set()
let _specialAudio = null

// Module-level SFX volume (0-1) — set via setSfxVol() from App.jsx
let _sfxVol = parseFloat(localStorage.getItem('fo_sfx_vol') ?? '0.7')
export function setSfxVol(v) { _sfxVol = Math.max(0, Math.min(1, v)) }

let _dingCtx = null
function getDingCtx() {
  if (!_dingCtx) _dingCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (_dingCtx.state === 'suspended') _dingCtx.resume()
  return _dingCtx
}

function playSpecial() {
  // Synthesised bell ding — two sine partials for warmth, natural decay
  try {
    const ctx  = getDingCtx()
    const now  = ctx.currentTime
    const dur  = 1.2

    function partial(freq, vol) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      osc.start(now); osc.stop(now + dur)
    }

    partial(880,  0.30 * _sfxVol)   // fundamental
    partial(2637, 0.12 * _sfxVol)   // bright overtone (E7)
  } catch (_) {}
}

export function playHoverTick() {
  try {
    const ctx  = getDingCtx()
    const now  = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04)
    gain.gain.setValueAtTime(0.10 * _sfxVol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    osc.start(now); osc.stop(now + 0.04)
  } catch (_) {}
}

export function playFile(src, volume = 0.65) {
  try {
    const a = new Audio(src)
    a.volume = volume * _sfxVol
    _active.add(a)
    a.addEventListener('ended',  () => _active.delete(a))
    a.addEventListener('error',  () => _active.delete(a))
    a.play().catch(() => {})
  } catch (_) {}
}

export function useSfx(sfxOn) {
  const ctxRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const play = useCallback((type) => {
    if (!sfxOn) return

    switch (type) {

      case 'flip': {
        // Keep synthesised — needs to fire instantly on every tap
        try {
          const ctx  = getCtx()
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(520, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.09)
          gain.gain.setValueAtTime(0.28 * _sfxVol, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.09)
        } catch (_) {}
        break
      }

      case 'match': {
        const matches = [
          '/sounds/used/match1.mp3',
          '/sounds/used/match2.mp3',
          '/sounds/used/correct.mp3',
          '/sounds/used/correct2.mp3',
          '/sounds/used/correct3.mp3',
          '/sounds/used/correct4.mp3',
          '/sounds/used/correct5.mp3',
        ]
        playFile(matches[Math.floor(Math.random() * matches.length)])
        break
      }
      case 'nomatch': {
        const misses = ['/sounds/used/wrong.mp3', '/sounds/used/wrong2.mp3']
        playFile(misses[Math.floor(Math.random() * misses.length)])
        break
      }
      case 'special':  playSpecial();                                     break
      case 'shuffle':  playFile('/sounds/used/skillful-shuffling.mp3');  break
      case 'dice_roll': {
        // Synthesised dice-rattle: noise bursts timed to match the dice animation (fast → slow)
        try {
          const ctx = getCtx()
          const now = ctx.currentTime

          function noiseBurst(t, dur, vol) {
            const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
            const buf = ctx.createBuffer(1, len, ctx.sampleRate)
            const data = buf.getChannelData(0)
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
            const src = ctx.createBufferSource()
            src.buffer = buf
            const bp = ctx.createBiquadFilter()
            bp.type = 'bandpass'
            bp.frequency.value = 2600 + Math.random() * 1000
            bp.Q.value = 3.5
            const g = ctx.createGain()
            g.gain.setValueAtTime(vol, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + dur)
            src.connect(bp); bp.connect(g); g.connect(ctx.destination)
            src.start(t); src.stop(t + dur + 0.02)
          }

          // Mirror the dice-animation intervals: 10×60ms, 6×100ms, 3×160ms, 2×230ms
          const intervals = [
            ...Array(10).fill(0.060),
            ...Array(6).fill(0.100),
            ...Array(3).fill(0.160),
            ...Array(2).fill(0.230),
          ]
          let t = now + 0.02
          for (const d of intervals) {
            noiseBurst(t, d * 0.55, (0.22 + Math.random() * 0.18) * _sfxVol)
            t += d
          }
        } catch (_) {}
        break
      }
      case 'joker':    playFile('/sounds/used/Joker.mp3');               break
      case 'coinwin':  playFile('/sounds/used/yay.mp3');                 break
      case 'coinlose': playFile('/sounds/used/coinlose.mp3');            break
      case 'win': {
        const wins = [
          '/sounds/used/victory2.mp3',
          '/sounds/used/victory3.mp3',
          '/sounds/used/victory4.mp3',
          '/sounds/used/victory5.mp3',
          '/sounds/used/winLevel.mp3',
          '/sounds/used/victory-level.mp3',
          '/sounds/used/victory-cheer.mp3',
        ]
        playFile(wins[Math.floor(Math.random() * wins.length)])
        break
      }
      case 'lose':     playFile('/sounds/used/game-over.mp3');           break

      default: break
    }
  }, [sfxOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopAll = useCallback(() => {
    _active.forEach(a => { try { a.pause(); a.src = '' } catch (_) {} })
    _active.clear()
    _specialAudio = null
  }, [])

  return { play, stopAll }
}
