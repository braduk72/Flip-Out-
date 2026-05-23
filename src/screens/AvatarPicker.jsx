import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'

// Only a1 (Siamese) and a2 (orange tabby) are real cat avatars
const AVATARS  = [1, 2]
const LOCKED   = 6   // remaining slots — placeholder until more avatars are made

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
          </div>
        ))}
      </div>
      <BottomNav active="home" {...navProps} />
    </div>
  )
}
