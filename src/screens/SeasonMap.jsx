import { useEffect, useRef } from 'react'
import styles from './SeasonMap.module.css'
import BottomNav from '../components/BottomNav'
import { ACTIVE_SEASON } from '../data/seasonalOpponents'

// Node positions as % of image (width × height).
// Calibrated to the three robocat landmark figures in season1map.png
// x=left%, y=top%
const NODE_POSITIONS = [
  { x: 50, y: 91 }, // N0 VEXOR   — large green start circle, bottom centre
  { x: 66, y: 75 }, // N1 DREAD   — lower-right winding path section
  { x: 44, y: 57 }, // N2 MALIX   — white/teal robocat platform, mid green zone
  { x: 50, y: 32 }, // N3 OBLIQUE — gold robocat platform, industrial zone
  { x: 48, y:  5 }, // N4 BOSS    — red boss robocat, danger zone top
]

// Steam emitter positions (x%, y%) — pipe/chimney spots in the industrial zone
const STEAM_EMITTERS = [
  { x: 8,  y: 52 }, { x: 18, y: 44 },
  { x: 82, y: 48 }, { x: 91, y: 38 },
]

// Electric cloud positions — float in the red danger zone
const CLOUD_POSITIONS = [
  { x: 15, y: 14 }, { x: 75, y: 10 }, { x: 40, y: 20 },
]

const ALL_NODES = [
  ...ACTIVE_SEASON.opponents,
  ACTIVE_SEASON.boss,
]

export default function SeasonMap({ seasonStep = 0, onFight, onBack, navProps }) {
  const scrollRef  = useRef(null)
  const currentIdx = Math.min(seasonStep, ALL_NODES.length - 1)

  // Auto-scroll to current node on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const pos    = NODE_POSITIONS[currentIdx]
    const canvas = 1600
    const ratio  = pos.y / canvas
    // Scroll so the current node sits ~40% from top of viewport
    const scrollTarget = el.scrollHeight * ratio - el.clientHeight * 0.4
    el.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
  }, [currentIdx])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <div className={styles.seasonTitle}>
          <span className={styles.seasonTag}>SEASON 1</span>
          <span className={styles.seasonName}>{ACTIVE_SEASON.theme}</span>
        </div>
        <div className={styles.stepCounter}>{Math.min(seasonStep, ALL_NODES.length)}/{ALL_NODES.length}</div>
      </div>

      <div className={styles.mapScroll} ref={scrollRef}>
        <div className={styles.mapCanvas}>

          {/* Map image — natural dimensions drive the canvas height */}
          <img src="/images/season1map.png" className={styles.mapBgImg} alt="" draggable="false" />

          {/* ── Steam emitters ── */}
          {STEAM_EMITTERS.map((pos, i) => (
            <div key={`steam-${i}`} className={styles.steamEmitter}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${i * 0.7}s` }}>
              <div className={`${styles.steamPuff} ${styles[`steamPuff${i % 3}`]}`} />
              <div className={`${styles.steamPuff} ${styles[`steamPuff${(i+1) % 3}`]}`} style={{ animationDelay: `${i * 0.4 + 0.5}s` }} />
            </div>
          ))}

          {/* ── Electric clouds ── */}
          {CLOUD_POSITIONS.map((pos, i) => (
            <div key={`cloud-${i}`} className={styles.cloud}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${i * 2.3}s` }}>
              <div className={styles.cloudBody} />
              <svg className={styles.lightning} viewBox="0 0 60 80" style={{ animationDelay: `${i * 1.7 + 0.4}s` }}>
                <polyline points="30,0 18,35 26,35 14,80" className={styles.boltA} />
                <polyline points="40,5 32,32 38,32 28,70"  className={styles.boltB} />
              </svg>
            </div>
          ))}

          {/* ── Wandering robots — tiny c1/c2 sprites drifting near the path edges ── */}
          <img src="/images/c1.png" alt="" className={`${styles.wanderer} ${styles.wandererA}`} draggable="false" />
          <img src="/images/c2.png" alt="" className={`${styles.wanderer} ${styles.wandererB}`} draggable="false" />

          {/* ── Opponent nodes ── */}
          {ALL_NODES.map((opp, i) => {
            const pos    = NODE_POSITIONS[i]
            const status = i < seasonStep ? 'done' : i === seasonStep ? 'current' : 'locked'
            const isBoss = !!opp.isBoss

            return (
              <div
                key={opp.id}
                className={`${styles.node} ${styles[status]} ${isBoss ? styles.nodeBoss : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={status === 'current' ? onFight : undefined}
                role={status === 'current' ? 'button' : undefined}
                aria-label={status === 'current' ? `Fight ${opp.name}` : opp.name}
              >
                {status === 'done' ? (
                  <>
                    <img src={opp.image} alt={opp.name} className={styles.nodeImg} draggable="false" />
                    <div className={styles.nodeDoneOverlay}>✓</div>
                  </>
                ) : status === 'current' ? (
                  <>
                    <img src={opp.image} alt={opp.name} className={styles.nodeImg} draggable="false" />
                    <div className={styles.nodePulse} />
                    {isBoss && <div className={styles.bossFlame}>💀</div>}
                  </>
                ) : (
                  <div className={styles.nodeLocked}>
                    {isBoss ? '💀' : '🔒'}
                  </div>
                )}
                <div className={styles.nodeLabel}>
                  {status === 'locked' ? '???' : opp.name}
                </div>
              </div>
            )
          })}

        </div>
      </div>

      {/* Fight CTA — only shown when not complete */}
      {seasonStep < ALL_NODES.length && (
        <div className={styles.ctaBar}>
          <div className={styles.ctaInfo}>
            <span className={styles.ctaRound}>{ALL_NODES[currentIdx].label}</span>
            <span className={styles.ctaName}>{ALL_NODES[currentIdx].name}</span>
          </div>
          <button
            className={`${styles.ctaBtn} ${ALL_NODES[currentIdx].isBoss ? styles.ctaBoss : ''}`}
            onClick={onFight}
          >
            {ALL_NODES[currentIdx].isBoss ? '⚡ FACE THE BOSS' : 'FIGHT!'}
          </button>
        </div>
      )}

      {seasonStep >= ALL_NODES.length && (
        <div className={styles.ctaBar}>
          <div className={styles.ctaInfo}>
            <span className={styles.ctaRound}>SEASON COMPLETE</span>
            <span className={styles.ctaName}>Gold card earned ✦</span>
          </div>
        </div>
      )}

      <BottomNav active="home" {...navProps} />
    </div>
  )
}
