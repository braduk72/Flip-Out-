import { useEffect, useRef, useCallback, useState } from 'react'
import styles from './SeasonMap.module.css'
import BottomNav from '../components/BottomNav'
import { ACTIVE_SEASON, STEPS_PER_STAGE, BOSS_STEP } from '../data/seasonalOpponents'

// Cache-bust version — bump this whenever sprite images are replaced
const V = '?v=4'

// Path waypoints as % of image (width × height) — player avatar interpolates along these
const NODE_POSITIONS = [
  { x: 50, y: 91 }, // N0 — start, bottom centre
  { x: 66, y: 75 }, // N1 — lower-right
  { x: 44, y: 57 }, // N2 — mid
  { x: 50, y: 32 }, // N3 — industrial zone
  { x: 48, y:  5 }, // N4 — boss, danger zone top
]

// Checkpoint steps along the path (at each waypoint) — shown as ✓ when passed
const CHECKPOINT_STEPS = [0, 7, 15, 22, BOSS_STEP]

// Interpolate player position along the waypoint path (0 = start, 1 = boss)
function getMapPos(step) {
  const t        = Math.min(step / BOSS_STEP, 1)
  const segments = NODE_POSITIONS.length - 1
  const segF     = t * segments
  const segIdx   = Math.min(Math.floor(segF), segments - 1)
  const segT     = segF - segIdx
  const a        = NODE_POSITIONS[segIdx]
  const b        = NODE_POSITIONS[segIdx + 1]
  return { x: a.x + segT * (b.x - a.x), y: a.y + segT * (b.y - a.y) }
}

// Steam emitter positions (x%, y%) — pipe/chimney spots in the industrial zone
const STEAM_EMITTERS = [
  { x: 8,  y: 52 }, { x: 18, y: 44 },
  { x: 82, y: 48 }, { x: 91, y: 38 },
]

// Electric storm clouds in the danger zone (each gets a real dark cloud + lightning)
const CLOUD_POSITIONS = [
  { x: 15, y: 14, src: `/images/cld_pd1.webp${V}` },
  { x: 75, y: 10, src: `/images/cld_pd3.webp${V}` },
  { x: 40, y: 20, src: `/images/cld_pd2.webp${V}` },
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

// Fog cloud strips — each scrolls continuously left or right (marquee pattern).
// Two images side-by-side in a 200%-wide strip; animating translateX(-50%) gives a seamless loop.
// Different cloud types, heights, speeds and directions → full coverage, no gaps.
const FOG_STRIPS = [
  // Top — dense smoke / heavy dark puffs
  { top:  0, dir: 'R', dur: 65, a: 'cld_fs1', b: 'cld_fs2' },
  { top: 10, dir: 'L', dur: 52, a: 'cld_fd2', b: 'cld_pd3' },
  // Upper-mid — dark puffs
  { top: 21, dir: 'R', dur: 43, a: 'cld_pd1', b: 'cld_fd2' },
  { top: 32, dir: 'L', dur: 71, a: 'cld_pd2', b: 'cld_pd1' },
  // Mid — puff + medium grey mix
  { top: 44, dir: 'R', dur: 57, a: 'cld_pm2', b: 'cld_pd3' },
  { top: 55, dir: 'L', dur: 38, a: 'cld_fm2', b: 'cld_pm2' },
  // Lower-mid — lighter grey
  { top: 66, dir: 'R', dur: 60, a: 'cld_fw3', b: 'cld_fm2' },
  // Bottom — wispy white, fastest (nearest the reveal edge)
  { top: 76, dir: 'L', dur: 45, a: 'cld_fw1', b: 'cld_fw3' },
  { top: 85, dir: 'R', dur: 33, a: 'cld_fw2', b: 'cld_fw1' },
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
      src={`/images/m${colour}${frame}.webp${V}`}
      alt=""
      draggable="false"
      className={styles.roboMouse}
      style={{ width: size, height: size }}
    />
  )
}

// Animated tesla coil — cycles 4 frames at ~4.5fps
const TESLA_GLOW = { b: 'rgba(100,200,255,1)', y: 'rgba(255,220,80,1)', p: 'rgba(255,100,220,1)' }
function TeslaCoil({ colour = 'b', scale = 1 }) {
  const [frame, setFrame] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f === 4 ? 1 : f + 1), 220)
    return () => clearInterval(t)
  }, [])
  const size = Math.round(72 * scale)
  return (
    <img
      src={`/images/tc_${colour}${frame}.webp${V}`}
      alt=""
      draggable="false"
      className={styles.teslaImg}
      style={{ width: size, height: size, '--glow': TESLA_GLOW[colour] ?? TESLA_GLOW.b }}
    />
  )
}

export default function SeasonMap({ seasonStep = 0, portrait = 1, onFight, onBack, navProps }) {
  const scrollRef  = useRef(null)
  const imgRef     = useRef(null)
  const playerPos  = getMapPos(seasonStep)
  const isBoss     = seasonStep === BOSS_STEP
  const isComplete = seasonStep > BOSS_STEP

  const fogHeight = isComplete ? 0 : Math.max(0, playerPos.y - 38)

  const doScroll = useCallback(() => {
    const el  = scrollRef.current
    const img = imgRef.current
    if (!el || !img) return
    const imgH        = img.offsetHeight
    const scrollTarget = (playerPos.y / 100) * imgH - el.clientHeight * 0.42
    el.scrollTo({ top: 0, behavior: 'instant' })
    setTimeout(() => {
      el.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }, 650)
  }, [playerPos.y])

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
        <div className={styles.stepCounter}>{Math.min(seasonStep + 1, STEPS_PER_STAGE)}/{STEPS_PER_STAGE}</div>
      </div>

      <div className={styles.mapScroll} ref={scrollRef}>
        <div className={styles.mapCanvas}>

          {/* Map image — natural dimensions drive the canvas height */}
          <img ref={imgRef} src="/images/season1map.webp" className={styles.mapBgImg} alt="" draggable="false" />

          {/* ── Fog of war — cloud strips scrolling continuously L or R ── */}
          <div className={styles.fogZone} style={{ height: `${fogHeight}%` }}>
            <div className={styles.fogBody} />
            {FOG_STRIPS.map((s, i) => (
              <div
                key={i}
                className={`${styles.fogStrip} ${s.dir === 'L' ? styles.fogScrollL : styles.fogScrollR}`}
                style={{ top: `${s.top}%`, animationDuration: `${s.dur}s` }}
              >
                <img src={`/images/${s.a}.webp${V}`} alt="" draggable="false" />
                <img src={`/images/${s.b}.webp${V}`} alt="" draggable="false" />
              </div>
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

          {/* ── Checkpoint markers along the path ── */}
          {CHECKPOINT_STEPS.map((chkStep, i) => {
            if (chkStep === BOSS_STEP) return null  // boss handled separately
            const pos  = NODE_POSITIONS[i]
            const done = seasonStep > chkStep
            return (
              <div
                key={`chk-${i}`}
                className={`${styles.checkpoint} ${done ? styles.checkpointDone : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {done ? '✓' : ''}
              </div>
            )
          })}

          {/* ── Boss node — always visible at top ── */}
          {(() => {
            const boss   = ACTIVE_SEASON.boss
            const pos    = NODE_POSITIONS[NODE_POSITIONS.length - 1]
            const done   = seasonStep > BOSS_STEP
            const active = isBoss
            return (
              <div
                className={`${styles.node} ${styles.nodeBoss} ${done ? styles.done : active ? styles.current : styles.locked}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {done ? (
                  <>
                    <img src={boss.image} alt={boss.name} className={styles.nodeImg} draggable="false" />
                    <div className={styles.nodeDoneOverlay}>✓</div>
                  </>
                ) : active ? (
                  <>
                    <img src={boss.image} alt={boss.name} className={styles.nodeImg} draggable="false" />
                    <div className={styles.nodePulse} />
                    <div className={styles.bossFlame}>💀</div>
                  </>
                ) : (
                  <div className={styles.nodeLocked}>💀</div>
                )}
                <div className={styles.nodeLabel}>{done || active ? boss.name : '???'}</div>
              </div>
            )
          })()}

          {/* ── Player avatar — moves along path with each step ── */}
          <div
            className={styles.playerMarker}
            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
          >
            <img
              src={`/images/a${portrait}.webp`}
              alt="You"
              draggable="false"
              className={styles.playerAvatar}
            />
            <div className={styles.playerPulse} />
          </div>

        </div>
      </div>

      {/* Fight CTA */}
      {!isComplete && (
        <div className={styles.ctaBar}>
          <div className={styles.ctaInfo}>
            <span className={styles.ctaRound}>
              {isBoss ? 'SEASONAL BOSS' : `STEP ${seasonStep + 1} / ${STEPS_PER_STAGE}`}
            </span>
            <span className={styles.ctaName}>
              {isBoss ? ACTIVE_SEASON.boss.name : 'CHALLENGER'}
            </span>
          </div>
          <button
            className={`${styles.ctaBtn} ${isBoss ? styles.ctaBoss : ''}`}
            onClick={onFight}
          >
            {isBoss ? '⚡ FACE THE BOSS' : 'FIGHT!'}
          </button>
        </div>
      )}

      {isComplete && (
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
