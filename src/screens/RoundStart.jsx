import { useEffect, useState } from 'react'
import styles from './RoundStart.module.css'

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
  } catch (e) { return }

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
  setTimeout(() => { try { ctx.close() } catch (e) {} }, 4000)
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
    <div className={styles.page}>

      {/* Portrait fills top half */}
      <div className={styles.portraitWrap}>
        <img src={opponent.image} alt="" className={styles.portrait} draggable="false" />
        <div className={styles.scanLine} />
        <div className={styles.gradient} />

        {/* ── Crosshair targeting assembly ── */}
        <div className={styles.crosshairWrap}>
          <div className={styles.chRingOuter} />
          <div className={styles.chRingInner} />
          <div className={styles.chHLine} />
          <div className={styles.chVLine} />
          <div className={styles.chCenter} />
          <div className={`${styles.chBracket} ${styles.chBrTL}`} />
          <div className={`${styles.chBracket} ${styles.chBrTR}`} />
          <div className={`${styles.chBracket} ${styles.chBrBL}`} />
          <div className={`${styles.chBracket} ${styles.chBrBR}`} />
        </div>

        {/* Full-portrait flash on lock */}
        <div className={styles.lockFlash} />

        {/* Particle bursts — fire after lock */}
        <div className={styles.particles}>
          <div className={`${styles.pt} ${styles.pt1}`} />
          <div className={`${styles.pt} ${styles.pt2}`} />
          <div className={`${styles.pt} ${styles.pt3}`} />
          <div className={`${styles.pt} ${styles.pt4}`} />
          <div className={`${styles.pt} ${styles.pt5}`} />
          <div className={`${styles.pt} ${styles.pt6}`} />
        </div>

        {/* HUD corners — tier-coloured */}
        <div className={`${styles.corner} ${styles.tl}`} style={{ borderColor: tierColor }} />
        <div className={`${styles.corner} ${styles.tr}`} style={{ borderColor: tierColor }} />
        <div className={`${styles.corner} ${styles.bl}`} style={{ borderColor: tierColor }} />
        <div className={`${styles.corner} ${styles.br}`} style={{ borderColor: tierColor }} />

        {/* Round badge — top centre */}
        <div className={styles.roundBadge} style={{ color: tierColor, borderColor: tierColor }}>
          {opponent.isBoss ? '💀 FINAL BOSS' : `ROUND ${round} OF ${total}`}
        </div>

        {/* TARGET LOCKED — appears after crosshair locks */}
        <div className={styles.targetLockedLabel}>
          {opponent.isBoss ? '■ FINAL THREAT LOCKED' : '■ TARGET LOCKED'}
        </div>
      </div>

      {/* Info panel */}
      <div className={styles.infoPanel}>

        <div className={styles.statusBar}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {opponent.isBoss ? 'FINAL BOSS DETECTED' : `${opponent.tier.toUpperCase()} TIER OPPONENT`}
          </span>
          <span className={styles.statusSpacer} />
          <span className={styles.statusCode}>{opponent.model}</span>
        </div>

        <div className={styles.name} style={{ color: opponent.isBoss ? '#e060ff' : '#fff' }}>
          {opponent.name || 'UNKNOWN'}
        </div>

        <div className={styles.threatRow}>
          <div className={styles.threatCell}>
            <span className={styles.threatLabel}>DIFFICULTY</span>
            <span className={styles.threatValue} style={{ color: tierColor }}>{opponent.difficulty.toUpperCase()}</span>
          </div>
          <div className={styles.threatCell}>
            <span className={styles.threatLabel}>UNIT ID</span>
            <span className={styles.threatValue}>{opponent.id.toUpperCase()}</span>
          </div>
        </div>

        <div className={styles.fightWrap}>
          <div className={styles.fightLabel} style={{ color: opponent.isBoss ? '#e060ff' : '#FFD700' }}>
            {opponent.isBoss ? '⚡ FACE THE CLAW ⚡' : '— FIGHT! —'}
          </div>
        </div>

        {/* CONTINUE button — slides up after animations settle */}
        <button
          className={styles.continueBtn}
          style={{
            borderColor: tierColor,
            color: tierColor,
            boxShadow: `0 0 18px ${tierColor}40`,
            pointerEvents: ready ? 'auto' : 'none',
          }}
          onClick={onStart}
        >
          <span className={styles.continueBtnArrow}>▶</span> CONTINUE
        </button>

      </div>

    </div>
  )
}
