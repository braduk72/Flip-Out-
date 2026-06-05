import styles from './GameIcon.module.css'

/**
 * Animated stone game icon.
 *
 * @param src     base plate image (transparent webp)
 * @param label   text rendered below the plate (kept out of the art on purpose)
 * @param flames  array of { x, y, delay } — firelight flicker points, % positions
 * @param needle  optional { src, x, y, size } — a separate transparent needle/
 *                pointer image that spins on its centre (compass). Drop-in ready.
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
            style={{ left: f.x, top: f.y, animationDelay: f.delay || '0s' }}
          />
        ))}

        {/* Spinning compass needle (separate transparent asset, centred on pivot) */}
        {needle && (
          <img
            src={needle.src}
            alt=""
            className={styles.needle}
            draggable="false"
            style={{
              left: needle.x,
              top: needle.y,
              width: needle.size || '20%',
            }}
          />
        )}
      </span>

      <span className={styles.label}>{label}</span>
    </button>
  )
}
