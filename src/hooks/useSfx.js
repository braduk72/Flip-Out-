import { useRef, useCallback } from 'react'

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
    try {
      const ctx = getCtx()

      switch (type) {

        case 'flip': {
          // Short card-flip click/thwap
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(520, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.09)
          gain.gain.setValueAtTime(0.28, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.09)
          break
        }

        case 'match': {
          // Two-note ascending chime (C5 → E5)
          [[523, 0], [659, 0.13]].forEach(([freq, delay]) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.38, ctx.currentTime + delay)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45)
            osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.45)
          })
          break
        }

        case 'nomatch': {
          // Low dull thud
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(140, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.18)
          gain.gain.setValueAtTime(0.22, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22)
          break
        }

        case 'special': {
          // Upward power-up sweep
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(220, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.28)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32)
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.32)
          break
        }

        case 'win': {
          // Short ascending fanfare — C E G C
          ;[523, 659, 784, 1047].forEach((freq, i) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.value = freq
            const t = ctx.currentTime + i * 0.11
            gain.gain.setValueAtTime(0.32, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
            osc.start(t); osc.stop(t + 0.45)
          })
          break
        }

        case 'lose': {
          // Sad descending — F D A
          ;[349, 294, 220].forEach((freq, i) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.value = freq
            const t = ctx.currentTime + i * 0.18
            gain.gain.setValueAtTime(0.28, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
            osc.start(t); osc.stop(t + 0.5)
          })
          break
        }

        default: break
      }
    } catch (_) {
      // Silently ignore — audio API may not be available
    }
  }, [sfxOn]) // eslint-disable-line react-hooks/exhaustive-deps

  return { play }
}
