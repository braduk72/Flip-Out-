import { useState } from 'react'
import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'
import { restorePurchases } from '../utils/foShop.js'

const DIFFICULTIES = [
  { id: 'Easy',   label: '🟢  Easy',   bg: '#1a6e2e', color: '#afffb8' },
  { id: 'Medium', label: '🟡  Medium', bg: '#7a5200', color: '#ffe080' },
  { id: 'Hard',   label: '🔴  Hard',   bg: '#7a1500', color: '#ffaaaa' },
]

export default function Settings({ onBack, onSeason, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty, onDifficulty, onDevWin, seasonStep, navProps }) {
  const [restoreEmail,  setRestoreEmail]  = useState('')
  const [restoreState,  setRestoreState]  = useState('idle') // 'idle' | 'loading' | 'done' | 'notfound' | 'error'
  const [restoreResult, setRestoreResult] = useState(null)

  async function handleRestore() {
    if (!restoreEmail.trim() || restoreState === 'loading') return
    setRestoreState('loading')
    try {
      const result = await restorePurchases(restoreEmail.trim())
      if (result.found) { setRestoreResult(result); setRestoreState('done') }
      else setRestoreState('notfound')
    } catch { setRestoreState('error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.list}>

        {/* Difficulty */}
        {/* Season map shortcut */}
        <button className={styles.seasonLink} onClick={onSeason}>
          <span>🗺️  Season 1 · The Reckoning</span>
          <span className={styles.seasonArrow}>›</span>
        </button>

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

      </div>

      {/* ── Restore Purchases ── */}
      <div className={styles.restoreSection}>
        <div className={styles.restoreLabel}>RESTORE PURCHASES</div>
        {restoreState === 'done' ? (
          <div className={styles.restoreDone}>
            ✓ Purchases restored!
            {restoreResult?.coins > 0 && <span> +{restoreResult.coins} coins</span>}
            {restoreResult?.decks?.length > 0 && <span> · {restoreResult.decks.length} deck{restoreResult.decks.length > 1 ? 's' : ''} unlocked</span>}
          </div>
        ) : (
          <>
            <input
              className={styles.restoreInput}
              type="email"
              placeholder="Enter email address to enable cross-platform play"
              value={restoreEmail}
              onChange={e => { setRestoreEmail(e.target.value); setRestoreState('idle') }}
              onKeyDown={e => e.key === 'Enter' && handleRestore()}
            />
            <button className={styles.restoreBtn} onClick={handleRestore} disabled={restoreState === 'loading'}>
              {restoreState === 'loading' ? 'Restoring…' : 'Restore'}
            </button>
            {restoreState === 'notfound' && <div className={styles.restoreMsg}>No purchases found for that email.</div>}
            {restoreState === 'error'    && <div className={styles.restoreMsg}>Something went wrong — try again.</div>}
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

      <div className={styles.versionTag}>v0.25</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
