import { useEffect, useRef } from 'react'
import styles from './SeasonMap.module.css'
import BottomNav from '../components/BottomNav'
import { ACTIVE_SEASON } from '../data/seasonalOpponents'

// Node positions on the 800×1600 map canvas (percentage of canvas size)
// Match these to the landmarks you paint on season1map.png
const NODE_POSITIONS = [
  { x: 200, y: 1460 }, // c1 — VEXOR
  { x: 580, y: 1180 }, // c2 — DREAD
  { x: 160, y: 900  }, // c3 — MALIX
  { x: 600, y: 580  }, // c4 — OBLIQUE
  { x: 400, y: 140  }, // boss
]

// SVG path winding through the nodes (drawn on the 800×1600 canvas)
const PATH_D = `
  M 200,1560
  C 200,1520 200,1500 200,1460
  C 200,1380 580,1280 580,1180
  C 580,1060 160,980  160,900
  C 160,760  600,660  600,580
  C 600,400  400,280  400,140
  C 400,100  400,60   400,20
`

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

          {/* Background image — shows CSS fallback until season1map.png is dropped in */}
          <div className={styles.mapBg} />

          {/* SVG path */}
          <svg className={styles.pathSvg} viewBox="0 0 800 1600" preserveAspectRatio="xMidYMid meet">
            {/* Full path (dim) */}
            <path d={PATH_D} className={styles.pathTrack} />
            {/* Completed portion (bright) — redrawn up to current node */}
            {seasonStep > 0 && (
              <path d={PATH_D} className={styles.pathDone}
                strokeDasharray="2000"
                strokeDashoffset={String(2000 - (seasonStep / ALL_NODES.length) * 2000)}
              />
            )}
          </svg>

          {/* Nodes */}
          {ALL_NODES.map((opp, i) => {
            const pos    = NODE_POSITIONS[i]
            const status = i < seasonStep ? 'done' : i === seasonStep ? 'current' : 'locked'
            const isBoss = !!opp.isBoss

            return (
              <div
                key={opp.id}
                className={`${styles.node} ${styles[status]} ${isBoss ? styles.nodeBoss : ''}`}
                style={{ left: `${(pos.x / 800) * 100}%`, top: `${(pos.y / 1600) * 100}%` }}
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
