import styles from './RemoveAdsModal.module.css'

const PERKS = [
  { icon: '🚫', text: 'Remove forced ads' },
  { icon: '🖼️', text: 'Remove banner ads' },
  { icon: '📺', text: 'Rewarded ads remain' },
]

export default function RemoveAdsModal({ onClose, onBuy }) {
  const already = !!localStorage.getItem('fo_no_ads')

  function handleBuy(tier) {
    localStorage.setItem('fo_no_ads', '1')
    if (tier === 'bundle') {
      const cur = parseInt(localStorage.getItem('fo_coins') || '0')
      localStorage.setItem('fo_coins', String(cur + 555))
    }
    onBuy?.()
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.bigLogo}>A<span className={styles.slash}>/</span>S</div>
        <h2 className={styles.title}>REMOVE ADS</h2>

        <div className={styles.perks}>
          {PERKS.map(p => (
            <div key={p.text} className={styles.perkRow}>
              <span className={styles.perkIcon}>{p.icon}</span>
              <span className={styles.perkText}>{p.text}</span>
            </div>
          ))}
        </div>

        {already ? (
          <div className={styles.alreadyMsg}>✓ You already have Ad-Free!</div>
        ) : (
          <div className={styles.tiers}>
            <button className={styles.tierBtn} onClick={() => handleBuy('basic')}>
              <div className={styles.tierIcon}>🚫</div>
              <div className={styles.tierLabel}>NO ADS</div>
              <div className={styles.tierPrice}>£7.99</div>
            </button>
            <button className={`${styles.tierBtn} ${styles.tierHighlight}`} onClick={() => handleBuy('bundle')}>
              <div className={styles.tierBadge}>BEST VALUE</div>
              <div className={styles.tierIconRow}>
                <span>🚫</span><span>🪙×555</span>
              </div>
              <div className={styles.tierBonusRow}>
                <span>❄️×3</span><span>👁️×3</span><span>🔀×3</span>
              </div>
              <div className={styles.tierPrice}>£11.99</div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
