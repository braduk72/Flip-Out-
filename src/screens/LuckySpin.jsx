import { useState, useRef, useEffect } from 'react'
import styles from './LuckySpin.module.css'
import BottomNav from '../components/BottomNav'
import Interstitial from '../components/Interstitial'

const MAX_FREE   = 1   // 1 free spin per day
const MAX_AD     = 1   // 1 extra spin per day after watching an ad

const DATE_KEY   = 'fo_spin_date'
const FREE_KEY   = 'fo_spin_free'
const AD_KEY     = 'fo_spin_ad'

function todayKey() { return new Date().toISOString().slice(0, 10) }

function resetIfNewDay() {
  if (localStorage.getItem(DATE_KEY) !== todayKey()) {
    localStorage.setItem(DATE_KEY,  todayKey())
    localStorage.setItem(FREE_KEY,  '0')
    localStorage.setItem(AD_KEY,    '0')
  }
}

function getUsed() {
  resetIfNewDay()
  return {
    free: parseInt(localStorage.getItem(FREE_KEY) || '0'),
    ad:   parseInt(localStorage.getItem(AD_KEY)   || '0'),
  }
}

const SEGMENTS = [
  { label: '×30',   icon: '🪙', type: 'coins',   value: 30,   color: '#e8a838', weight: 8      },
  { label: '×1',    icon: '❄️', type: 'freeze',               color: '#3ecfd4', weight: 22     },
  { label: '×200',  icon: '🪙', type: 'coins',   value: 200,  color: '#e84b4b', weight: 3      },
  { label: '×1',    icon: '👁️', type: 'peek',                 color: '#9b4fe8', weight: 20     },
  { label: '×1000', icon: '🪙', type: 'coins',   value: 1000, color: '#26c25a', weight: 0.0001 },
  { label: '×1',    icon: '🔀', type: 'shuffle',              color: '#3b82f6', weight: 18     },
  { label: '×50',   icon: '🪙', type: 'coins',   value: 50,   color: '#f97316', weight: 5      },
  { label: '×1',    icon: '❄️', type: 'freeze',               color: '#3ecfd4', weight: 24     },
]

function weightedRandomSeg() {
  const total = SEGMENTS.reduce((s, seg) => s + seg.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < SEGMENTS.length; i++) {
    r -= SEGMENTS[i].weight
    if (r <= 0) return i
  }
  return SEGMENTS.length - 1
}

const N = SEGMENTS.length
const SEG_DEG = 360 / N
const CX = 150, CY = 150, R = 128

// ── Web Audio tick ──────────────────────────────────────────────────────────
function playTickSound(ctx) {
  try {
    const bufLen = Math.floor(ctx.sampleRate * 0.035)
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006))
    }
    const src  = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buf
    gain.gain.value = 0.35
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  } catch (_) {}
}

// ── Tick schedule: ease-out-cubic matches wheel deceleration ────────────────
function getTickTimes(totalDeg, duration = 4200) {
  const count = Math.floor(totalDeg / SEG_DEG)
  const times = []
  for (let n = 1; n <= count; n++) {
    const frac = (n * SEG_DEG) / totalDeg          // 0→1 through spin
    const t    = 1 - Math.pow(1 - frac, 1 / 3)    // inverse cubic ease-out
    times.push(t * duration)
  }
  return times
}
const toRad = d => d * Math.PI / 180

function sectorPath(i) {
  const start = -90 + i * SEG_DEG
  const end   = start + SEG_DEG
  const x1 = CX + R * Math.cos(toRad(start)), y1 = CY + R * Math.sin(toRad(start))
  const x2 = CX + R * Math.cos(toRad(end)),   y2 = CY + R * Math.sin(toRad(end))
  return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2} Z`
}

function labelPos(i) {
  const mid = -90 + i * SEG_DEG + SEG_DEG / 2
  return { x: CX + R * 0.65 * Math.cos(toRad(mid)), y: CY + R * 0.65 * Math.sin(toRad(mid)), mid }
}

export default function LuckySpin({ onBack, navProps }) {
  const [used, setUsed]         = useState(() => getUsed())
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [prize, setPrize]       = useState(null)
  const [showAd, setShowAd]     = useState(false)
  const rotRef       = useRef(0)
  const pointerRef   = useRef(null)
  const tickTimers   = useRef([])
  const audioCtxRef  = useRef(null)

  // Clean up tick timers on unmount
  useEffect(() => () => tickTimers.current.forEach(clearTimeout), [])

  function triggerPointerTick() {
    const el = pointerRef.current
    if (!el) return
    el.classList.remove(styles.pointerTick)
    void el.offsetWidth                         // force reflow so animation restarts
    el.classList.add(styles.pointerTick)
  }

  const freeLeft = Math.max(0, MAX_FREE - used.free)
  const adLeft   = Math.max(0, MAX_AD   - used.ad)

  function doSpin(isAd = false) {
    if (spinning || prize) return

    // Initialise AudioContext on first user gesture
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch (_) {}
    }

    const targetSeg   = weightedRandomSeg()
    const targetAngle = (360 - (targetSeg * SEG_DEG + SEG_DEG / 2) + 360) % 360
    const minSpin     = rotRef.current + 5 * 360
    const n           = Math.ceil((minSpin - targetAngle) / 360)
    const finalRot    = n * 360 + targetAngle
    const totalDeg    = finalRot - rotRef.current
    rotRef.current    = finalRot
    setRotation(finalRot)
    setSpinning(true)

    // Schedule pointer ticks + audio
    tickTimers.current.forEach(clearTimeout)
    tickTimers.current = getTickTimes(totalDeg).map(t =>
      setTimeout(() => {
        triggerPointerTick()
        if (audioCtxRef.current) playTickSound(audioCtxRef.current)
      }, t)
    )

    // Record spin
    resetIfNewDay()
    if (isAd) {
      const next = parseInt(localStorage.getItem(AD_KEY) || '0') + 1
      localStorage.setItem(AD_KEY, String(next))
    } else {
      const next = parseInt(localStorage.getItem(FREE_KEY) || '0') + 1
      localStorage.setItem(FREE_KEY, String(next))
    }
    setUsed(getUsed())

    setTimeout(() => {
      const seg = SEGMENTS[targetSeg]
      setPrize(seg)
      setSpinning(false)
      if (seg.type === 'coins') {
        const cur = parseInt(localStorage.getItem('fo_coins') || '0')
        localStorage.setItem('fo_coins', String(cur + seg.value))
      }
    }, 4300)
  }

  function handleFree() {
    if (freeLeft > 0 && !spinning && !prize) doSpin(false)
  }

  function handleAdRequest() {
    if (adLeft > 0 && !spinning && !prize) setShowAd(true)
  }

  function handleAdClose() {
    setShowAd(false)
    doSpin(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <img src="/images/luckySpinBanner.png" alt="Lucky Spin" className={styles.bannerImg} />
        <div className={styles.spinsLeft}>{freeLeft + adLeft} left</div>
      </div>

      <div className={styles.wheelArea}>
        <img
          ref={pointerRef}
          src="/images/pointer.png"
          alt=""
          className={styles.pointer}
          onAnimationEnd={() => pointerRef.current?.classList.remove(styles.pointerTick)}
        />
        <img
          src="/images/wheel2.png"
          alt="Spin wheel"
          className={styles.wheel}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.08, 0.99)' : 'none',
          }}
        />
      </div>

      <div className={styles.controls}>
        {/* Free spin button */}
        <button
          className={styles.spinBtn}
          onClick={handleFree}
          disabled={spinning || !!prize || freeLeft === 0}
        >
          🎡 {freeLeft > 0 ? `Spin Free  (${freeLeft} today)` : 'Free spin used'}
        </button>

        {/* Ad spin button — only shown if free spin is used and ad spin remains */}
        {freeLeft === 0 && (
          <button
            className={styles.adBtn}
            onClick={handleAdRequest}
            disabled={spinning || !!prize || adLeft === 0}
          >
            {adLeft > 0 ? '📺  Watch Ad for Extra Spin' : '✓  Ad spin used today'}
          </button>
        )}

        <div className={styles.dailyInfo}>Resets at midnight · {freeLeft + adLeft} spin{freeLeft + adLeft !== 1 ? 's' : ''} remaining</div>
      </div>

      {/* Prize overlay */}
      {prize && (
        <div className={styles.prizeOverlay}>
          <div className={styles.prizeCard}>
            <div className={styles.prizeEmoji}>{prize.icon}</div>
            <div className={styles.prizeWon}>You won!</div>
            <div className={styles.prizeLabel}>
              {prize.label} {prize.type === 'coins' ? 'Coins' : prize.type.charAt(0).toUpperCase() + prize.type.slice(1)}
            </div>
            <button className={styles.collectBtn} onClick={() => setPrize(null)}>Collect!</button>
          </div>
        </div>
      )}

      {/* Rewarded ad interstitial */}
      {showAd && <Interstitial onClose={handleAdClose} />}

      <BottomNav active="shop" {...navProps} />
    </div>
  )
}
