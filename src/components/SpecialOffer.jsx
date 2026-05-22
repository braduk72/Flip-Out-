import { useState, useEffect } from 'react'
import styles from './SpecialOffer.module.css'

const OFFER_KEY    = 'fo_offer_seen'
const EXPIRES_KEY  = 'fo_offer_expires'
const OFFER_HOURS  = 24

export function shouldShowOffer() {
  const expires = parseInt(localStorage.getItem(EXPIRES_KEY) || '0')
  const seen    = localStorage.getItem(OFFER_KEY)
  const bought  = localStorage.getItem('fo_offer_bought')
  if (bought) return false
  if (!seen) return true
  if (Date.now() > expires) {
    // Refresh offer
    localStorage.removeItem(OFFER_KEY)
    return true
  }
  return false
}

export function markOfferSeen() {
  const expires = Date.now() + OFFER_HOURS * 60 * 60 * 1000
  localStorage.setItem(OFFER_KEY, '1')
  localStorage.setItem(EXPIRES_KEY, String(expires))
}

function useCountdown(expiresTs) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresTs - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000)
    return () => clearInterval(t)
  }, [])
  const totalSec = Math.floor(remaining / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
}

const ITEMS = ['200 Coins', 'Peek ×1', 'Freeze ×1', 'Shuffle ×1']

export default function SpecialOffer({ onClose, onBuy }) {
  const expiresTs = parseInt(localStorage.getItem(EXPIRES_KEY) || String(Date.now() + OFFER_HOURS * 3600 * 1000))
  const countdown = useCountdown(expiresTs)

  function handleBuy() {
    localStorage.setItem('fo_offer_bought', '1')
    // Award the coins
    const cur = parseInt(localStorage.getItem('fo_coins') || '0')
    localStorage.setItem('fo_coins', String(cur + 200))
    onBuy?.()
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.timerBadge}>⏱ {countdown}</div>

        <div className={styles.banner}>
          <div className={styles.offBadge}>80%<br/>off</div>
          <div className={styles.bannerArt}>🎁</div>
        </div>

        <h2 className={styles.title}>Special Offer!</h2>

        <div className={styles.itemsGrid}>
          {ITEMS.map(item => (
            <div key={item} className={styles.itemChip}>{item}</div>
          ))}
        </div>

        <button className={styles.buyBtn} onClick={handleBuy}>£1.99</button>
      </div>
    </div>
  )
}
