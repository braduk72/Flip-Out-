import { useState, useRef } from 'react'
import styles from './GameIcon.module.css'
import LunarLander from './LunarLander'

const SECRET_TAPS = 10

// Spark presets — varied durations/delays/drift/size so embers emit at random.
const SPARKS = [
  { dur: '2.4s', delay: '0s',   dx: '-6cqw', color: '#ffd24a', size: '2px' },
  { dur: '3.3s', delay: '1.1s', dx: '5cqw',  color: '#ff9b2e', size: '3px' },
  { dur: '4.1s', delay: '0.6s', dx: '-3cqw', color: '#ff8c1a', size: '1.5px' },
  { dur: '5.0s', delay: '2.2s', dx: '7cqw',  color: '#ffe06a', size: '2.5px' },
  { dur: '3.7s', delay: '1.6s', dx: '-5cqw', color: '#ffb43a', size: '3px' },
]

/**
 * Animated stone game icon.
 *
 * @param src     base plate image (transparent webp)
 * @param label   text rendered below the plate (kept out of the art on purpose)
 * @param flames  array of { x, y, delay } — firelight flicker points, % positions
 * @param needle  optional { x, y, length } — a CSS-drawn compass needle that
 *                spins on its pivot. Positions are % of the plate.
 * @param glints  array of { x, y, size, dur, delay } — occasional sparkle
 *                flashes (e.g. a glinting eye). Positions are % of the plate.
 * @param bubbles array of { x, y, size, dx, dur, delay } — bubbles that rise,
 *                drift and pop (e.g. on a cheese river). Positions are % of plate.
 * @param ripples array of { x, y, w, rot, dx, dy, dur, delay } — thin highlight
 *                lines that travel along the river to show flowing current.
 * @param splashes array of { x, y, size, dur, delay } — quick upward sprays
 *                where the cheese hits the rocks. Positions are % of the plate.
 * @param secret  optional { x, y, size } — a hidden tap zone (e.g. the compass)
 *                that triggers the lunar-lander easter egg.
 * @param onClick handler
 */
export default function GameIcon({ src, label, flames = [], needle = null, hands = [], arcs = [], glints = [], bubbles = [], ripples = [], splashes = [], secret = null, onClick }) {
  const [egg, setEgg] = useState(false)
  const tapsRef = useRef(0)
  const tapTimerRef = useRef(null)

  function onSecretTap(e) {
    e.stopPropagation()
    tapsRef.current += 1
    clearTimeout(tapTimerRef.current)
    // Reset the count if they pause — it takes 10 taps in a burst.
    tapTimerRef.current = setTimeout(() => { tapsRef.current = 0 }, 2000)
    if (tapsRef.current >= SECRET_TAPS) {
      tapsRef.current = 0
      clearTimeout(tapTimerRef.current)
      setEgg(true)
    }
  }

  return (
    <button className={styles.icon} onClick={onClick} aria-label={label}>
      <span className={styles.plate}>
        <img src={src} alt="" className={styles.plateImg} draggable="false" />

        {/* Flickering firelight over each baked-in torch flame */}
        {flames.map((f, i) => (
          <span
            key={i}
            className={styles.flame}
            style={{
              left: f.x,
              top: f.y,
              width: f.size || undefined,
              animationDuration: f.dur || '0.8s, 1.5s',
              animationDelay: f.delay || '0s, 0s',
            }}
          />
        ))}

        {/* Embers falling from each flame */}
        {flames.flatMap((f, i) =>
          SPARKS.map((s, j) => (
            <span
              key={`spark-${i}-${j}`}
              className={styles.spark}
              style={{
                left: f.x,
                top: f.y,
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 3px ${s.color}`,
                '--dx': s.dx,
                animationDuration: s.dur,
                animationDelay: `calc(${s.delay} + ${i * 0.7}s)`,
              }}
            />
          ))
        )}

        {/* Spinning compass needle — a CSS line on the compass pivot */}
        {needle && (
          <span
            className={styles.needle}
            style={{
              left: needle.x,
              top: needle.y,
              height: needle.length || '14%',
            }}
          />
        )}

        {/* Spinning clock hands (pivot at base) */}
        {hands.map((h, i) => (
          <span
            key={`hand-${i}`}
            className={styles.hand}
            style={{
              left: h.x,
              top: h.y,
              width: h.width || '2%',
              height: h.length || '15%',
              background: h.color || '#2a2010',
              animationDuration: h.dur || '6s',
            }}
          />
        ))}

        {/* Electric arcs (lightning) */}
        {arcs.map((a, i) => (
          <span
            key={`arc-${i}`}
            className={styles.arc}
            style={{
              left: a.x,
              top: a.y,
              width: a.w || '20%',
              '--rot': a.rot || '0deg',
              animationDuration: a.dur || '1.6s',
              animationDelay: a.delay || '0s',
            }}
          />
        ))}

        {/* Splashes where the cheese hits the rocks */}
        {splashes.map((s, i) => (
          <span
            key={`splash-${i}`}
            className={styles.splash}
            style={{
              left: s.x,
              top: s.y,
              width: s.size || '5%',
              animationDuration: s.dur || '3s',
              animationDelay: s.delay || '0s',
            }}
          />
        ))}

        {/* Ripple lines travelling along the river (flow current) */}
        {ripples.map((r, i) => (
          <span
            key={`ripple-${i}`}
            className={styles.ripple}
            style={{
              left: r.x,
              top: r.y,
              width: r.w || '9%',
              '--dx': r.dx || '0cqw',
              '--dy': r.dy || '0cqw',
              '--rot': r.rot || '0deg',
              animationDuration: r.dur || '2.6s',
              animationDelay: r.delay || '0s',
            }}
          />
        ))}

        {/* Bubbles rising/popping on the honey */}
        {bubbles.map((b, i) => (
          <span
            key={`bubble-${i}`}
            className={styles.bubble}
            style={{
              left: b.x,
              top: b.y,
              width: b.size || '4%',
              '--dx': b.dx || '0cqw',
              animationDuration: b.dur || '3s',
              animationDelay: b.delay || '0s',
            }}
          />
        ))}

        {/* Occasional glints (e.g. a red eye catching the light) */}
        {glints.map((g, i) => (
          <span
            key={`glint-${i}`}
            className={styles.glint}
            style={{
              left: g.x,
              top: g.y,
              width: g.size || '5%',
              '--glint-rgb': g.color || undefined,
              animationDuration: g.dur || '3.5s',
              animationDelay: g.delay || '0s',
            }}
          />
        ))}

        {/* Hidden easter-egg tap zone (the compass) */}
        {secret && (
          <span
            role="button"
            tabIndex={-1}
            aria-hidden="true"
            className={styles.secret}
            style={{ left: secret.x, top: secret.y, width: secret.size || '24%' }}
            onClick={onSecretTap}
          />
        )}

        {egg && <LunarLander onDone={() => setEgg(false)} />}
      </span>

      <span className={styles.label}>{label}</span>
    </button>
  )
}
