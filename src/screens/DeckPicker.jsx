import { useState, useEffect } from 'react'
import { DECKS, FREE_CARD_COUNT, getDeckBackImage } from '../data/decks'
import styles from './DeckPicker.module.css'
import { createTransactionId, economy } from '../utils/economyService.js'

function randomCard(deck) {
  const n = deck.cardStart + Math.floor(Math.random() * deck.cardCount)
  return `${deck.path}/${n}.webp`
}

function getOwnedDecks() {
  return JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
}

function getCoins() {
  return parseInt(localStorage.getItem('fo_coins') || '0')
}

function getFreeUnlocks() {
  return parseInt(localStorage.getItem('fo_free_unlocks') || '0')
}

export default function DeckPicker({ onSelect, onBack }) {
  const [selected, setSelected]       = useState(null)
  const [buyDeck, setBuyDeck]         = useState(null)
  const [notEnough, setNotEnough]     = useState(false)
  const [ownedDecks, setOwnedDecks]   = useState(getOwnedDecks)
  const [coins, setCoins]             = useState(getCoins)
  const [freeUnlocks, setFreeUnlocks] = useState(getFreeUnlocks)
  const [previews, setPreviews] = useState(() => {
    const map = {}
    DECKS.forEach(deck => { map[deck.id] = randomCard(deck) })
    return map
  })

  // Rotate preview images across all decks
  useEffect(() => {
    let cursor = 0
    const interval = setInterval(() => {
      const deck = DECKS[cursor]
      setPreviews(prev => ({ ...prev, [deck.id]: randomCard(deck) }))
      cursor = (cursor + 1) % DECKS.length
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  function isOwned(deck) {
    return deck.free || ownedDecks.includes(deck.id)
  }

  function handleCard(deck) {
    if (!isOwned(deck)) {
      setNotEnough(false)
      setBuyDeck(deck)
      return
    }
    onSelect(deck)
  }

  function handlePlayFree() {
    if (!buyDeck) return
    setBuyDeck(null)
    onSelect(buyDeck)
  }

  function handleBuyWithCoins() {
    const price = buyDeck.coinPrice ?? 200
    const current = getCoins()
    if (current < price) {
      setNotEnough(true)
      return
    }
    const result = economy.applyTransaction({
      id: createTransactionId(`deck-unlock:${buyDeck.id}`),
      source: 'deck-unlock',
      changes: { counters: { coins: -price }, decks: [buyDeck.id] },
    })
    if (!result.applied) return
    setOwnedDecks(getOwnedDecks())
    setCoins(current - price)
    setBuyDeck(null)
    onSelect(buyDeck)
  }

  function handleFreeUnlock() {
    const remaining = getFreeUnlocks()
    if (remaining <= 0 || !buyDeck) return
    const result = economy.applyTransaction({
      id: createTransactionId(`free-deck-unlock:${buyDeck.id}`),
      source: 'free-deck-unlock',
      changes: { counters: { freeUnlocks: -1 }, decks: [buyDeck.id] },
    })
    if (!result.applied) return
    setOwnedDecks(getOwnedDecks())
    setFreeUnlocks(remaining - 1)
    setBuyDeck(null)
    onSelect(buyDeck)
  }

  return (
    <div className={styles.page}>

      <div className={styles.scroll}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <img src="/images/back_button.webp" alt="Back" draggable="false" className={styles.backBtnImg} />
          </button>
          <h1 className={styles.title}>Pick a Deck</h1>
        </div>

        <div className={styles.grid}>
          {DECKS
            .slice()
            .sort((a, b) => (isOwned(b) ? 1 : 0) - (isOwned(a) ? 1 : 0))
            .map(deck => (
              <button
                key={deck.id}
                className={`${styles.deckCard} ${selected?.id === deck.id ? styles.deckSelected : ''}`}
                style={{ '--border-color': deck.borderColor }}
                onMouseEnter={() => setSelected(deck)}
                onMouseLeave={() => setSelected(null)}
                onClick={() => handleCard(deck)}
              >
                {deck.id === 'WorldLandmarks' && <span className={styles.mediumBadge}>MEDIUM</span>}
                {deck.id === 'birdsOfPrey'    && <span className={styles.hardBadge}>HARD</span>}
                <div className={styles.deckPreview}>
                  <img key={previews[deck.id]} src={previews[deck.id]} alt={deck.name} className={styles.previewImg} />
                  {!isOwned(deck) && (
                    <div className={styles.freeBadge}>
                      TRIAL
                    </div>
                  )}
                </div>
                <div className={styles.deckName}>{deck.name}</div>
              </button>
            ))}
        </div>
      </div>

      {buyDeck && (
        <div className={styles.modalOverlay} onClick={() => setBuyDeck(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ backgroundImage: `url(${buyDeck.path}/${buyDeck.cardStart}.webp)` }}>
            <button className="modal-close-x" onClick={() => setBuyDeck(null)} aria-label="Close">✕</button>
            <p className={styles.modalDeckName}>{buyDeck.name}</p>

            {freeUnlocks > 0 ? (
              /* ── Free unlock available ── */
              <>
                <p className={styles.freeUnlockBadge}>🎁 {freeUnlocks} FREE UNLOCK{freeUnlocks > 1 ? 'S' : ''} AVAILABLE</p>
                <div className={styles.modalBtns}>
                  <button className={styles.freeUnlockBtn} onClick={handleFreeUnlock}>
                    UNLOCK FREE
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setBuyDeck(null)}>CANCEL</button>
                </div>
                <button className={styles.buyWithCoinsSmall} onClick={handleBuyWithCoins}>
                  or buy with {String(buyDeck.coinPrice ?? 200)} coins instead
                </button>
              </>
            ) : (
              /* ── Free taster vs full unlock ── */
              <>
                <p className={styles.freeTagline}>✨ Try {FREE_CARD_COUNT} cards free!</p>
                <p className={styles.fullDeckPerks}>Full deck includes the 🃏 Joker &amp; ⭐ Gold Collector Card!</p>
                <p className={styles.modalPrice}>
                  <img src="/images/coin.webp" alt="coins" className={styles.modalCoinImg} />
                  {String(buyDeck.coinPrice ?? 200).split('').map((d, idx) => (
                    <img key={idx} src={`/images/${d}.webp`} alt={d} className={styles.modalDigitImg} />
                  ))}
                  <span className={styles.modalPriceLabel}> = full deck</span>
                </p>
                {notEnough && (
                  <p className={styles.notEnough}>Not enough coins! Visit the Shop to get more.</p>
                )}
                <div className={styles.modalBtns}>
                  <button className={styles.playFreeBtn} onClick={handlePlayFree}>
                    ▶ PLAY FREE
                  </button>
                  <button
                    className={styles.buyBtn}
                    onClick={handleBuyWithCoins}
                    disabled={coins < (buyDeck.coinPrice ?? 200)}
                  >
                    {notEnough ? `Need ${(buyDeck.coinPrice ?? 200) - coins} more` : '🔓 UNLOCK ALL'}
                  </button>
                </div>
                <button className={styles.cancelBtn} style={{ marginTop: 8 }} onClick={() => setBuyDeck(null)}>
                  CANCEL
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
