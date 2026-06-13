import styles from './BottomNav.module.css'

export default function BottomNav({ active, onShop, onHome, onSettings, onRanks }) {
  return (
    <nav className={styles.bottomNav}>
      <button className={styles.navBtn} aria-label="Shop" onClick={onShop}>
        <img
          src="/images/b1_shop.webp"
          alt="Shop"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Home" onClick={onHome}>
        <img
          src="/images/b1_home.webp"
          alt="Home"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Leaderboard" onClick={onRanks}>
        <img
          src="/images/b1_ranks.webp"
          alt="Ranks"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Settings" onClick={onSettings}>
        <img
          src="/images/b1_settings.webp"
          alt="Settings"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
    </nav>
  )
}
