import styles from './GameIcon.module.css'

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
 * @param onClick handler
 */
export default function GameIcon({ src, label, flames = [], needle = null, onClick }) {
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
      </span>

      <span className={styles.label}>{label}</span>
    </button>
  )
}
