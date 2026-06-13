import { useState, useEffect, useRef } from 'react'
import styles from './Home.module.css'
import BottomNav from '../components/BottomNav'
import SpecialOffer, { shouldShowOffer, markOfferSeen } from '../components/SpecialOffer'

export default function Home({ onPlay, onKnockout, onOnline, onShop, onAvatar, onSettings, onSeason, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx, gauntletStep, seasonStep = 0, mode = 'vs', onMode }) {
  const coins = parseInt(localStorage.getItem('fo_coins') || '0')
  const [showOffer, setShowOffer] = useState(() => new URLSearchParams(window.location.search).has('testoffer'))
  const [avatarAnim, setAvatarAnim] = useState('idle')
  const avatarTimer = useRef(null)

  useEffect(() => {
    function scheduleNext() {
      const delay = 6000 + Math.random() * 8000
      avatarTimer.current = setTimeout(() => {
        const anim = Math.random() < 0.55 ? 'spin' : 'flip'
        setAvatarAnim(anim)
        setTimeout(() => { setAvatarAnim('idle'); scheduleNext() }, 900)
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(avatarTimer.current)
  }, [])

  useEffect(() => {
    if (shouldShowOffer()) {
      const t = setTimeout(() => { markOfferSeen(); setShowOffer(true) }, 1200)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div className={styles.page}>

      {/* Top bar — coins left, settings right */}
      <div className={styles.topBar}>
        <div className={styles.coinBarWrap}>
          <img src="/images/coin_bar.webp" alt="" className={styles.coinBarImg} draggable="false" />
          <span className={styles.coinBarAmount}>{coins.toLocaleString()}</span>
        </div>
        <button className={styles.topSettingsBtn} onClick={onSettings} aria-label="Settings">
          <img src="/images/settings.webp" alt="Settings" draggable="false" className={styles.topSettingsImg} />
        </button>
      </div>

      {/* Main grid: left icons | mascot | right icons */}
      <div className={styles.mainGrid}>

        <div className={styles.sideCol}>
          <button className={styles.iconBtn} onClick={onAvatar} aria-label="Profile">
            <img src="/images/btn_profile.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>PROFILE</span>
          </button>
          <button className={styles.iconBtn} onClick={onSeason} aria-label="Season">
            <img src="/images/btn_season.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>SEASON</span>
          </button>
          <button className={styles.iconBtn} onClick={onKnockout} aria-label="Gauntlet">
            <img src="/images/btn_gauntlet.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>GAUNTLET</span>
          </button>
        </div>

        <div className={styles.mascotCol}>
          <img src="/images/mascot2.webp" alt="" draggable="false" className={styles.mascot} />
        </div>

        <div className={styles.sideCol}>
          <button className={styles.iconBtn} onClick={() => { onMode('vs'); onPlay() }} aria-label="VS">
            <img src="/images/btn_vs.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>VS</span>
          </button>
          <button className={styles.iconBtn} onClick={() => { onMode('solo'); onPlay() }} aria-label="Time Challenge">
            <img src="/images/btn_timechallenge.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>TIME<br/>CHALLENGE</span>
          </button>
          <button className={styles.iconBtn} onClick={onOnline} aria-label="Online">
            <img src="/images/btn_online.webp" alt="" draggable="false" className={styles.iconBtnImg} />
            <span className={styles.iconBtnLabel}>ONLINE</span>
          </button>
        </div>

      </div>

      {/* Play button */}
      <div className={styles.playRow}>
        <button className={styles.playBtn} onClick={() => { onMode('vs'); onPlay() }} aria-label="Play">
          <img src="/images/play_btn_home.webp" alt="Play" draggable="false" className={styles.playBtnImg} />
        </button>
      </div>

      <BottomNav active="home" onShop={onShop} onHome={() => {}} onSettings={onSettings} />
      {showOffer && <SpecialOffer onClose={() => setShowOffer(false)} />}

    </div>
  )
}
