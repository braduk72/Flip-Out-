import { useState } from 'react'
import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'
import { restorePurchases } from '../utils/foShop.js'

const DIFFICULTIES = [
  { id: 'Easy',   label: '🟢  Easy',   bg: '#1a6e2e', color: '#afffb8' },
  { id: 'Medium', label: '🟡  Medium', bg: '#7a5200', color: '#ffe080' },
  { id: 'Hard',   label: '🔴  Hard',   bg: '#7a1500', color: '#ffaaaa' },
]

export default function Settings({ onBack, onSeason, onAbout, onPrivacy, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty, onDifficulty, onDevWin, seasonStep, navProps }) {
  const [restoreState,  setRestoreState]  = useState('idle') // 'idle' | 'loading' | 'done' | 'notfound' | 'error'
  const [restoreResult, setRestoreResult] = useState(null)

  async function handleRestore() {
    if (restoreState === 'loading') return
    setRestoreState('loading')
    try {
      const result = await restorePurchases()
      if (result.found) { setRestoreResult(result); setRestoreState('done') }
      else setRestoreState('notfound')
    } catch { setRestoreState('error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <img src="/images/back_button.webp" alt="Back" draggable="false" className={styles.backBtnImg} />
        </button>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.list}>

        {/* Difficulty */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Difficulty</span>
          <select
            className={styles.diffSelect}
            value={difficulty}
            onChange={e => onDifficulty(e.target.value)}
            aria-label="Select difficulty"
            style={{ background: DIFFICULTIES.find(d => d.id === difficulty)?.bg, color: DIFFICULTIES.find(d => d.id === difficulty)?.color }}
          >
            {DIFFICULTIES.map(d => (
              <option key={d.id} value={d.id} style={{ background: d.bg, color: d.color }}>{d.label}</option>
            ))}
          </select>
        </div>

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

        {/* Known Issues */}
        <div className={styles.issuesSection}>
          <div className={styles.issuesTitle}>Known Issues</div>
          <div className={styles.issuesText}>- Adverts not yet implemented</div>
        </div>

      </div>

      {/* ── Restore Purchases ── */}
      <div className={styles.restoreCorner}>
        {restoreState === 'done' ? (
          <div className={styles.restoreDone}>✓ Restored!</div>
        ) : (
          <>
            <button className={styles.restoreImgBtn} onClick={handleRestore} disabled={restoreState === 'loading'} aria-label="Restore purchases">
              <img src="/images/restore.webp" alt="Restore" draggable="false" className={`${styles.restoreImg} ${restoreState === 'loading' ? styles.restoreSpinning : ''}`} />
            </button>
            {restoreState === 'notfound' && <div className={styles.restoreMsg}>Nothing found</div>}
            {restoreState === 'error'    && <div className={styles.restoreMsg}>Try again</div>}
          </>
        )}
      </div>

      {/* ── Dev tools — Preview only ── */}
      {(import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true') && (
        <div className={styles.devSection}>
          <div className={styles.devLabel}>DEV TOOLS</div>
          <button className={styles.devBtn} onClick={onDevWin}>
            ⚡ WIN — advance season step
            <span className={styles.devStepBadge}>Step {(seasonStep ?? 0) + 1} / 30</span>
          </button>
        </div>
      )}

      <div className={styles.footerLinks}>
        <button className={styles.footerLink} onClick={onAbout}>About Us</button>
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPrivacy}>Privacy Policy</button>
      </div>

      <div className={styles.versionTag}>v0.1.38</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
