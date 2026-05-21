import styles from './Home.module.css'
import BottomNav from '../components/BottomNav'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function Home({ onPlay, onKnockout, onShop, onAvatar, onSettings, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty, onDifficulty, gauntletStep }) {
  const hasGoldCard = !!localStorage.getItem('fo_gold_card')
  const coins = parseInt(localStorage.getItem('fo_coins') || '0')
  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.playerAvatar} onClick={onAvatar} aria-label="Change player">
          <img src={`/images/a${portrait}.png`} alt="" draggable="false" />
        </button>
        <div className={styles.coinDisplay}>
          <img src="/images/coin.png" alt="" className={styles.coinIcon} draggable="false" />
          <div className={styles.coinDigits}>
            {String(coins).split('').map((d, i) => (
              <img key={i} src={`/images/${d}.png`} alt={d} className={styles.digitImg} draggable="false" />
            ))}
          </div>
        </div>
      </div>

      {/* Mascot */}
      <div className={styles.mascotWrap}>
        <img src="/images/mascot3b.png" alt="" className={styles.mascot} draggable="false" />
      </div>

      {/* Bottom panel */}
      <div className={styles.bottomPanel}>

        <div className={styles.actionRow}>
          <button
            className={styles.diffBtn}
            onClick={() => onDifficulty(DIFFICULTIES[(DIFFICULTIES.indexOf(difficulty) + 1) % DIFFICULTIES.length])}
            aria-label={`Difficulty: ${difficulty}`}
          >
            <img src={`/images/dif${DIFFICULTIES.indexOf(difficulty) + 1}.png`} alt={difficulty} draggable="false" />
          </button>
          <button className={styles.playBtn} onClick={onPlay} aria-label="Play">
            <img src="/images/play.png" alt="PLAY" draggable="false" />
          </button>
        </div>

        {/* Knockout Gauntlet entry */}
        <button className={styles.knockoutBtn} onClick={onKnockout} aria-label="Knockout Gauntlet">
          <span className={styles.knockoutIcon}>🏆</span>
          <div className={styles.knockoutText}>
            <span className={styles.knockoutTitle}>
              KNOCKOUT GAUNTLET{hasGoldCard ? ' ✦' : ''}
            </span>
            {gauntletStep > 0 && gauntletStep < 10
              ? <span className={styles.knockoutProgress}>{gauntletStep}/10 defeated · keep going!</span>
              : gauntletStep >= 10
              ? <span className={styles.knockoutProgress}>✓ Champion — play again?</span>
              : <span className={styles.knockoutProgress}>Face all 9 opponents — then Professor Claw</span>
            }
          </div>
          <span className={styles.knockoutArrow}>›</span>
        </button>

      </div>

      <BottomNav active="home" onShop={onShop} onHome={() => {}} onSettings={onSettings} />

    </div>
  )
}
