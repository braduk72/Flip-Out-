import { useState, useEffect } from 'react'
import styles from './Interstitial.module.css'

export default function Interstitial({ onClose }) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch (_) {}
  }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <div className={styles.adLabel}>Advertisement</div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '300px', height: '250px' }}
          data-ad-client="ca-pub-REPLACE_WITH_YOUR_PUB_ID"
          data-ad-slot="REPLACE_WITH_YOUR_INTERSTITIAL_SLOT_ID"
        />
        {countdown === 0 ? (
          <button className={styles.skipBtn} onClick={onClose}>✕  Skip Ad</button>
        ) : (
          <div className={styles.timer}>Skip in {countdown}s</div>
        )}
      </div>
    </div>
  )
}
