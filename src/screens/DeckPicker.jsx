import { useState, useEffect } from 'react'
import { DECKS, getDeckBackImage } from '../data/decks'
import styles from './DeckPicker.module.css'

const FREE_INDICES = DECKS.map((d, i) => d.free ? i : null).filter(i => i !== null)

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

function buyDeckById(id) {
  const owned = getOwnedDecks()
  if (!owned.includes(id)) {
    localStorage.setItem('fo_owned_decks', JSON.stringify([...owned, id]))
  }
}

export default function DeckPicker({ onSelect, onBack }) {
  const [selected, setSelected]     = useState(null)
  const [buyDeck, setBuyDeck]       = useState(null)
  const [notEnough, setNotEnough]   = useState(false)
  const [ownedDecks, setOwnedDecks] = useState(getOwnedDecks)
  const [coins, setCoins]           = useState(getCoins)
  const [previews, setPreviews]     = useState(() =>
    DECKS.map(deck => deck.free ? randomCard(deck) : getDeckBackImage(deck))
  )

  useEffect(() => {
    let cursor = 0
    const interval = setInterval(() => {
      const deckIndex = FREE_INDICES[cursor]
      const deck = DECKS[deckIndex]
      setPreviews(prev => {
        const next = [...prev]
        next[deckIndex] = randomCard(deck)
        return next
      })
      cursor = (cursor + 1) % FREE_INDICES.length
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  function handleHover(deck) {
    if (deck.free || ownedDecks.includes(deck.id)) setSelected(deck)
  }

  function handleCard(deck) {
    if (!deck.free && !ownedDecks.includes(deck.id)) {
      setNotEnough(false)
      setBuyDeck(deck)
      return
    }
    onSelect(deck)
  }

  function handleBuyWithCoins() {
    const price = buyDeck.coinPrice ?? 200
    const current = getCoins()
    if (current < price) {
      setNotEnough(true)
      return
    }
    localStorage.setItem('fo_coins', String(current - price))
    buyDeckById(buyDeck.id)
    setOwnedDecks(getOwnedDecks())
    setCoins(current - price)
    setBuyDeck(null)
  }

  function surpriseMe() {
    const available = DECKS.filter(d => d.free || ownedDecks.includes(d.id))
    const pool = available.length > 0 ? available : DECKS
    onSelect(pool[Math.floor(Math.random() * pool.length)])
  }

  return (
    <div className={styles.page}>

    <div className={styles.scroll}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Pick a Deck</h1>
      </div>

      <button className={styles.surpriseBtn} onClick={surpriseMe}>
        🎲 Surprise Me!
      </button>

      <div className={styles.grid}>
        {DECKS.map((deck, i) => (
          <button
            key={deck.id}
            className={`${styles.deckCard} ${selected?.id === deck.id ? styles.deckSelected : ''}`}
            style={{ '--border-color': deck.borderColor }}
            onMouseEnter={() => handleHover(deck)}
            onMouseLeave={() => setSelected(null)}
            onClick={() => handleCard(deck)}
          >
            <div className={styles.deckPreview}>
              <img key={previews[i]} src={previews[i]} alt={deck.name} className={styles.previewImg} />
              {!deck.free && !ownedDecks.includes(deck.id) && <div className={styles.lockBadge}><img src="/images/padlock.webp" alt="Locked" /></div>}
            </div>
            <div className={styles.deckName}>{deck.name}</div>
          </button>
        ))}
      </div>
    </div>

      {buyDeck && (
        <div className={styles.modalOverlay} onClick={() => setBuyDeck(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ backgroundImage: `url(${buyDeck.path}/${buyDeck.cardStart}.webp)` }}>
            <p className={styles.modalDeckName}>{buyDeck.name}</p>
            <p className={styles.modalPrice}>
              <img src="/images/coin.webp" alt="coins" className={styles.modalCoinImg} />
              {String(buyDeck.coinPrice ?? 200).split('').map((d, i) => (
                <img key={i} src={`/images/${d}.webp`} alt={d} className={styles.modalDigitImg} />
              ))}
            </p>
            {notEnough && (
              <p className={styles.notEnough}>Not enough coins! Visit the Shop to get more.</p>
            )}
            <div className={styles.modalBtns}>
              <button
                className={styles.buyBtn}
                onClick={handleBuyWithCoins}
              >
                {notEnough ? `Need ${(buyDeck.coinPrice ?? 200) - coins} more` : 'BUY'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setBuyDeck(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
