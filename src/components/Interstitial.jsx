import styles from './Interstitial.module.css'

// No provider is configured. This deliberately cannot emit a successful reward.
export default function Interstitial({ onCancel }) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="advert-unavailable-title">
      <div className={styles.box}>
        <h2 id="advert-unavailable-title">Rewarded advert unavailable</h2>
        <p>No verified advert provider is configured, so no reward has been granted.</p>
        <button className={styles.skipBtn} type="button" onClick={onCancel}>Close</button>
      </div>
    </div>
  )
}
