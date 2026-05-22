import { useState, useEffect } from 'react'
import styles from './Home.module.css'
import BottomNav from '../components/BottomNav'
import AdBanner from '../components/AdBanner'
import SpecialOffer, { shouldShowOffer, markOfferSeen } from '../components/SpecialOffer'

export default function Home({ onPlay, onKnockout, onOnline, onShop, onAvatar, onSettings, onSeason, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx, gauntletStep, seasonStep = 0, mode = 'vs', onMode }) {
  const hasGoldCard = !!localStorage.getItem('fo_gold_card')
  const coins = parseInt(localStorage.getItem('fo_coins') || '0')
  const [showOffer, setShowOffer] = useState(false)
  const [fbRewarded, setFbRewarded] = useState(!!localStorage.getItem('fo_fb_reward'))

  function handleFbReward() {
    if (!fbRewarded) {
      const cur = parseInt(localStorage.getItem('fo_coins') || '0')
      localStorage.setItem('fo_coins', String(cur + 10))
      localStorage.setItem('fo_fb_reward', '1')
      setFbRewarded(true)
    }
    window.open('https://www.facebook.com/gizmogamesuk', '_blank')
  }

  useEffect(() => {
    if (shouldShowOffer()) {
      const t = setTimeout(() => { markOfferSeen(); setShowOffer(true) }, 1200)
      return () => clearTimeout(t)
    }
  }, [])
  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.profileCol}>
          <button className={styles.playerAvatar} onClick={onAvatar} aria-label="Change player">
            <img src="/images/profile.png" alt="" draggable="false" />
            <span className={styles.playerAvatarLabel}>Profile</span>
          </button>
          <button
            className={`${styles.fbBtn} ${fbRewarded ? styles.fbBtnUsed : ''}`}
            onClick={handleFbReward}
            aria-label="Follow on Facebook for 10 coins"
          >
            <img src="/images/face10.png" alt="Follow on Facebook" draggable="false" />
          </button>
        </div>
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
            onClick={() => onMode(mode === 'solo' ? 'vs' : 'solo')}
            aria-label={mode === 'solo' ? '1 player' : '2 players'}
          >
            <img src={mode === 'solo' ? '/images/1up.png' : '/images/2up.png'} alt="" draggable="false" />
          </button>
          <button className={styles.playBtn} onClick={onPlay} aria-label="Play">
            <img src="/images/play.png" alt="PLAY" draggable="false" />
          </button>
        </div>

        {/* Play Online */}
        <button className={styles.onlineBtn} onClick={onOnline} aria-label="Play Online">
          <img src="/images/globe2.png" alt="" className={styles.onlineGlobe} draggable="false" />
          <div className={styles.knockoutText}>
            <span className={styles.knockoutTitle}>PLAY ONLINE</span>
            <span className={styles.knockoutProgress}>Quick Match · Create · Join Room</span>
          </div>
          <span className={styles.knockoutArrow}>›</span>
        </button>

        {/* Season map entry */}
        <button className={styles.seasonBtn} onClick={onSeason} aria-label="Season map">
          <span className={styles.knockoutIcon}>🗺️</span>
          <div className={styles.knockoutText}>
            <span className={styles.knockoutTitle}>
              SEASON 1 · THE RECKONING
            </span>
            {seasonStep >= 5
              ? <span className={styles.knockoutProgress}>✦ Season complete — gold card earned!</span>
              : seasonStep > 0
              ? <span className={styles.knockoutProgress}>{seasonStep}/5 defeated · keep going!</span>
              : <span className={styles.knockoutProgress}>Limited time · exclusive rewards</span>
            }
          </div>
          <span className={styles.knockoutArrow}>›</span>
        </button>

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

      <AdBanner />
      <BottomNav active="home" onShop={onShop} onHome={() => {}} onSettings={onSettings} />
      {showOffer && <SpecialOffer onClose={() => setShowOffer(false)} />}

    </div>
  )
}
