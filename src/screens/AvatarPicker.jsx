import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'

// Standard avatars always shown
const AVATARS = [1, 2]
const LOCKED  = 6  // remaining slots — placeholder until more avatars are made

// Special avatars unlocked by promo code — keyed by portrait number
const SPECIAL_AVATARS = {
  99: { label: '⚠️ Beta Tester', badge: 'BETA TESTER' },
}

function getUnlockedAvatars() {
  return JSON.parse(localStorage.getItem('fo_unlocked_avatars') || '[]')
}

export default function AvatarPicker({ portrait, onPortrait, onBack, navProps }) {
  const unlockedSpecial = getUnlockedAvatars()

  function pick(i) {
    onPortrait(i)
    onBack()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <img src="/images/back_button.webp" alt="Back" draggable="false" className={styles.backBtnImg} />
        </button>
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

        {/* Special unlockable avatars — only shown if redeemed */}
        {unlockedSpecial.map(id => (
          <button
            key={`special-${id}`}
            className={`${styles.avatarBtn} ${portrait === id ? styles.selected : ''} ${styles.specialAvatar}`}
            onClick={() => pick(id)}
            aria-label={SPECIAL_AVATARS[id]?.label || `Special avatar ${id}`}
          >
            <img src={`/images/a${id}.webp`} alt={SPECIAL_AVATARS[id]?.label || ''} draggable="false" />
            {SPECIAL_AVATARS[id]?.badge && <span className={styles.specialBadge}>{SPECIAL_AVATARS[id].badge}</span>}
            {portrait === id && <span className={styles.checkmark}>✓</span>}
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
