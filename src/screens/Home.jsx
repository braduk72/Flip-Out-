import { useState, useEffect, useRef } from 'react'
import styles from './Home.module.css'
import BottomNav from '../components/BottomNav'
import GameIcon from '../components/GameIcon'
import SpecialOffer, { shouldShowOffer, markOfferSeen } from '../components/SpecialOffer'
import DailyBonus, { checkDailyBonus } from '../components/DailyBonus'
import { playHoverTick } from '../hooks/useSfx'

// ── New stone icon configs (shared by the home layout + the icon test view) ──
const SEASON_ICON = {
  src: '/images/icons/season.webp',
  label: 'Season',
  flames: [
    { x: '15.8%', y: '33.5%', dur: '2.6s, 1.7s', delay: '-1.1s, -0.4s' },
    { x: '85.2%', y: '34.5%', dur: '3.3s, 2.1s', delay: '-0.6s, -1.7s' },
    { x: '13.5%', y: '29.5%', size: '15%', dur: '1.9s, 1.3s', delay: '-0.7s, -1.2s' },
    { x: '87.4%', y: '30%',   size: '15%', dur: '2.3s, 1.5s', delay: '-1.4s, -0.5s' },
  ],
  needle: { x: '34.3%', y: '62.4%', length: '12.6%' },
  secret: { x: '34.3%', y: '62.4%', size: '22%' },
}
const GAUNTLET_ICON = {
  src: '/images/icons/gauntlet.webp',
  label: 'Gauntlet',
  flames: [
    { x: '12%', y: '18%', size: '28%', dur: '2.6s, 1.7s', delay: '-1.1s, -0.4s' },
    { x: '88%', y: '18%', size: '28%', dur: '3.3s, 2.1s', delay: '-0.6s, -1.7s' },
    { x: '10.5%', y: '14.5%', size: '18%', dur: '1.9s, 1.3s', delay: '-0.7s, -1.2s' },
    { x: '89.5%', y: '14.5%', size: '18%', dur: '2.3s, 1.5s', delay: '-1.4s, -0.5s' },
  ],
  glints: [{ x: '39.4%', y: '61.6%', size: '5%', dur: '3.6s', delay: '0s' }],
}
const VS_ICON = {
  src: '/images/icons/vs.webp',
  label: 'VS',
  // River animation (bubbles/ripples/splashes) removed — too hard to sell a
  // baked-in liquid convincingly without a mask. Static plate for now.
}
const TIMECHALLENGE_ICON = {
  src: '/images/icons/timechallenge.webp',
  label: 'Time Challenge',
  // Watch drawn hand-less on purpose — two shiny gold hands, scaled down,
  // pivot nudged up/right, spun fast (4×) for a "time racing" feel.
  hands: [
    { x: '50.5%', y: '45.3%', length: '8.8%',  width: '2.24%', color: 'linear-gradient(90deg, #9a7b1e, #ffe9a0, #9a7b1e)', dur: '1.67s' },
    { x: '50.5%', y: '45.3%', length: '13.6%', width: '1.6%',  color: 'linear-gradient(90deg, #9a7b1e, #ffe9a0, #9a7b1e)', dur: '0.58s' },
  ],
  glints: [{ x: '57%', y: '25%', size: '6%', color: '255, 232, 160', dur: '4s', delay: '0s' }],
}
const ONLINE_ICON = {
  src: '/images/icons/online.webp',
  label: 'Online',
  // Electric arcs flicker between the tower orbs and the globe; orbs glow,
  // globe pulses cyan, network nodes sparkle.
  arcs: [
    { x: '37%', y: '27%', w: '30%', rot: '37deg',  dur: '1.5s', delay: '0s' },   // left orb → globe
    { x: '63%', y: '27%', w: '30%', rot: '-37deg', dur: '1.8s', delay: '0.4s' }, // right orb → globe
    { x: '50%', y: '13%', w: '50%', rot: '3deg',   dur: '1.3s', delay: '0.7s' }, // arc over the top
  ],
  glints: [
    { x: '23%', y: '17%', size: '9%',  color: '150, 215, 255', dur: '1.6s', delay: '0.2s' }, // left orb glow
    { x: '77%', y: '16%', size: '9%',  color: '150, 215, 255', dur: '1.9s', delay: '0.9s' }, // right orb glow
    { x: '50%', y: '37%', size: '30%', color: '90, 200, 255',  dur: '3.2s', delay: '0.3s' }, // globe pulse
    { x: '44%', y: '33%', size: '5%',  color: '190, 235, 255', dur: '2.3s', delay: '1.1s' }, // node
    { x: '57%', y: '41%', size: '5%',  color: '190, 235, 255', dur: '2.8s', delay: '1.9s' }, // node
  ],
}
const PASSANDPLAY_ICON = {
  src: '/images/icons/passandplay.webp',
  label: 'Pass & Play',
  // Wall torch flickers (+ embers); Sprockett's phone screen glints.
  flames: [
    { x: '50%',  y: '23%', size: '15%', dur: '2.6s, 1.7s', delay: '-1.1s, -0.4s' },
    { x: '50.5%', y: '20%', size: '9%', dur: '1.9s, 1.3s', delay: '-0.7s, -1.2s' },
  ],
  glints: [{ x: '87%', y: '44%', size: '6%', color: '200, 230, 255', dur: '2.6s', delay: '0.5s' }],
}

export default function Home({ onPlay, onKnockout, onOnline, onLocalPlay, onShop, onAvatar, onSettings, onSeason, onReveal, onRanks, portrait, onPortrait, musicOn, sfxOn, onToggleMusic, onToggleSfx, gauntletStep, seasonStep = 0, mode = 'vs', onMode, onHomeMusic }) {
  const tick = sfxOn ? playHoverTick : () => {}
  const coins = parseInt(localStorage.getItem('fo_coins') || '0')
  const [showOffer, setShowOffer] = useState(() => new URLSearchParams(window.location.search).has('testoffer'))
  const [showBugModal, setShowBugModal] = useState(false)
  const [dailyBonus, setDailyBonus] = useState(null)
  const videoRef = useRef(null)
  const iconTestParam = new URLSearchParams(window.location.search).get('icontest')
  const showIconTest = iconTestParam !== null

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

  // Background video — pause when the app/tab is hidden, resume on return.
  // Saves battery and CPU while backgrounded. The <video loop> attribute
  // handles seamless looping without re-fetching the file.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    function onVisibility() {
      if (document.hidden) v.pause()
      else v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // The video carries its own baked-in music — it IS the home soundtrack
  // (the app's home music is suppressed in App.jsx). Sound follows the
  // music on/off setting. Browsers block unmuted autoplay until the user
  // interacts, so if the first unmuted play is rejected we keep the video
  // playing silently and unmute on the first tap.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = 0.15            // baked-in track is loud — keep it gentle
    if (!musicOn) { v.muted = true; return }
    v.muted = false
    let cleanup = () => {}
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
      const unmute = () => { v.muted = false; v.play().catch(() => {}); cleanup() }
      document.addEventListener('pointerdown', unmute, { once: true })
      cleanup = () => document.removeEventListener('pointerdown', unmute)
    })
    return () => cleanup()
  }, [musicOn])

  return (
    <div className={styles.page}>

      {/* Animated "living world" background. Falls back to the poster image
          (and the CSS bg on .page) if the video can't play. */}
      <video
        ref={videoRef}
        className={styles.bgVideo}
        src="/video/main_temple.mp4"
        poster="/images/home_still_v2.webp"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Main grid: new stone icons — Season + Gauntlet (left), VS (right).
          Old icons removed; remaining modes return as their art is made. */}
      <div className={styles.mainGrid}>

        <div className={styles.iconCol}>
          <GameIcon {...SEASON_ICON} onClick={onSeason} />
          <GameIcon {...GAUNTLET_ICON} onClick={onKnockout} />
        </div>

        <div className={styles.iconColRight}>
          <GameIcon {...VS_ICON} onClick={() => { onMode('vs'); onPlay(false) }} />
        </div>

      </div>

      {/* Play button + coin counter removed for now */}

      <BottomNav active="home" onShop={onShop} onHome={onHomeMusic} onSettings={onSettings} onRanks={onRanks} />
      {showIconTest && (
        <div className={styles.iconTestOverlay}>
          <button className={styles.iconTestClose} onClick={() => { window.location.search = '' }} aria-label="Close">✕</button>

          {iconTestParam === 'vs' ? (
            <GameIcon {...VS_ICON} onClick={() => {}} />
          ) : iconTestParam === 'gauntlet' ? (
            <GameIcon {...GAUNTLET_ICON} onClick={() => {}} />
          ) : iconTestParam === 'time' ? (
            <GameIcon {...TIMECHALLENGE_ICON} onClick={() => {}} />
          ) : iconTestParam === 'online' ? (
            <GameIcon {...ONLINE_ICON} onClick={() => {}} />
          ) : iconTestParam === 'passandplay' ? (
            <GameIcon {...PASSANDPLAY_ICON} onClick={() => {}} />
          ) : (
            <GameIcon {...SEASON_ICON} onClick={() => {}} />
          )}

          <p className={styles.iconTestHint}>
            {iconTestParam === 'gauntlet' ? 'Gauntlet icon • ✕ to exit' : 'Tap the compass 10× for a surprise • ✕ to exit'}
          </p>
        </div>
      )}
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
