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

function useMidnightCountdown() {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    function update() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.max(0, midnight - now)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return display
}

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
  { label: '10',  icon: '🪙', img: 'coin_mult_x10.webp',  type: 'coins', value: 10,  color: '#f97316', weight: 18 },
  { label: '100', icon: '🪙', img: 'coin_mult_x100.webp', type: 'coins', value: 100, color: '#FFD700', weight: 1  },
  { label: '5',   icon: '🪙', img: 'coin_mult_x5.webp',   type: 'coins', value: 5,   color: '#e8a838', weight: 25 },
  { label: '50',  icon: '🪙', img: 'coin_mult_x50.webp',  type: 'coins', value: 50,  color: '#3ecfd4', weight: 2  },
  { label: '1',   icon: '🪙', img: 'coin_mult_x1.webp',   type: 'coins', value: 1,   color: '#b8721e', weight: 30 },
  { label: '25',  icon: '🪙', img: 'coin_mult_x25.webp',  type: 'coins', value: 25,  color: '#9b4fe8', weight: 4  },
  { label: '15',  icon: '🪙', img: 'coin_mult_x15.webp',  type: 'coins', value: 15,  color: '#e84b4b', weight: 12 },
  { label: '20',  icon: '🪙', img: 'coin_mult_x20.webp',  type: 'coins', value: 20,  color: '#26c25a', weight: 8  },
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
function getTickTimes(totalDeg, duration = 7000) {
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
  const [prize, setPrize]       = useState(() =>
    new URLSearchParams(window.location.search).has('testprize') ? SEGMENTS[0] : null
  )
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

  const freeLeft     = Math.max(0, MAX_FREE - used.free)
  const adLeft       = Math.max(0, MAX_AD   - used.ad)
  const midnightTimer = useMidnightCountdown()

  function doSpin(isAd = false) {
    if (spinning || prize) return

    // Initialise AudioContext on first user gesture
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch (_) {}
    }

    const targetSeg   = weightedRandomSeg()
    const targetAngle = (360 - (targetSeg * SEG_DEG + SEG_DEG / 2) + 360) % 360
    const minSpin     = rotRef.current + 9 * 360
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
      const cur = parseInt(localStorage.getItem('fo_coins') || '0')
      localStorage.setItem('fo_coins', String(cur + seg.value))
    }, 7100)
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
        <div className={styles.spinsLeft}>🕛 {midnightTimer}</div>
      </div>

      <div className={styles.wheelArea}>
        <img src="/images/luckySpinBanner.webp" alt="Lucky Spin" className={styles.bigBanner} />
        <img
          ref={pointerRef}
          src="/images/pointer.webp"
          alt=""
          className={styles.pointer}
          onAnimationEnd={() => pointerRef.current?.classList.remove(styles.pointerTick)}
        />
        <div
          className={styles.wheelWrap}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 7s cubic-bezier(0.17, 0.67, 0.08, 0.99)' : 'none',
          }}
        >
          <img src="/images/wheel2.webp" alt="Spin wheel" className={styles.wheelBg} draggable="false" />
          {SEGMENTS.map((seg, i) => {
            const midDeg = -90 + i * (360 / N) + (360 / N) / 2
            const rad    = midDeg * Math.PI / 180
            const x      = 50 + 34 * Math.cos(rad)
            const y      = 50 + 34 * Math.sin(rad)
            return (
              <img
                key={i}
                src={`/images/${seg.img}`}
                alt={seg.label}
                draggable="false"
                className={styles.segImg}
                style={{
                  left:      `${x}%`,
                  top:       `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${midDeg + 90}deg)`,
                }}
              />
            )
          })}
        </div>
      </div>

      <div className={styles.controls}>
        {/* Free spin button — hidden once used */}
        {freeLeft > 0 && (
          <button
            className={styles.spinImgBtn}
            onClick={handleFree}
            disabled={spinning || !!prize}
          >
            <img src="/images/spin1.webp" alt="Spin" className={styles.spinImgBtnImg} />
          </button>
        )}

        {/* Ad spin button — shown once free spin is used */}
        {freeLeft === 0 && (
          <button
            className={styles.adBtn}
            onClick={handleAdRequest}
            disabled={spinning || !!prize || adLeft === 0}
          >
            <img src="/images/video3.webp" alt="" className={styles.adBtnIcon} />
            {adLeft > 0 ? 'Watch Ad for Extra Spin' : 'Ad spin used today'}
          </button>
        )}
      </div>

      {/* Prize overlay */}
      {prize && (
        <div className={styles.prizeOverlay}>
          <div className={styles.prizeCard}>
            <div className={styles.prizeEmoji}>{prize.icon}</div>
            <div className={styles.prizeWon}>You won!</div>
            <div className={styles.prizeLabel}>
              {prize.label} Coins 🪙
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
