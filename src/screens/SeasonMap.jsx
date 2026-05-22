import { useEffect, useRef, useCallback, useState } from 'react'
import styles from './SeasonMap.module.css'
import BottomNav from '../components/BottomNav'
import { ACTIVE_SEASON } from '../data/seasonalOpponents'

// Node positions as % of image (width × height).
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

// Electric storm clouds in the danger zone (each gets a real dark cloud + lightning)
const CLOUD_POSITIONS = [
  { x: 15, y: 14, src: '/images/cld_pd1.png' },
  { x: 75, y: 10, src: '/images/cld_pd3.png' },
  { x: 40, y: 20, src: '/images/cld_pd2.png' },
]

// Robomice — scattered across the map, heavier in the green zone
const MICE = [
  { x:  8, y: 88, s: 1.0, anim: 'mouseA', delay: 0.0, colour: 'g' },
  { x: 72, y: 83, s: 0.8, anim: 'mouseB', delay: 2.9, colour: 'o' },
  { x: 18, y: 76, s: 0.9, anim: 'mouseC', delay: 1.1, colour: 'p' },
  { x: 80, y: 70, s: 0.7, anim: 'mouseA', delay: 4.6, colour: 'g' },
  { x:  6, y: 63, s: 1.0, anim: 'mouseD', delay: 6.3, colour: 'o' },
  { x: 85, y: 58, s: 0.8, anim: 'mouseB', delay: 0.5, colour: 'p' },
  { x: 25, y: 50, s: 0.7, anim: 'mouseC', delay: 3.8, colour: 'g' },
  { x: 70, y: 43, s: 0.9, anim: 'mouseD', delay: 5.2, colour: 'o' },
]

// Tesla coils — industrial zone (y 38-48%) + danger zone (y 14-22%)
// colour: b=blue, y=yellow, p=pink
const TESLA_COILS = [
  { x: 13, y: 44, colour: 'b', scale: 0.85, delay: 0.0 },
  { x: 84, y: 38, colour: 'y', scale: 0.75, delay: 1.8 },
  { x: 22, y: 18, colour: 'p', scale: 0.90, delay: 0.9 },
  { x: 76, y: 14, colour: 'b', scale: 0.80, delay: 3.2 },
]

// Fog cloud sprites — layered from bottom edge (wispy/light) to top (dark smoke)
const FOG_CLOUDS = [
  // Bottom edge — flat white, slow drift
  { src: '/images/cld_fw2.png', cls: 'fogD0' },
  { src: '/images/cld_fw1.png', cls: 'fogD1' },
  { src: '/images/cld_fw3.png', cls: 'fogD2' },
  // Mid fog — flat medium grey
  { src: '/images/cld_fm2.png', cls: 'fogD3' },
  { src: '/images/cld_pm2.png', cls: 'fogD4' },
  // Upper mid — dark puffs
  { src: '/images/cld_pd2.png', cls: 'fogD5' },
  { src: '/images/cld_fd2.png', cls: 'fogD6' },
  // Near top — heavy smoke
  { src: '/images/cld_fs2.png', cls: 'fogD7' },
  { src: '/images/cld_fs1.png', cls: 'fogD8' },
]

// Animated sprite robomouse — cycles 4 frames at 6fps
function RoboMouse({ scale = 1, colour = 'g' }) {
  const [frame, setFrame] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f === 4 ? 1 : f + 1), 167)
    return () => clearInterval(t)
  }, [])
  const size = Math.round(48 * scale)
  return (
    <img
      src={`/images/m${colour}${frame}.png`}
      alt=""
      draggable="false"
      className={styles.roboMouse}
      style={{ width: size, height: size }}
    />
  )
}

// Animated tesla coil — cycles 4 frames at ~4.5fps
function TeslaCoil({ colour = 'b', scale = 1 }) {
  const [frame, setFrame] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f === 4 ? 1 : f + 1), 220)
    return () => clearInterval(t)
  }, [])
  const size = Math.round(72 * scale)
  return (
    <img
      src={`/images/tc_${colour}${frame}.png`}
      alt=""
      draggable="false"
      className={styles.teslaImg}
      style={{ width: size, height: size }}
    />
  )
}

const ALL_NODES = [
  ...ACTIVE_SEASON.opponents,
  ACTIVE_SEASON.boss,
]

export default function SeasonMap({ seasonStep = 0, onFight, onBack, navProps }) {
  const scrollRef  = useRef(null)
  const imgRef     = useRef(null)
  const currentIdx = Math.min(seasonStep, ALL_NODES.length - 1)

  const fogHeight = seasonStep >= ALL_NODES.length
    ? 0
    : Math.max(0, NODE_POSITIONS[currentIdx].y - 38)

  const doScroll = useCallback(() => {
    const el  = scrollRef.current
    const img = imgRef.current
    if (!el || !img) return
    const pos         = NODE_POSITIONS[currentIdx]
    const imgH        = img.offsetHeight
    const scrollTarget = (pos.y / 100) * imgH - el.clientHeight * 0.42
    el.scrollTo({ top: 0, behavior: 'instant' })
    setTimeout(() => {
      el.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }, 650)
  }, [currentIdx])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    if (img.complete) { doScroll() }
    else { img.addEventListener('load', doScroll, { once: true }) }
  }, [doScroll])

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
          <img ref={imgRef} src="/images/season1map.png" className={styles.mapBgImg} alt="" draggable="false" />

          {/* ── Fog of war — real cloud sprites drifting in layers ── */}
          <div className={styles.fogZone} style={{ height: `${fogHeight}%` }}>
            <div className={styles.fogBody} />
            {FOG_CLOUDS.map((c, i) => (
              <img key={i} src={c.src} alt="" draggable="false"
                className={`${styles.fogDrift} ${styles[c.cls]}`} />
            ))}
          </div>

          {/* ── Steam emitters ── */}
          {STEAM_EMITTERS.map((pos, i) => (
            <div key={`steam-${i}`} className={styles.steamEmitter}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${i * 0.7}s` }}>
              <div className={`${styles.steamPuff} ${styles[`steamPuff${i % 3}`]}`} />
              <div className={`${styles.steamPuff} ${styles[`steamPuff${(i+1) % 3}`]}`} style={{ animationDelay: `${i * 0.4 + 0.5}s` }} />
            </div>
          ))}

          {/* ── Electric storm clouds + lightning ── */}
          {CLOUD_POSITIONS.map((pos, i) => (
            <div key={`cloud-${i}`} className={styles.cloud}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${i * 2.3}s` }}>
              <img src={pos.src} alt="" draggable="false" className={styles.cloudImg} />
              <svg className={styles.lightning} viewBox="0 0 60 80" style={{ animationDelay: `${i * 1.7 + 0.4}s` }}>
                <polyline points="30,0 18,35 26,35 14,80" className={styles.boltA} />
                <polyline points="40,5 32,32 38,32 28,70"  className={styles.boltB} />
              </svg>
            </div>
          ))}

          {/* ── Tesla coils ── */}
          {TESLA_COILS.map((tc, i) => (
            <div key={`tc-${i}`} className={styles.teslaWrap}
              style={{ left: `${tc.x}%`, top: `${tc.y}%` }}>
              <div className={styles.teslaFloat} style={{ animationDelay: `${tc.delay}s` }}>
                <TeslaCoil colour={tc.colour} scale={tc.scale} />
              </div>
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
              <RoboMouse scale={m.s} colour={m.colour} />
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
