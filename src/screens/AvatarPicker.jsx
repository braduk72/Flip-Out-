import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'

const AVATARS = [1, 2, 3, 4]

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
            <img src={`/images/a${i}.png`} alt={`Player ${i}`} draggable="false" />
            {portrait === i && <span className={styles.checkmark}>✓</span>}
          </button>
        ))}
      </div>
      <BottomNav active="home" {...navProps} />
    </div>
  )
}
