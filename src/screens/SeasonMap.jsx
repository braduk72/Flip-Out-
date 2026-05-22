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

// Robomice — scattered across the map, heavier in the green zone
// x%, y%, scale (size), animClass, delay
const MICE = [
  { x:  8, y: 88, s: 1.0, anim: 'mouseA', delay: 0    },
  { x: 72, y: 83, s: 0.8, anim: 'mouseB', delay: 1.4  },
  { x: 18, y: 76, s: 0.9, anim: 'mouseC', delay: 0.6  },
  { x: 80, y: 70, s: 0.7, anim: 'mouseA', delay: 2.1  },
  { x:  6, y: 63, s: 1.0, anim: 'mouseD', delay: 3.0  },
  { x: 85, y: 58, s: 0.8, anim: 'mouseB', delay: 0.9  },
  { x: 25, y: 50, s: 0.7, anim: 'mouseC', delay: 1.8  },
  { x: 70, y: 43, s: 0.9, anim: 'mouseD', delay: 0.3  },
]

// Inline SVG robomouse — points right, scaleX(-1) to face left
function RoboMouse({ scale = 1, style }) {
  return (
    <svg
      viewBox="0 0 44 28"
      width={Math.round(32 * scale)}
      height={Math.round(20 * scale)}
      style={style}
      className={styles.roboMouse}
    >
      {/* Body */}
      <ellipse cx="18" cy="18" rx="14" ry="9" fill="#7a7a8a" />
      {/* Head */}
      <ellipse cx="34" cy="15" rx="9" ry="8" fill="#9a9aaa" />
      {/* Ears */}
      <circle cx="30" cy="7"  r="4.5" fill="#6a6a7a" />
      <circle cx="30" cy="7"  r="2.5" fill="#aa5577" />
      <circle cx="38" cy="6"  r="3.5" fill="#6a6a7a" />
      <circle cx="38" cy="6"  r="2"   fill="#aa5577" />
      {/* Eye — glowing green */}
      <circle cx="36" cy="14" r="2.5" fill="#001a00" />
      <circle cx="36" cy="14" r="1.5" fill="#00e864" />
      <circle cx="36" cy="14" r="0.6" fill="#ccffcc" />
      {/* Snout */}
      <ellipse cx="43" cy="17" rx="2" ry="1.5" fill="#888898" />
      {/* Whiskers */}
      <line x1="43" y1="16" x2="44" y2="14" stroke="#ccc" strokeWidth="0.5" />
      <line x1="43" y1="17" x2="44" y2="17" stroke="#ccc" strokeWidth="0.5" />
      <line x1="43" y1="18" x2="44" y2="20" stroke="#ccc" strokeWidth="0.5" />
      {/* Mechanical body plate */}
      <rect x="10" y="14" width="12" height="7" rx="2" fill="#5a5a6a" />
      <circle cx="16" cy="17" r="1.5" fill="#aaa" />
      <line x1="13" y1="17" x2="19" y2="17" stroke="#888" strokeWidth="0.6" />
      {/* Tail — angular robo style */}
      <polyline points="4,20 0,18 0,23 4,24" stroke="#5a5a6a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Legs — little stubs */}
      <rect x="10" y="24" width="4" height="3" rx="1" fill="#666" />
      <rect x="16" y="24" width="4" height="3" rx="1" fill="#666" />
      <rect x="22" y="24" width="4" height="3" rx="1" fill="#666" />
    </svg>
  )
}

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

          {/* ── Robomice swarm ── */}
          {MICE.map((m, i) => (
            <div
              key={`mouse-${i}`}
              className={`${styles.mouseWrap} ${styles[m.anim]}`}
              style={{
                left: `${m.x}%`,
                top:  `${m.y}%`,
                animationDelay: `${m.delay}s`,
              }}
            >
              <RoboMouse scale={m.s} />
            </div>
          ))}

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
