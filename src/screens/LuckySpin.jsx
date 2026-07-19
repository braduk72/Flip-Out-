import { useState, useRef, useEffect } from 'react'
import styles from './LuckySpin.module.css'
import BottomNav from '../components/BottomNav'
import Interstitial from '../components/Interstitial'
import confetti from 'canvas-confetti'
import { createTransactionId, economy } from '../utils/economyService.js'
import { playerGameApi } from '../utils/gameApi.js'

const MAX_FREE   = 1   // 1 free spin per day
const MAX_AD     = 1   // 1 extra spin per day after watching an ad

const DATE_KEY   = 'fo_spin_date'
const FREE_KEY   = 'fo_spin_free'
const AD_KEY     = 'fo_spin_ad'
const COIN_KEY   = 'fo_spin_coins'

function todayKey() { return new Date().toLocaleDateString('en-CA') } // YYYY-MM-DD in local time

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
    economy.applyTransaction({
      id: `spin-reset:${todayKey()}`,
      source: 'spin-reset',
      changes: { flags: { [DATE_KEY]: todayKey(), [FREE_KEY]: 0, [AD_KEY]: 0, [COIN_KEY]: 0 } },
    })
  }
}

function getUsed() {
  resetIfNewDay()
  return {
    free: parseInt(localStorage.getItem(FREE_KEY) || '0'),
    ad: parseInt(localStorage.getItem(AD_KEY) || '0'),
    coins: parseInt(localStorage.getItem(COIN_KEY) || '0'),
  }
}

const SEGMENTS = [
  { label: '100',  icon: '⭐', img: 'coin_mult_x10.webp',  type: 'stars', value: 100,  color: '#f97316', weight: 18 },
  { label: '1000', icon: '⭐', img: 'coin_mult_x100.webp', type: 'stars', value: 1000, color: '#FFD700', weight: 1  },
  { label: '50',   icon: '⭐', img: 'coin_mult_x5.webp',   type: 'stars', value: 50,   color: '#e8a838', weight: 25 },
  { label: '500',  icon: '⭐', img: 'coin_mult_x50.webp',  type: 'stars', value: 500,  color: '#3ecfd4', weight: 2  },
  { label: '10',   icon: '⭐', img: 'coin_mult_x1.webp',   type: 'stars', value: 10,   color: '#b8721e', weight: 30 },
  { label: '250',  icon: '⭐', img: 'coin_mult_x25.webp',  type: 'stars', value: 250,  color: '#9b4fe8', weight: 4  },
  { label: '150',  icon: '⭐', img: 'coin_mult_x15.webp',  type: 'stars', value: 150,  color: '#e84b4b', weight: 12 },
  { label: '200',  icon: '⭐', img: 'coin_mult_x20.webp',  type: 'stars', value: 200,  color: '#26c25a', weight: 8  },
]

const N = SEGMENTS.length
const SEG_DEG = 360 / N

// ── Web Audio tada fanfare ───────────────────────────────────────────────────
function playTadaSound(ctx) {
  try {
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.35)
    })
  } catch {
    // Audio is optional and may be unavailable in restricted browser contexts.
  }
}

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
  } catch {
    // Audio is optional and may be unavailable in restricted browser contexts.
  }
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
export default function LuckySpin({ onBack, navProps }) {
  const [used, setUsed]         = useState(() => getUsed())
  const [bonusLeft, setBonusLeft] = useState(() => parseInt(localStorage.getItem('fo_spin_bonus') || '0'))
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
  const coinLeft     = Math.max(0, 1 - used.coins)
  const midnightTimer = useMidnightCountdown()

  async function doSpin(type = 'free', advertCompletionId) {
    if (spinning || prize) return
    setSpinning(true)
    let serverResult
    try {
      serverResult = await playerGameApi.spinWheel({ spinType: type, advertCompletionId })
    } catch (error) {
      setSpinning(false)
      window.alert(error.message)
      return
    }

    // Initialise AudioContext on first user gesture
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch {
        // The wheel remains usable without Web Audio.
      }
    }

    const targetSeg = SEGMENTS.findIndex(segment => segment.value === Number(serverResult.reward?.amount))
    if (targetSeg < 0) { setSpinning(false); window.alert('The server returned an unknown wheel reward.'); return }
    const spinId = serverResult.transactionId
    const targetAngle = (360 - (targetSeg * SEG_DEG + SEG_DEG / 2) + 360) % 360
    const minSpin     = rotRef.current + 9 * 360
    const n           = Math.ceil((minSpin - targetAngle) / 360)
    const finalRot    = n * 360 + targetAngle
    const totalDeg    = finalRot - rotRef.current
    rotRef.current    = finalRot
    setRotation(finalRot)

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
    if (type === 'ad') {
      const next = parseInt(localStorage.getItem(AD_KEY) || '0') + 1
      economy.applyTransaction({ id: `${spinId}:consume`, source: 'spin-consume', changes: { flags: { [AD_KEY]: next } } })
    } else if (type === 'coins') {
      economy.applyTransaction({ id: `${spinId}:cost`, source: 'spin-cost-server', changes: { counters: { coins: -25 }, flags: { [COIN_KEY]: 1 } } })
    } else {
      const next = parseInt(localStorage.getItem(FREE_KEY) || '0') + 1
      economy.applyTransaction({ id: `${spinId}:consume`, source: 'spin-consume', changes: { flags: { [FREE_KEY]: next } } })
    }
    setUsed(getUsed())

    setTimeout(() => {
      const seg = SEGMENTS[targetSeg]
      setPrize(seg)
      setSpinning(false)
      if (audioCtxRef.current) playTadaSound(audioCtxRef.current)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, zIndex: 200 })
      economy.applyTransaction({
        id: spinId,
        source: 'lucky-spin-server',
        changes: { counters: { stars: seg.value } },
      })
    }, 7100)
  }

  function handleFree() {
    if (freeLeft > 0 && !spinning && !prize) doSpin('free')
  }

  function handleAdRequest() {
    if (adLeft > 0 && !spinning && !prize) setShowAd(true)
  }

  function handleAdCancel() {
    setShowAd(false)
  }

  function handleBonus() {
    if (bonusLeft > 0) window.alert('Bonus spins are temporarily unavailable while they are moved to the secure server inventory.')
  }

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="rewards-wheel">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <div className={styles.spinsLeft}>🕛 {midnightTimer}</div>
        {import.meta.env.VITE_DEV_TOOLS === 'true' && (
          <button className={styles.devReset} title="Reset daily spins" onClick={() => {
            economy.applyTransaction({
              id: createTransactionId('dev:spin-reset'),
              source: 'dev',
              changes: { flags: { [DATE_KEY]: '', [FREE_KEY]: 0, [AD_KEY]: 0, [COIN_KEY]: 0 } },
            })
            setUsed(getUsed())
            setBonusLeft(parseInt(localStorage.getItem('fo_spin_bonus') || '0'))
          }}>🔄</button>
        )}
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
            <strong>Spin</strong>
            <span>Free daily spin</span>
          </button>
        )}

        {/* Ad spin button — shown once free spin is used */}
        {freeLeft === 0 && (
          <button
            className={`${styles.spinImgBtn} ${styles.spinAdBtn}`}
            onClick={handleAdRequest}
            disabled={spinning || !!prize || adLeft === 0}
          >
            <strong>{adLeft === 0 ? 'Extra spin used' : 'Watch advert'}</strong>
            <span>{adLeft === 0 ? 'Available again tomorrow' : 'Earn one extra spin'}</span>
          </button>
        )}

        {freeLeft === 0 && coinLeft > 0 && (
          <button className={styles.bonusSpinBtn} onClick={() => doSpin('coins')} disabled={spinning || !!prize}>
            <span className={styles.bonusSpinIcon}>🪙</span>
            <span className={styles.bonusSpinLabel}>COIN SPIN</span>
            <span className={styles.bonusSpinCount}>25</span>
          </button>
        )}

        {/* Bonus spin button — shown when promo spins are available */}
        {bonusLeft > 0 && (
          <button
            className={styles.bonusSpinBtn}
            onClick={handleBonus}
            disabled
            title="Pending secure bonus-spin inventory support"
          >
            <span className={styles.bonusSpinIcon}>🎟️</span>
            <span className={styles.bonusSpinLabel}>BONUS SPIN</span>
            <span className={styles.bonusSpinCount}>×{bonusLeft}</span>
          </button>
        )}
      </div>

      {/* Prize overlay */}
      {prize && (
        <div className={styles.prizeOverlay}>
          <div className={styles.prizeCard}>
            <img src={`/images/${prize.img}`} alt={prize.label} className={styles.prizeCoinImg} />
            <div className={styles.prizeWon}>You won!</div>
            <div className={styles.prizeLabel}>{prize.label} Coins</div>
            <button className={styles.collectBtn} onClick={() => setPrize(null)}>Collect!</button>
          </div>
        </div>
      )}

      {/* Rewarded ad interstitial */}
      {showAd && <Interstitial onCancel={handleAdCancel} />}

      <BottomNav active="rewards" {...navProps} />
    </div>
  )
}
