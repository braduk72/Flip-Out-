import { useEffect, useState } from 'react'
import styles from './RoundStart.module.css'
import { Badge, CardPanel } from '../ui/components.jsx'

const TIER_COLORS = {
  Easy:   '#afffb8',
  Medium: '#ffe080',
  Hard:   '#ffaaaa',
  Lethal: '#e060ff',
}

// ── Sound synthesis (no audio files needed) ─────────────────────────────────

function playTargetingSounds(sfxOn) {
  if (!sfxOn) return
  let ctx
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  } catch { return }

  // Resume in case browser suspended the context
  ctx.resume().catch(() => {})

  const vol = 0.15

  // ── Seeking pings — ascending frequency, accelerating toward lock ──
  // 15 pings spread over 0–2.4s, gaps shrink as crosshair closes in
  const pings = [
    { t: 0.10, f: 460 },
    { t: 0.40, f: 500 },
    { t: 0.67, f: 545 },
    { t: 0.92, f: 595 },
    { t: 1.14, f: 645 },
    { t: 1.34, f: 700 },
    { t: 1.52, f: 760 },
    { t: 1.68, f: 820 },
    { t: 1.82, f: 890 },
    { t: 1.94, f: 960 },
    { t: 2.05, f: 1040 },
    { t: 2.14, f: 1120 },
    { t: 2.22, f: 1210 },
    { t: 2.29, f: 1310 },
    { t: 2.37, f: 1420 },
  ]

  pings.forEach(({ t, f }) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = f
    const s = ctx.currentTime + t
    gain.gain.setValueAtTime(0, s)
    gain.gain.linearRampToValueAtTime(vol, s + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, s + 0.065)
    osc.start(s)
    osc.stop(s + 0.08)
  })

  // ── Lock sound at 2.5s — two-layer: sharp sweep + resonant tone ──
  const lt = ctx.currentTime + 2.5

  // Layer 1: square wave sweep 2200 → 80 Hz (the "CLUNK")
  const sweep = ctx.createOscillator()
  const sweepGain = ctx.createGain()
  sweep.connect(sweepGain)
  sweepGain.connect(ctx.destination)
  sweep.type = 'square'
  sweep.frequency.setValueAtTime(2200, lt)
  sweep.frequency.exponentialRampToValueAtTime(80, lt + 0.14)
  sweepGain.gain.setValueAtTime(0.3, lt)
  sweepGain.gain.exponentialRampToValueAtTime(0.001, lt + 0.22)
  sweep.start(lt)
  sweep.stop(lt + 0.25)

  // Layer 2: filtered sawtooth glide — the electronic "lock" ring
  const tone   = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const toneGain = ctx.createGain()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 10
  tone.connect(filter)
  filter.connect(toneGain)
  toneGain.connect(ctx.destination)
  tone.type = 'sawtooth'
  tone.frequency.setValueAtTime(1000, lt)
  tone.frequency.exponentialRampToValueAtTime(380, lt + 0.3)
  toneGain.gain.setValueAtTime(0.22, lt)
  toneGain.gain.exponentialRampToValueAtTime(0.001, lt + 0.45)
  tone.start(lt)
  tone.stop(lt + 0.5)

  // Layer 3: brief high click for snap impact
  const click = ctx.createOscillator()
  const clickGain = ctx.createGain()
  click.connect(clickGain)
  clickGain.connect(ctx.destination)
  click.type = 'sine'
  click.frequency.value = 3200
  clickGain.gain.setValueAtTime(0.25, lt)
  clickGain.gain.exponentialRampToValueAtTime(0.001, lt + 0.035)
  click.start(lt)
  click.stop(lt + 0.04)

  // Clean up context after all sounds finish
  setTimeout(() => { try { ctx.close() } catch { /* Context may already be closed. */ } }, 4000)
}

// ────────────────────────────────────────────────────────────────────────────

export default function RoundStart({ opponent, round, total, onStart, sfxOn = true }) {
  const tierColor = TIER_COLORS[opponent.tier] || '#fff'

  // Button only becomes active after animations have settled (3.7s)
  // This prevents any click-through from the previous screen's FIGHT button
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const r = setTimeout(() => setReady(true), 3700)
    return () => clearTimeout(r)
  }, [])

  // Fire sound effects on mount
  useEffect(() => {
    playTargetingSounds(sfxOn)
  }, [sfxOn])

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="round-start">
      <header className={styles.roundHeader}>
        <span>Knockout Gauntlet</span>
        <strong>{opponent.isBoss ? 'Final Boss' : `Round ${round} of ${total}`}</strong>
      </header>
      <main className={styles.content}>
        <CardPanel as="article" className={styles.opponentCard}>
          <div className={styles.portraitWrap} style={{ '--tier-colour': tierColor }}>
            <img src={opponent.image} alt={opponent.name || 'Gauntlet opponent'} className={styles.portrait} draggable="false" />
            <span className={styles.targetLockedLabel}>{opponent.isBoss ? 'Final threat ready' : 'Opponent ready'}</span>
          </div>
          <div className={styles.opponentCopy}>
            <Badge tone={opponent.isBoss ? 'foil' : 'neutral'}>{opponent.isBoss ? 'Final Boss' : `${opponent.tier} tier`}</Badge>
            <h1 className={styles.name}>{opponent.name || 'Unknown opponent'}</h1>
            <p>{opponent.model}</p>
            <dl className={styles.threatRow}>
              <div><dt>Difficulty</dt><dd style={{ color: tierColor }}>{opponent.difficulty}</dd></div>
              <div><dt>Unit ID</dt><dd>{opponent.id.toUpperCase()}</dd></div>
            </dl>
          </div>
        </CardPanel>
        <button
          className={styles.continueBtn}
          disabled={!ready}
          onClick={onStart}
        >
          {ready ? 'Continue' : 'Preparing round…'}
        </button>
      </main>
    </div>
  )
}
