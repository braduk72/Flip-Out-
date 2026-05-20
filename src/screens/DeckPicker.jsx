import { DECKS, getDeckBackImage } from '../data/decks'
import styles from './DeckPicker.module.css'

export default function DeckPicker({ onSelect, onBack }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Pick a Deck</h1>
      </div>

      <div className={styles.grid}>
        {DECKS.map(deck => (
          <button
            key={deck.id}
            className={styles.deckCard}
            style={{ '--border-color': deck.borderColor }}
            onClick={() => onSelect(deck)}
          >
            <div className={styles.deckPreview}>
              <img
                src={getDeckBackImage(deck)}
                alt={deck.name}
                className={styles.previewImg}
              />
              {!deck.free && (
                <div className={styles.lockBadge}>🔒</div>
              )}
            </div>
            <div className={styles.deckName}>
              {deck.name}
            </div>
            {deck.free && <div className={styles.freeBadge}>FREE</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
