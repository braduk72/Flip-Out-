import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'

// a11 = dollar sign, a13 = buy button, a14 = cancel — not avatars
const AVATARS  = [9, 10, 1, 2, 3, 4, 5, 6, 7, 8]
const LOCKED   = 6   // seasonal slots — swap in real avatar ids as images are made

export default function AvatarPicker({ portrait, onPortrait, onBack, navProps }) {
  function pick(i) {
    onPortrait(i)
    onBack()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Choose Your Player</h1>
      </div>

      <div className={styles.grid}>
        {AVATARS.map(i => (
          <button
            key={i}
            className={`${styles.avatarBtn} ${portrait === i ? styles.selected : ''}`}
            onClick={() => pick(i)}
            aria-label={`Select player ${i}`}
          >
            <img src={`/images/a${i}.webp`} alt={`Player ${i}`} draggable="false" />
            {portrait === i && <span className={styles.checkmark}>✓</span>}
          </button>
        ))}

        {Array.from({ length: LOCKED }).map((_, i) => (
          <div key={`locked-${i}`} className={styles.lockedSlot} aria-label="Coming soon">
            <span className={styles.lockedQ}>?</span>
            <span className={styles.lockedLabel}>Season 1</span>
          </div>
        ))}
      </div>
      <BottomNav active="home" {...navProps} />
    </div>
  )
}
