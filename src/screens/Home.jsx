import { useState, useEffect, useRef } from 'react'
import styles from './Home.module.css'
import BottomNav from '../components/BottomNav'
import SpecialOffer, { shouldShowOffer, markOfferSeen } from '../components/SpecialOffer'
import DailyBonus, { checkDailyBonus } from '../components/DailyBonus'
import { playHoverTick } from '../hooks/useSfx'

export default function Home({ onPlay, onKnockout, onOnline, onLocalPlay, onShop, onAvatar, onSettings, onSeason, onReveal, onRanks, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx, gauntletStep, seasonStep = 0, mode = 'vs', onMode, onHomeMusic }) {
  const tick = sfxOn ? playHoverTick : () => {}
  const coins = parseInt(localStorage.getItem('fo_coins') || '0')
  const [showOffer, setShowOffer] = useState(() => new URLSearchParams(window.location.search).has('testoffer'))
  const [showBugModal, setShowBugModal] = useState(false)
  const [dailyBonus, setDailyBonus] = useState(null)
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
    const bonus = checkDailyBonus()
    if (bonus) setDailyBonus(bonus)
  }, [])

  useEffect(() => {
    if (shouldShowOffer()) {
      const t = setTimeout(() => { markOfferSeen(); setShowOffer(true) }, 1200)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div className={styles.page}>


      {/* Main grid: left icons | mascot | right icons */}
      <div className={styles.mainGrid}>

        <div className={styles.sideCol}>
          <button className={`${styles.iconBtn} ${styles.iconBtnNoShadow}`} onClick={onAvatar} onMouseEnter={tick} aria-label="Profile">
            <img src="/images/profile_badge_transparent.webp" alt="" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.iconBtn} onClick={onSeason} onMouseEnter={tick} aria-label="Season">
            <img src="/images/season.webp" alt="Season" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.iconBtn} onClick={onKnockout} onMouseEnter={tick} aria-label="Gauntlet">
            <img src="/images/gauntlet.webp" alt="Gauntlet" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.passPlayBtn} onClick={onReveal} onMouseEnter={tick} aria-label="Reveal">
            <img src="/images/peep_oh_v2.webp" alt="Peep-Oh!" draggable="false" className={styles.passPlayImg} />
          </button>
        </div>

        <div className={styles.mascotCol}>
          <img src="/images/mascot3b.webp" alt="" draggable="false" className={styles.mascot} />
        </div>

        <div className={styles.sideCol}>
          <button className={styles.iconBtn} onClick={() => { onMode('vs'); onPlay(false) }} onMouseEnter={tick} aria-label="VS">
            <img src="/images/new_vs.webp" alt="VS" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.iconBtn} onClick={() => { onMode('solo'); onPlay(false) }} onMouseEnter={tick} aria-label="Time Challenge">
            <img src="/images/timechallenge.webp" alt="Time Challenge" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.iconBtn} onClick={onOnline} onMouseEnter={tick} aria-label="Online">
            <img src="/images/online.webp" alt="Online" draggable="false" className={styles.iconBtnImg} />
          </button>
          <button className={styles.passPlayBtn} onClick={onLocalPlay} onMouseEnter={tick} aria-label="Pass and Play">
            <img src="/images/pass_and_play_v2.webp" alt="Pass & Play" draggable="false" className={styles.passPlayImg} />
          </button>
        </div>

      </div>

      {/* Play button + coin display */}
      <div className={styles.playRow}>
        <div className={styles.coinBarWrap}>
          <img src="/images/coin.webp" alt="" className={styles.coinIcon} draggable="false" />
          <span className={styles.coinBarAmount}>{coins.toLocaleString()}</span>
        </div>
        <button className={styles.playBtn} onClick={() => { onMode('vs'); onPlay() }} onMouseEnter={tick} aria-label="Play">
          <img src="/images/play_btn_home.webp" alt="Play" draggable="false" className={styles.playBtnImg} />
        </button>
      </div>

      <BottomNav active="home" onShop={onShop} onHome={onHomeMusic} onSettings={onSettings} onRanks={onRanks} />
      {dailyBonus && <DailyBonus day={dailyBonus.day} coins={dailyBonus.coins} onClose={() => setDailyBonus(null)} />}
      {showOffer && <SpecialOffer onClose={() => setShowOffer(false)} />}
      {showBugModal && <BugReportModal onClose={() => setShowBugModal(false)} />}

    </div>
  )
}

// ── Bug report modal ──────────────────────────────────────────────────────────
function BugReportModal({ onClose }) {
  const [desc,    setDesc]    = useState('')
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState('idle') // idle | sending | done | error

  async function submit() {
    if (!desc.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/fo-bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc.trim(),
          userEmail:   email.trim() || null,
          userAgent:   navigator.userAgent,
          version:     APP_VERSION,
        }),
      })
      const data = await res.json()
      setStatus(data.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={styles.bugOverlay} onClick={onClose}>
      <div className={styles.bugModal} onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose} aria-label="Close">✕</button>

        {status === 'done' ? (
          <>
            <div className={styles.bugThanks}>✓</div>
            <p className={styles.bugThanksText}>Thanks! We'll look into it.</p>
            <button className={styles.bugSubmitBtn} onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h2 className={styles.bugTitle}>🐛 Submit a Bug</h2>
            <p className={styles.bugSubtitle}>What went wrong?</p>
            <textarea
              className={styles.bugTextarea}
              placeholder="Describe what happened…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={5}
              maxLength={1000}
              autoFocus
            />
            <input
              className={styles.bugEmailInput}
              type="email"
              placeholder="Your email (optional, for follow-up)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={100}
            />
            {status === 'error' && (
              <p className={styles.bugError}>Something went wrong — please try again.</p>
            )}
            <div className={styles.bugBtns}>
              <button
                className={styles.bugSubmitBtn}
                onClick={submit}
                disabled={!desc.trim() || status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Send Report'}
              </button>
              <button className={styles.bugCancelBtn} onClick={onClose}>Cancel</button>
            </div>
            <div className={styles.bugReward}>
              We pay <img src="/images/coin.webp" alt="coins" className={styles.bugRewardCoin} /> 50 for any new bugs found!
            </div>
          </>
        )}
      </div>
    </div>
  )
}
