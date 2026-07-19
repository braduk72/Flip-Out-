import { useState, useEffect } from 'react'
import styles from './Shop.module.css'
import BottomNav from '../components/BottomNav'
import RemoveAdsModal from '../components/RemoveAdsModal'
import { startCheckout, restorePurchases } from '../utils/foShop.js'
import { economy } from '../utils/economyService.js'
import { getDeviceUuid } from '../utils/deviceId.js'

const COIN_PACKS = [
  { id: 'coins_100',  label: '100 Coins',  price: '£0.99',  coins: 100,  highlight: false, img: '/images/x100.webp'  },
  { id: 'coins_500',  label: '500 Coins',  price: '£3.99',  coins: 500,  highlight: false, img: '/images/x500.webp'  },
  { id: 'coins_1000', label: '1000 Coins', price: '£6.99',  coins: 1000, highlight: true,  img: '/images/x1000.webp' },
]

const POWERUPS = [
  { id: 'pu_xray',    label: 'X-Ray',   desc: 'Peek at 2 cards before your turn', price: 50, qty: 3, image: '/images/cards/special/xray.webp'    },
  { id: 'pu_freeze',  label: 'Freeze',  desc: 'Freeze surrounding cards for a turn',   price: 50, qty: 3, image: '/images/cards/special/freeze.webp'  },
  { id: 'pu_shuffle', label: 'Shuffle', desc: 'Reshuffle all unmatched cards',   price: 50, qty: 3, image: '/images/cards/special/shuffle.webp' },
]

const BUNDLES = [
  { id: 'bundle_starter', label: 'Starter Bundle', desc: '500 coins + Shield × 3', price: '£2.99', highlight: false },
  { id: 'bundle_mega',    label: 'Mega Bundle',    desc: '1500 coins + 1× X-Ray, 1× Freeze, 1× Bolt, 2× Shield', price: '£9.99', highlight: true,
    cards: [
      '/images/cards/special/xray.webp',
      '/images/cards/special/freeze.webp',
      '/images/cards/special/bolt.webp',
      '/images/cards/special/shield.webp',
      '/images/cards/special/shield.webp',
    ]
  },
]

const STAGE_BKGS = [1, 2, 3, 4].map(n => `/images/gameshowStages/${n}.webp`)

export default function Shop({ onBack, onInventory, onMarketplace, navProps }) {
  const [bgIdx, setBgIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % STAGE_BKGS.length), 8000)
    return () => clearInterval(t)
  }, [])
  const [, setNoAds] = useState(() => !!localStorage.getItem('fo_no_ads'))
  const [showRemoveAdsModal, setShowRemoveAdsModal] = useState(false)
  const [buying, setBuying] = useState(null)
  const [restoreState, setRestoreState] = useState('idle') // idle | loading | done | notfound | error

  async function handleRestore() {
    if (restoreState === 'loading') return
    setRestoreState('loading')
    try {
      const result = await restorePurchases()
      if (result.found) setRestoreState('done')
      else setRestoreState('notfound')
    } catch { setRestoreState('error') }
  }
  const [coinModal, setCoinModal] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeResult, setCodeResult] = useState(null) // null | { loading } | { ok: true, ... } | { ok: false, msg }

  function applyCodeRewards(transactionId, { stars, spins, unlocks, avatar }) {
    return economy.applyTransaction({
      id: transactionId,
      source: 'promo',
      changes: {
        counters: { stars: stars || 0, bonusSpins: spins || 0, freeUnlocks: unlocks || 0 },
        avatars: avatar ? [avatar] : [],
      },
    })
  }

  async function redeemCode() {
    const code = codeInput.trim().toUpperCase()
    if (!code) return

    // Fast local check to avoid an obvious round-trip
    const used = JSON.parse(localStorage.getItem('fo_used_codes') || '[]')
    if (used.includes(code)) { setCodeResult({ ok: false, msg: '✗ Code already redeemed' }); return }

    setCodeResult({ loading: true })

    try {
      const res  = await fetch('/api/fo-redeem-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code, deviceUuid: getDeviceUuid() }),
      })
      const data = await res.json()

      if (!data.ok) { setCodeResult({ ok: false, msg: `✗ ${data.msg || 'Invalid code'}` }); return }

      applyCodeRewards(data.transactionId ?? `promo:${code}`, data)
      localStorage.setItem('fo_used_codes', JSON.stringify([...used, code]))
      setCodeResult({ ok: true, stars: data.stars, spins: data.spins, unlocks: data.unlocks, avatar: data.avatar })
      setCodeInput('')

    } catch {
      setCodeResult({ ok: false, msg: 'Could not securely verify that code. Try again online.' })
    }
  }

  async function buy(productId) {
    if (buying) return
    setBuying(productId)
    try { await startCheckout(productId) }
    catch { setBuying(null) }
  }
  return (
    <div className={styles.page}>
      {STAGE_BKGS.map((src, i) => (
        <img
          key={src}
          src={src}
          aria-hidden="true"
          draggable="false"
          className={`${styles.stageBg} ${i === bgIdx ? styles.stageBgActive : ''}`}
        />
      ))}
      <div className={styles.stageBgOverlay} />
      <div className={styles.scroll}>

        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <img src="/images/back_button.webp" alt="Back" draggable="false" className={styles.backBtnImg} />
          </button>
          <h1 className={styles.title}>Shop</h1>
        </div>

        {/* Lucky Spin entry */}
        <h2 className={styles.sectionTitle}>🎡 Lucky Spin</h2>
        <button className={`${styles.removeAdsCard} ${styles.spinCard}`} onClick={navProps?.onSpin}>
          <img src="/images/wheel.webp" alt="Lucky Spin" className={styles.spinWheelImg} />
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>FREE DAILY SPIN</span>
            <span className={styles.removeAdsDesc}>Spin it to win it!</span>
          </div>
        </button>

        <button className={styles.removeAdsCard} onClick={onInventory}>
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>MY COLLECTION</span>
            <span className={styles.removeAdsDesc}>Cards, decks, gold cards, items and transaction history</span>
          </div>
        </button>
        <button className={styles.removeAdsCard} onClick={onMarketplace}>
          <div className={styles.removeAdsText}>
            <span className={styles.removeAdsTitle}>EXCHANGE</span>
            <span className={styles.removeAdsDesc}>Trade eligible duplicate items for Flip-Out coins</span>
          </div>
        </button>

        {/* Promo code */}
        <h2 className={styles.sectionTitle}>🎟️ Enter a Code</h2>
        <div className={styles.promoCard}>
          <input
            className={styles.promoInput}
            type="text"
            placeholder="Enter your code…"
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeResult(null) }}
            onKeyDown={e => e.key === 'Enter' && codeInput.trim() && redeemCode()}
            maxLength={20}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className={styles.promoBtn} onClick={redeemCode} disabled={!codeInput.trim() || !!codeResult?.loading}>
            {codeResult?.loading ? 'Checking…' : 'Redeem'}
          </button>
          {codeResult?.ok && (
            <p className={`${styles.codeMsg} ${styles.codeMsgOk}`}>
              ✓ {[
                codeResult.stars   && `${codeResult.stars} Stars`,
                codeResult.spins   && `${codeResult.spins} bonus spins`,
                codeResult.unlocks && `${codeResult.unlocks} free deck unlock`,
                codeResult.avatar  && `exclusive avatar unlocked`,
              ].filter(Boolean).join(' + ')} added!
            </p>
          )}
          {codeResult && !codeResult.ok && (
            <p className={`${styles.codeMsg} ${styles.codeMsgErr}`}>{codeResult.msg}</p>
          )}
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

        {/* Joker reload — hidden until joker system is live */}

        {/* Remove Ads — hidden until ad network is live */}

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
              {b.id === 'bundle_mega' && (
                <div className={styles.starterVisual}>
                  <div className={styles.shieldStack}>
                    {b.cards.map((src, i) => (
                      <img key={i} src={src} alt="" className={styles.shieldStackImg} style={{ zIndex: i, transform: `translateX(${i * 14}px)` }} />
                    ))}
                  </div>
                  <div className={styles.starterCoins}>
                    <img src="/images/coin.webp" alt="coins" className={styles.starterCoinImg} />
                    {'1500'.split('').map((d, i) => (
                      <img key={i} src={`/images/${d}.webp`} alt={d} className={styles.starterDigit} />
                    ))}
                  </div>
                </div>
              )}
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

        {/* Restore Purchases */}
        <div className={styles.restoreRow}>
          <div>
            <span className={styles.restoreLabel}>Restore Purchases</span>
            <span className={styles.restoreMsg}>For this Flip-Out account</span>
          </div>
          <div className={styles.restoreRight}>
            {restoreState === 'done' ? (
              <span className={styles.restoreDone}>✓ Restored!</span>
            ) : (
              <>
                <button className={styles.restoreImgBtn} onClick={handleRestore} disabled={restoreState === 'loading'} aria-label="Restore purchases">
                  <img src="/images/restore.webp" alt="Restore" draggable="false" className={`${styles.restoreImg} ${restoreState === 'loading' ? styles.restoreSpinning : ''}`} />
                </button>
                {restoreState === 'notfound' && <span className={styles.restoreMsg}>Nothing found</span>}
                {restoreState === 'error'    && <span className={styles.restoreMsg}>Try again</span>}
              </>
            )}
          </div>
        </div>

        <div className={styles.footer} />

      </div>
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
