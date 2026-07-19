import styles from './AvatarPicker.module.css'
import BottomNav from '../components/BottomNav'
import { ONBOARDING_AVATARS, getAvatarByLegacyPortrait } from '../data/avatarCatalog.js'

// The profile picker deliberately uses the same curated catalogue as onboarding.
export default function AvatarPicker({ portrait, onPortrait, onBack, navProps }) {
  const selectedAvatar = getAvatarByLegacyPortrait(portrait)
  const pick = avatar => { onPortrait(avatar.legacyPortrait); onBack() }

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="avatar-picker">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back"><span aria-hidden="true">‹</span></button>
        <h1 className={styles.title}>Choose Your Player</h1>
      </div>
      <div className={styles.grid} role="group" aria-label="Available player avatars">
        {ONBOARDING_AVATARS.map(avatar => <button key={avatar.id} className={`${styles.avatarBtn} ${selectedAvatar?.id === avatar.id ? styles.selected : ''}`} onClick={() => pick(avatar)} aria-label={`Select ${avatar.label}`}>
          <img src={avatar.asset} alt={avatar.label} draggable="false" />
          {selectedAvatar?.id === avatar.id && <span className={styles.checkmark}>✓</span>}
        </button>)}
      </div>
      <BottomNav active="home" {...navProps} />
    </div>
  )
}
