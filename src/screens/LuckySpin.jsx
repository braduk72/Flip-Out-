import { useState, useRef } from 'react'
import styles from './LuckySpin.module.css'
import BottomNav from '../components/BottomNav'

const MAX_FREE = 2
const DATE_KEY  = 'fo_spin_date'
const COUNT_KEY = 'fo_spin_count'

function todayKey() { return new Date().toISOString().slice(0, 10) }

function getSpinsUsed() {
  if (localStorage.getItem(DATE_KEY) !== todayKey()) {
    localStorage.setItem(DATE_KEY, todayKey())
    localStorage.setItem(COUNT_KEY, '0')
    return 0
  }
  return parseInt(localStorage.getItem(COUNT_KEY) || '0')
}

function recordSpin() {
  const n = getSpinsUsed() + 1
  localStorage.setItem(COUNT_KEY, String(n))
}

const SEGMENTS = [
  { label: '×30',   icon: '🪙', type: 'coins',   value: 30,   color: '#e8a838' },
  { label: '×1',    icon: '❄️', type: 'freeze',               color: '#3ecfd4' },
  { label: '×200',  icon: '🪙', type: 'coins',   value: 200,  color: '#e84b4b' },
  { label: '×1',    icon: '👁️', type: 'peek',                 color: '#9b4fe8' },
  { label: '×1000', icon: '🪙', type: 'coins',   value: 1000, color: '#26c25a' },
  { label: '×1',    icon: '🔀', type: 'shuffle',              color: '#3b82f6' },
  { label: '×50',   icon: '🪙', type: 'coins',   value: 50,   color: '#f97316' },
  { label: '×1',    icon: '❄️', type: 'freeze',               color: '#3ecfd4' },
]

const N = SEGMENTS.length
const SEG_DEG = 360 / N
const CX = 150, CY = 150, R = 128
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
  const [spinsUsed, setSpinsUsed] = useState(() => getSpinsUsed())
  const [rotation, setRotation]   = useState(0)
  const [spinning, setSpinning]   = useState(false)
  const [prize, setPrize]         = useState(null)
  const rotRef = useRef(0)
  const freeLeft = Math.max(0, MAX_FREE - spinsUsed)

  function doSpin() {
    if (spinning || prize) return
    const targetSeg = Math.floor(Math.random() * N)
    const targetAngle = (360 - (targetSeg * SEG_DEG + SEG_DEG / 2) + 360) % 360
    const minSpin = rotRef.current + 5 * 360
    const n = Math.ceil((minSpin - targetAngle) / 360)
    const finalRot = n * 360 + targetAngle
    rotRef.current = finalRot
    setRotation(finalRot)
    setSpinning(true)
    recordSpin()
    setSpinsUsed(s => s + 1)
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

  function handleFree() { if (freeLeft > 0 && !spinning && !prize) doSpin() }
  function handleAd()   { if (!spinning && !prize) doSpin() }  // real ad gate goes here

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Lucky Spin</h1>
        <div className={styles.spinsLeft}>{freeLeft}/{MAX_FREE}</div>
      </div>

      <div className={styles.wheelArea}>
        <div className={styles.pointer}>▼</div>
        <svg
          className={styles.wheel}
          viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.08, 0.99)' : 'none',
          }}
        >
          {/* Outer glow ring */}
          {Array.from({ length: 16 }, (_, i) => {
            const a = -90 + i * 22.5, dotR = R + 13
            return <circle key={i} cx={CX + dotR * Math.cos(toRad(a))} cy={CY + dotR * Math.sin(toRad(a))} r="5" fill="#FFD700" />
          })}

          {/* Sectors */}
          {SEGMENTS.map((seg, i) => {
            const { x, y, mid } = labelPos(i)
            return (
              <g key={i}>
                <path d={sectorPath(i)} fill={seg.color} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                <text x={x} y={y - 8} textAnchor="middle" dominantBaseline="middle" fontSize="18"
                  transform={`rotate(${mid + 90}, ${x}, ${y - 8})`}>{seg.icon}</text>
                <text x={x} y={y + 10} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="11" fontWeight="bold"
                  transform={`rotate(${mid + 90}, ${x}, ${y + 10})`}>{seg.label}</text>
              </g>
            )
          })}

          {/* Centre hub */}
          <circle cx={CX} cy={CY} r={22} fill="#1a0040" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={14} fill="#4A0090" />
        </svg>
      </div>

      <div className={styles.controls}>
        {freeLeft > 0 ? (
          <button className={styles.spinBtn} onClick={handleFree} disabled={spinning || !!prize}>
            🎡 Spin  · {freeLeft} free left
          </button>
        ) : (
          <button className={styles.adBtn} onClick={handleAd} disabled={spinning || !!prize}>
            📺 AD  Spin
          </button>
        )}
        <div className={styles.dailyInfo}>Daily available: {freeLeft}/{MAX_FREE}</div>
      </div>

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

      <BottomNav active="shop" {...navProps} />
    </div>
  )
}
