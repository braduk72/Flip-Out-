import styles from './Home.module.css'

const CONTESTANT_COUNT = 12

export default function Home({ onPlay, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx }) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoFlip}>Flip</span>
          <span className={styles.logoOut}>Out!</span>
        </div>
        <p className={styles.tagline}>The Matching Pairs Card Game</p>
        <p className={styles.sub}>But not as you know it.</p>

        <button className={styles.playBtn} onClick={onPlay}>
          ▶ PLAY
        </button>

        <div className={styles.badges}>
          <span className={styles.badge}>Ages 4+</span>
          <span className={styles.badge}>1–2 Players</span>
          <span className={styles.badge}>15 Min</span>
        </div>

        {/* Portrait picker */}
        <div className={styles.pickerWrap}>
          <p className={styles.pickerLabel}>CHOOSE YOUR PLAYER</p>
          <div className={styles.pickerGrid}>
            {Array.from({ length: CONTESTANT_COUNT }, (_, i) => i + 1).map(i => (
              <button
                key={i}
                className={`${styles.pickerBtn} ${portrait === i ? styles.pickerSelected : ''}`}
                onClick={() => onPortrait(i)}
                aria-label={`Select portrait ${i}`}
              >
                <img src={`/images/contestants/${i}.png`} alt="" draggable="false" />
              </button>
            ))}
          </div>

          {/* Sound toggles */}
          <div className={styles.audioRow}>
            <button
              className={`${styles.audioToggle} ${!musicOn ? styles.audioOff : ''}`}
              onClick={onToggleMusic}
              aria-label={musicOn ? 'Mute music' : 'Unmute music'}
            >
              🎵 <span>MUSIC</span>
            </button>
            <button
              className={`${styles.audioToggle} ${!sfxOn ? styles.audioOff : ''}`}
              onClick={onToggleSfx}
              aria-label={sfxOn ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              🔊 <span>SOUND</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bolt1}>⚡</div>
      <div className={styles.bolt2}>⚡</div>
    </div>
  )
}
