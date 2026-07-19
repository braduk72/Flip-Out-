import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'
import { APP_VERSION } from '../version.js'
import { playHoverTick } from '../hooks/useSfx'

const DIFFICULTIES = [
  { id: 'Easy', label: 'Easy' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Hard', label: 'Hard' },
]

export default function Settings({ onBack, onAbout, onPrivacy, onPatchNotes, musicOn, sfxOn, onToggleMusic, onToggleSfx, musicVol = 0.45, sfxVol = 0.7, onMusicVol, onSfxVol, difficulty, onDifficulty, navProps }) {
  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="settings">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className={styles.title}>More</h1>
      </div>

      <div className={styles.list}>

        <div className={styles.destinationGrid} aria-label="More destinations">
          <button className={styles.destinationCard} type="button" onClick={navProps?.onRanks}>
            <span className={styles.destinationEyebrow}>Compete</span>
            <strong>Leaderboard</strong>
            <span>See ranks and your best scores</span>
          </button>
          <button className={styles.destinationCard} type="button" onClick={navProps?.onShop}>
            <span className={styles.destinationEyebrow}>Discover</span>
            <strong>Coin Store</strong>
            <span>Offers, bundles and the Exchange</span>
          </button>
        </div>

        <h2 className={styles.sectionTitle}>Settings</h2>

        {/* Difficulty */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Difficulty</span>
          <select
            className={styles.diffSelect}
            value={difficulty}
            onChange={e => onDifficulty(e.target.value)}
            aria-label="Select difficulty"
          >
            {DIFFICULTIES.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.audioBlock}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Music</span>
            <button
              className={`${styles.toggle} ${musicOn ? styles.toggleOn : ''}`}
              onClick={onToggleMusic}
              aria-label={musicOn ? 'Mute music' : 'Unmute music'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={musicVol}
            onChange={e => onMusicVol?.(e.target.value)}
            className={styles.volSlider}
            disabled={!musicOn}
            aria-label="Music volume"
          />
        </div>

        <div className={styles.audioBlock}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Sound Effects</span>
            <button
              className={`${styles.toggle} ${sfxOn ? styles.toggleOn : ''}`}
              onClick={onToggleSfx}
              aria-label={sfxOn ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={sfxVol}
            onChange={e => onSfxVol?.(e.target.value)}
            onPointerUp={() => sfxOn && playHoverTick()}
            className={styles.volSlider}
            disabled={!sfxOn}
            aria-label="SFX volume"
          />
        </div>

      </div>

      <div className={styles.footerLinks}>
        <button className={styles.footerLink} onClick={onAbout}>About Us</button>
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPrivacy}>Privacy Policy</button>
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPatchNotes}>What's New</button>
      </div>

      <div className={styles.versionTag}>v{APP_VERSION}</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
