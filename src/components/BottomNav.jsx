import styles from './BottomNav.module.css'

export default function BottomNav({ active, onShop, onHome, onSettings, onRanks }) {
  return (
    <nav className={styles.bottomNav}>
      <button className={styles.navBtn} aria-label="Shop" onClick={onShop}>
        <img
          src={active === 'shop' ? '/images/menu/nav_shop_active.webp' : '/images/menu/nav_shop_inactive.webp'}
          alt="Shop"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Home" onClick={onHome}>
        <img
          src={active === 'home' ? '/images/menu/nav_home_active.webp' : '/images/menu/nav_home_inactive.webp'}
          alt="Home"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Leaderboard" onClick={onRanks}>
        <img
          src={active === 'ranks' ? '/images/menu/nav_ranks_active.webp' : '/images/menu/nav_ranks_inactive.webp'}
          alt="Ranks"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
      <button className={styles.navBtn} aria-label="Settings" onClick={onSettings}>
        <img
          src={active === 'settings' ? '/images/menu/nav_settings_active.webp' : '/images/menu/nav_settings_inactive.webp'}
          alt="Settings"
          draggable="false"
          className={styles.navIcon}
        />
      </button>
    </nav>
  )
}
