import styles from './Card.module.css'

export default function Card({ card, isFlipped, isMatched, isFrozen, isConsumed, onClick, backImage }) {
  const faceUp = isFlipped && !isMatched

  return (
    <div
      className={`
        ${styles.card}
        ${faceUp    ? styles.faceUp   : ''}
        ${isMatched ? styles.matched  : ''}
        ${isFrozen  ? styles.frozen   : ''}
        ${isConsumed? styles.consumed : ''}
      `}
      onClick={onClick}
      role="button"
      aria-label={faceUp ? card.specialType || 'card' : 'face-down card'}
    >
      <div className={styles.inner}>
        <div className={styles.back}>
          {backImage && !isMatched
            ? <img src={backImage} alt="" draggable="false" className={styles.backImg} />
            : <><div className={styles.backPattern} /><span className={styles.backLogo}>F!</span></>
          }
        </div>
        <div className={styles.front}>
          <img src={card.image} alt="" draggable="false" />
          {card.name && (
            <div className={styles.cardName}>{card.name}</div>
          )}
          {card.type === 'special' && (
            <div className={styles.specialBadge}>SPECIAL</div>
          )}
        </div>
      </div>
      {isFrozen && <div className={styles.frozenOverlay}>❄️</div>}
    </div>
  )
}
