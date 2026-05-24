import { useState } from 'react'
import { DECKS } from '../data/decks'
import styles from './Shop.module.css'
import BottomNav from '../components/BottomNav'
import AdBanner from '../components/AdBanner'
import RemoveAdsModal from '../components/RemoveAdsModal'
import { startCheckout } from '../utils/foShop.js'

function getOwnedPaidCount() {
  const owned = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
  return DECKS.filter(d => !d.free && owned.includes(d.id)).length
}

const COIN_PACKS = [
  { id: 'coins_100',  label: '100 Coins',  price: '£0.99',  coins: 100,  highlight: false, img: '/images/x100.webp'  },
  { id: 'coins_500',  label: '500 Coins',  price: '£3.99',  coins: 500,  highlight: false, img: '/images/x500.webp'  },
  { id: 'coins_1000', label: '1000 Coins', price: '£6.99',  coins: 1000, highlight: true,  img: '/images/x1000.webp' },
]

const JOKER_RELOAD_PRICE = 50

const POWERUPS = [
  { id: 'pu_xray',    label: 'X-Ray',   desc: 'Peek at 2 cards before your turn', price: 50, qty: 3, image: '/images/cards/special/xray.webp'    },
  { id: 'pu_freeze',  label: 'Freeze',  desc: 'Freeze surrounding cards for a turn',   price: 50, qty: 3, image: '/images/cards/special/freeze.webp'  },
  { id: 'pu_shuffle', label: 'Shuffle', desc: 'Reshuffle all unmatched cards',   price: 50, qty: 3, image: '/images/cards/special/shuffle.webp' },
]

const BUNDLES = [
  { id: 'bundle_starter', label: 'Starter Bundle', desc: '500 coins + Shield × 3', price: '£2.99', highlight: false },
  { id: 'bundle_mega',    label: 'Mega Bundle',    desc: '1500 coins + all power-ups × 5', price: '£9.99', highlight: true },
]

export default function Shop({ onBack, navProps }) {
  const ownedPaidCount = getOwnedPaidCount()
  const [jokerHovered, setJokerHovered] = useState(false)
  const [noAds, setNoAds] = useState(() => !!localStorage.getItem('fo_no_ads'))
  const [showRemoveAdsModal, setShowRemoveAdsModal] = useState(false)
  const [buying, setBuying] = useState(null)
  const [coinModal, setCoinModal] = useState(null)

  async function buy(productId) {
    if (buying) return
    setBuying(productId)
    try { await startCheckout(productId) }
    catch { setBuying(null) }
  }
  return (
    <div className={styles.page}>
      <div className={styles.scroll}>

        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <h1 className={styles.title}>Shop</h1>
        </div>

        {/* Coins */}
        <h2 className={styles.sectionTitle}>🪙 Coins</h2>
        <div className={styles.coinGrid}>
          {COIN_PACKS.map(pack => (
            <button key={pack.id} className={styles.coinPackCard} onClick={() => setCoinModal(pack)} disabled={!!buying}>
              <img src={pack.img} alt={pack.label} className={styles.coinPackImg} />
            </button>
          ))}
        </div>

        {/* Joker reload */}
        <h2 className={styles.sectionTitle}>🃏 Joker</h2>
        <button
          className={`${styles.removeAdsCard} ${ownedPaidCount === 0 ? styles.lockedItem : ''}`}
          onMouseEnter={() => ownedPaidCount === 0 && setJokerHovered(true)}
          onMouseLeave={() => setJokerHovered(false)}
          onClick={() => { if (ownedPaidCount === 0) setJokerHovered(true) }}
        >
          <img src="/images/jokers/1.webp" alt="Joker" className={styles.jokerImg} />
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>
              {ownedPaidCount === 0 && jokerHovered ? 'You have no jokers — Buy a deck!' : 'Reload a Joker'}
            </span>
            <span className={styles.removeAdsDesc}>
              {ownedPaidCount === 0
                ? 'Buy a deck to earn jokers'
                : 'Use one extra joker today'}
            </span>
          </div>
          {ownedPaidCount > 0
            ? <div className={styles.coinPrice}>
                <img src="/images/coin.webp" alt="" className={styles.coinPriceImg} />
                {String(JOKER_RELOAD_PRICE).split('').map((d, i) => (
                  <img key={i} src={`/images/${d}.webp`} alt={d} className={styles.coinPriceDigit} />
                ))}
              </div>
            : <img src="/images/padlock.webp" alt="Locked" className={styles.jokerPadlock} />
          }
        </button>

        {/* Remove Ads */}
        <h2 className={styles.sectionTitle}>🚫 Remove Ads</h2>
        <button
          className={`${styles.removeAdsCard} ${noAds ? styles.lockedItem : ''}`}
          onClick={() => { if (!noAds) buy('remove_ads') }}
          disabled={noAds || !!buying}
        >
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>{noAds ? '✓ Ad-Free Active' : 'Remove Forced Ads'}</span>
            <span className={styles.removeAdsDesc}>{noAds ? 'Enjoying an ad-free game!' : 'Remove pop-up and banner ads · Rewarded ads remain'}</span>
          </div>
          {!noAds && <span className={styles.removeAdsPrice}>from £7.99</span>}
        </button>

        {/* Lucky Spin entry */}
        <h2 className={styles.sectionTitle}>🎡 Lucky Spin</h2>
        <button className={styles.removeAdsCard} onClick={navProps?.onSpin}>
          <img src="/images/wheel.webp" alt="Lucky Spin" className={styles.spinWheelImg} />
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>FREE DAILY SPIN</span>
            <span className={styles.removeAdsDesc}>Spin it to win it!</span>
          </div>
        </button>

        {/* Loot Box */}
        <h2 className={styles.sectionTitle}>📦 Treasure Chest</h2>
        <button className={`${styles.removeAdsCard} ${styles.chestCard}`} onClick={() => buy('chest')} disabled={!!buying}>
          <div className={styles.chestEmoji}>
            <img src="/images/chest.webp" alt="Chest" className={styles.chestImg} draggable="false" />
          </div>
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>Bonus Chest</span>
            <span className={styles.removeAdsDesc}>400 coins + power-ups + bonus rewards</span>
          </div>
          <span className={styles.removeAdsPrice}>£3.99</span>
        </button>
        <div className={styles.chestTiers}>
          <div className={styles.chestTierLocked}>
            <span className={styles.chestTierReward}><img src="/images/coin.webp" alt="coins" className={styles.chestTierCoin} /> ×400</span>
            <span className={styles.chestTierLabel}>BONUS!</span>
          </div>
          <div className={styles.chestTierLocked}>
            <span className={styles.chestTierReward}><img src="/images/cards/special/freeze.webp" alt="Freeze" className={styles.chestTierCoin} /> ×1</span>
            <span className={styles.chestTierLabel}>BONUS!</span>
          </div>
        </div>

        {/* Power-ups */}
        <h2 className={styles.sectionTitle}>⚡ Power-ups</h2>
        <div className={styles.powerupGrid}>
          {POWERUPS.map(pu => (
            <button key={pu.id} className={styles.powerupCard}>
              <img src={pu.image} alt={pu.label} className={styles.powerupImg} />
              <span className={styles.powerupLabel}>
                {pu.label}{pu.qty && <span className={styles.powerupQty}> ×{pu.qty}</span>}
              </span>
              <span className={styles.powerupDesc}>{pu.desc}</span>
              <div className={styles.powerupPrice}>
                <img src="/images/coin.webp" alt="" className={styles.powerupCoin} />
                {pu.price}
              </div>
            </button>
          ))}
        </div>

        {/* Bundles */}
        <h2 className={styles.sectionTitle}>🎁 Bundles</h2>
        <div className={styles.bundleList}>
          {BUNDLES.map(b => (
            <button key={b.id} className={`${styles.bundleCard} ${b.highlight ? styles.highlighted : ''}`} onClick={() => buy(b.id)} disabled={!!buying}>
              {b.id === 'bundle_starter' && (
                <div className={styles.starterVisual}>
                  <div className={styles.shieldStack}>
                    {[0,1,2].map(i => (
                      <img key={i} src="/images/cards/special/shield.webp" alt="Shield" className={styles.shieldStackImg} style={{ zIndex: i, transform: `translateX(${i * 14}px)` }} />
                    ))}
                  </div>
                  <div className={styles.starterCoins}>
                    <img src="/images/coin.webp" alt="coins" className={styles.starterCoinImg} />
                    {'500'.split('').map((d, i) => (
                      <img key={i} src={`/images/${d}.webp`} alt={d} className={styles.starterDigit} />
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.bundleText}>
                <span className={styles.bundleLabel}>{b.label}</span>
                <span className={styles.bundleDesc}>{b.desc}</span>
              </div>
              <span className={styles.bundlePrice}>{buying === b.id ? '…' : b.price}</span>
              {b.highlight && <span className={styles.bestValue}>BEST VALUE</span>}
            </button>
          ))}
        </div>

        <div className={styles.footer} />

      </div>
      <AdBanner />
      <BottomNav active="shop" {...navProps} />
      {showRemoveAdsModal && (
        <RemoveAdsModal
          onClose={() => setShowRemoveAdsModal(false)}
          onBuy={() => setNoAds(true)}
        />
      )}

      {coinModal && (
        <div className={styles.coinModalOverlay} onClick={() => setCoinModal(null)}>
          <div className={styles.coinModal} onClick={e => e.stopPropagation()}>
            <img src={coinModal.img} alt={coinModal.label} className={styles.coinModalImg} />
            <div className={styles.coinModalBtns}>
              <button className={styles.coinModalBtn} onClick={() => { setCoinModal(null); buy(coinModal.id) }} disabled={!!buying}>
                <img src="/images/a13.webp" alt="Buy" className={styles.coinModalBtnImg} />
              </button>
              <button className={styles.coinModalBtn} onClick={() => setCoinModal(null)}>
                <img src="/images/a14.webp" alt="Cancel" className={styles.coinModalBtnImg} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
