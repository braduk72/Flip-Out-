import { useState, useEffect } from 'react'
import { DECKS, getDeckBackImage } from '../data/decks'
import styles from './DeckPicker.module.css'

function randomCard(deck) {
  const n = deck.cardStart + Math.floor(Math.random() * deck.cardCount)
  return `${deck.path}/${n}.png`
}

const FREE_INDICES = DECKS.map((d, i) => d.free ? i : null).filter(i => i !== null)

function getOwnedDecks() {
  return JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
}

function buyDeckById(id) {
  const owned = getOwnedDecks()
  if (!owned.includes(id)) {
    localStorage.setItem('fo_owned_decks', JSON.stringify([...owned, id]))
  }
}

export default function DeckPicker({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null)
  const [buyDeck, setBuyDeck] = useState(null)
  const [ownedDecks, setOwnedDecks] = useState(getOwnedDecks)
  const [previews, setPreviews] = useState(() =>
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
      setBuyDeck(deck)
      return
    }
    onSelect(deck)
  }

  function surpriseMe() {
    const pick = DECKS[Math.floor(Math.random() * DECKS.length)]
    onSelect(pick)
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
              {!deck.free && !ownedDecks.includes(deck.id) && <div className={styles.lockBadge}><img src="/images/padlock.png" alt="Locked" /></div>}
            </div>
            <div className={styles.deckName}>{deck.name}</div>
          </button>
        ))}
      </div>
    </div>

      {buyDeck && (
        <div className={styles.modalOverlay} onClick={() => setBuyDeck(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ backgroundImage: `url(${buyDeck.path}/${buyDeck.cardStart}.png)` }}>
            <p className={styles.modalDeckName}>{buyDeck.name}</p>
            <p className={styles.modalPrice}>
              <img src="/images/coin.png" alt="coins" className={styles.modalCoinImg} />
              {'200'.split('').map((d, i) => (
                <img key={i} src={`/images/${d}.png`} alt={d} className={styles.modalDigitImg} />
              ))}
            </p>
            <div className={styles.modalBtns}>
              <button className={styles.buyBtn} onClick={() => {
                buyDeckById(buyDeck.id)
                setOwnedDecks(getOwnedDecks())
                setBuyDeck(null)
              }}>BUY</button>
              <button className={styles.cancelBtn} onClick={() => setBuyDeck(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
