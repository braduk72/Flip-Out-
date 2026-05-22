import styles from './BottomNav.module.css'

export default function BottomNav({ active, onShop, onHome, onSettings, onRanks }) {
  return (
    <nav className={styles.bottomNav}>
      <button className={`${styles.navBtn} ${active === 'shop' ? styles.navActive : ''}`} aria-label="Shop" onClick={onShop}>
        <img src="/images/shop.png" alt="Shop" className={styles.navImg} />
      </button>
      <button className={`${styles.navBtn} ${active === 'home' ? styles.navActive : ''}`} aria-label="Home" onClick={onHome}>
        <img src="/images/home.png" alt="Home" className={styles.navImg} />
      </button>
      <button className={`${styles.navBtn} ${active === 'ranks' ? styles.navActive : ''}`} aria-label="Leaderboard" onClick={onRanks}>
        <img src="/images/ranks.png" alt="Ranks" className={styles.navImg} />
      </button>
      <button className={`${styles.navBtn} ${active === 'settings' ? styles.navActive : ''}`} aria-label="Settings" onClick={onSettings}>
        <img src="/images/cog.png" alt="Settings" className={styles.navImg} />
      </button>
    </nav>
  )
}
