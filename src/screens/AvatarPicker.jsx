import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'
import { AVATAR_CATALOG, ONBOARDING_AVATARS } from '../data/avatarCatalog.js'

const LOCKED = 6 // Remaining presentation slots; unlocked-catalogue additions replace these.

function getUnlockedAvatars() {
  return JSON.parse(localStorage.getItem('fo_unlocked_avatars') || '[]')
}

export default function AvatarPicker({ portrait, onPortrait, onBack, navProps }) {
  const unlockedSpecial = getUnlockedAvatars()
  const specialAvatars = AVATAR_CATALOG.filter(avatar => avatar.availability === 'promo' && unlockedSpecial.includes(avatar.legacyPortrait))
  const pick = avatar => { onPortrait(avatar.legacyPortrait); onBack() }

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="avatar-picker">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back"><span aria-hidden="true">‹</span></button>
        <h1 className={styles.title}>Choose Your Player</h1>
      </div>
      <div className={styles.grid}>
        {ONBOARDING_AVATARS.map(avatar => <button key={avatar.id} className={`${styles.avatarBtn} ${portrait === avatar.legacyPortrait ? styles.selected : ''}`} onClick={() => pick(avatar)} aria-label={`Select ${avatar.label}`}>
          <img src={avatar.asset} alt={avatar.label} draggable="false" />
          {portrait === avatar.legacyPortrait && <span className={styles.checkmark}>✓</span>}
        </button>)}
        {specialAvatars.map(avatar => <button key={avatar.id} className={`${styles.avatarBtn} ${portrait === avatar.legacyPortrait ? styles.selected : ''} ${styles.specialAvatar}`} onClick={() => pick(avatar)} aria-label={`Select ${avatar.label}`}>
          <img src={avatar.asset} alt={avatar.label} draggable="false" />
          <span className={styles.specialBadge}>BETA TESTER</span>
          {portrait === avatar.legacyPortrait && <span className={styles.checkmark}>✓</span>}
        </button>)}
        {Array.from({ length: LOCKED }).map((_, index) => <div key={`locked-${index}`} className={styles.lockedSlot} aria-label="Coming soon"><span className={styles.lockedQ}>?</span></div>)}
      </div>
      <BottomNav active="home" {...navProps} />
    </div>
  )
}
