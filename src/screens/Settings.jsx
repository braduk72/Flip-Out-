import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'

const DIFFICULTIES = [
  { id: 'Easy',   label: '🟢  Easy',   bg: '#1a6e2e', color: '#afffb8' },
  { id: 'Medium', label: '🟡  Medium', bg: '#7a5200', color: '#ffe080' },
  { id: 'Hard',   label: '🔴  Hard',   bg: '#7a1500', color: '#ffaaaa' },
]

export default function Settings({ onBack, onSeason, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty, onDifficulty, onDevWin, seasonStep, navProps }) {
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

      {/* ── Dev tools ── */}
      <div className={styles.devSection}>
        <div className={styles.devLabel}>DEV TOOLS</div>
        <button className={styles.devBtn} onClick={onDevWin}>
          ⚡ WIN — advance season step
          <span className={styles.devStepBadge}>Step {(seasonStep ?? 0) + 1} / 30</span>
        </button>
      </div>

      <div className={styles.versionTag}>v0.25</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
