import { useState } from 'react'
import { DECKS } from '../data/decks'
import styles from './Shop.module.css'
import BottomNav from '../components/BottomNav'
import AdBanner from '../components/AdBanner'
import RemoveAdsModal from '../components/RemoveAdsModal'

function getOwnedPaidCount() {
  const owned = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
  return DECKS.filter(d => !d.free && owned.includes(d.id)).length
}

const COIN_PACKS = [
  { id: 'coins_100',  label: '100 Coins',  price: '£0.99',  coins: 100,  highlight: false },
  { id: 'coins_500',  label: '500 Coins',  price: '£3.99',  coins: 500,  highlight: false },
  { id: 'coins_1000', label: '1000 Coins', price: '£6.99',  coins: 1000, highlight: true  },
]

const JOKER_RELOAD_PRICE = 50

const POWERUPS = [
  { id: 'pu_peek',    label: 'Peek',        desc: 'Briefly reveal all cards', price: 50,  emoji: '👁️' },
  { id: 'pu_freeze',  label: 'Freeze',      desc: 'Stop the timer for 5s',    price: 40,  emoji: '❄️' },
  { id: 'pu_shuffle', label: 'Shuffle',     desc: 'Reshuffle unmatched cards', price: 30, emoji: '🔀' },
]

const BUNDLES = [
  { id: 'bundle_starter', label: 'Starter Bundle', desc: '500 coins + Peek × 3', price: '£2.99', highlight: false },
  { id: 'bundle_mega',    label: 'Mega Bundle',    desc: '1500 coins + all power-ups × 5', price: '£9.99', highlight: true },
]

export default function Shop({ onBack, navProps }) {
  const ownedPaidCount = getOwnedPaidCount()
  const [jokerHovered, setJokerHovered] = useState(false)
  const [noAds, setNoAds] = useState(() => !!localStorage.getItem('fo_no_ads'))
  const [showRemoveAdsModal, setShowRemoveAdsModal] = useState(false)
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
            <button key={pack.id} className={`${styles.coinCard} ${pack.highlight ? styles.highlighted : ''}`}>
              <img src="/images/coin.png" alt="" className={styles.coinCardImg} />
              <span className={styles.coinCardLabel}>{pack.label}</span>
              <span className={styles.coinCardPrice}>{pack.price}</span>
              {pack.highlight && <span className={styles.bestValue}>BEST VALUE</span>}
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
                <img src="/images/coin.png" alt="" className={styles.coinPriceImg} />
                {String(JOKER_RELOAD_PRICE).split('').map((d, i) => (
                  <img key={i} src={`/images/${d}.png`} alt={d} className={styles.coinPriceDigit} />
                ))}
              </div>
            : <span className={styles.lockedLabel}>🔒</span>
          }
        </button>

        {/* Remove Ads */}
        <h2 className={styles.sectionTitle}>🚫 Remove Ads</h2>
        <button
          className={`${styles.removeAdsCard} ${noAds ? styles.lockedItem : ''}`}
          onClick={() => !noAds && setShowRemoveAdsModal(true)}
          disabled={noAds}
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
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>Daily Spin Wheel</span>
            <span className={styles.removeAdsDesc}>Spin for coins and power-ups · 2 free spins daily</span>
          </div>
          <span className={styles.removeAdsPrice}>FREE</span>
        </button>

        {/* Loot Box */}
        <h2 className={styles.sectionTitle}>📦 Treasure Chest</h2>
        <button className={`${styles.removeAdsCard} ${styles.chestCard}`}>
          <div className={styles.chestEmoji}>🎁</div>
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>Mystery Chest</span>
            <span className={styles.removeAdsDesc}>Random coins + power-ups + bonus rewards</span>
          </div>
          <span className={styles.removeAdsPrice}>£3.99</span>
        </button>
        <div className={styles.chestTiers}>
          <div className={styles.chestTierLocked}>
            <span className={styles.chestTierReward}>🪙 ×150</span>
            <span className={styles.chestTierLabel}>Free</span>
            <span className={styles.chestTierLock}>🔒</span>
          </div>
          <div className={styles.chestTierLocked}>
            <span className={styles.chestTierReward}>❄️ ×1</span>
            <span className={styles.chestTierLabel}>Free</span>
            <span className={styles.chestTierLock}>🔒</span>
          </div>
        </div>

        {/* Power-ups */}
        <h2 className={styles.sectionTitle}>⚡ Power-ups</h2>
        <div className={styles.powerupGrid}>
          {POWERUPS.map(pu => (
            <button key={pu.id} className={styles.powerupCard}>
              <span className={styles.powerupEmoji}>{pu.emoji}</span>
              <span className={styles.powerupLabel}>{pu.label}</span>
              <span className={styles.powerupDesc}>{pu.desc}</span>
              <div className={styles.powerupPrice}>
                <img src="/images/coin.png" alt="" className={styles.powerupCoin} />
                {''+pu.price}
              </div>
            </button>
          ))}
        </div>

        {/* Bundles */}
        <h2 className={styles.sectionTitle}>🎁 Bundles</h2>
        <div className={styles.bundleList}>
          {BUNDLES.map(b => (
            <button key={b.id} className={`${styles.bundleCard} ${b.highlight ? styles.highlighted : ''}`}>
              <div className={styles.bundleText}>
                <span className={styles.bundleLabel}>{b.label}</span>
                <span className={styles.bundleDesc}>{b.desc}</span>
              </div>
              <span className={styles.bundlePrice}>{b.price}</span>
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
    </div>
  )
}
