import { useState, useEffect } from 'react'
import styles from './Settings.module.css'
import BottomNav from '../components/BottomNav'
import { APP_VERSION } from '../version.js'
import { playHoverTick } from '../hooks/useSfx'

const STAGE_BKGS = [1, 2, 3, 4].map(n => `/images/gameshowStages/${n}.webp`)

const DIFFICULTIES = [
  { id: 'Easy',   label: '🟢  Easy',   bg: '#1a6e2e', color: '#afffb8' },
  { id: 'Medium', label: '🟡  Medium', bg: '#7a5200', color: '#ffe080' },
  { id: 'Hard',   label: '🔴  Hard',   bg: '#7a1500', color: '#ffaaaa' },
]

export default function Settings({ onBack, onSeason, onAbout, onPrivacy, onPatchNotes, musicOn, sfxOn, onToggleMusic, onToggleSfx, musicVol = 0.45, sfxVol = 0.7, onMusicVol, onSfxVol, difficulty, onDifficulty, onDevWin, seasonStep, navProps }) {
  const [bgIdx, setBgIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % STAGE_BKGS.length), 8000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={styles.page}>
      {STAGE_BKGS.map((src, i) => (
        <img key={src} src={src} aria-hidden="true" draggable="false"
          className={`${styles.stageBg} ${i === bgIdx ? styles.stageBgActive : ''}`} />
      ))}
      <div className={styles.stageBgOverlay} />
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
        <span className={styles.footerDivider}>·</span>
        <button className={styles.footerLink} onClick={onPatchNotes}>What's New</button>
      </div>

      <div className={styles.versionTag}>v{APP_VERSION}</div>

      <BottomNav active="settings" {...navProps} />
    </div>
  )
}
