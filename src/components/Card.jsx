import styles from './Card.module.css'

export default function Card({ card, isFlipped, isMatched, isFrozen, isConsumed, revealEffect, isShuffling, onClick, backImage, style }) {
  const faceUp = isFlipped && !isMatched

  return (
    <div
      className={`
        ${styles.card}
        ${faceUp      ? styles.faceUp    : ''}
        ${isMatched   ? styles.matched   : ''}
        ${isFrozen    ? styles.frozen    : ''}
        ${isConsumed  ? styles.consumed  : ''}
        ${isShuffling ? styles.shuffling : ''}
      `}
      onClick={onClick}
      role="button"
      aria-label={faceUp ? card.specialType || 'card' : 'face-down card'}
      style={style}
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
      {isFrozen && (
        <div className={styles.frozenOverlay}>
          <svg className={styles.frozenCrystal} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <line x1="24" y1="3"  x2="24" y2="45" stroke="rgba(200,240,255,0.95)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="3"  y1="24" x2="45" y2="24" stroke="rgba(200,240,255,0.95)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="9"  y1="9"  x2="39" y2="39" stroke="rgba(180,225,255,0.75)" strokeWidth="2"   strokeLinecap="round"/>
            <line x1="39" y1="9"  x2="9"  y2="39" stroke="rgba(180,225,255,0.75)" strokeWidth="2"   strokeLinecap="round"/>
            <line x1="24" y1="11" x2="18" y2="17" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="24" y1="11" x2="30" y2="17" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="24" y1="37" x2="18" y2="31" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="24" y1="37" x2="30" y2="31" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11" y1="24" x2="17" y2="18" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11" y1="24" x2="17" y2="30" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="37" y1="24" x2="31" y2="18" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="37" y1="24" x2="31" y2="30" stroke="rgba(200,240,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="4" fill="rgba(220,245,255,0.6)" stroke="rgba(200,240,255,0.95)" strokeWidth="1.5"/>
          </svg>
          <span className={styles.frozenLabel}>FROZEN</span>
        </div>
      )}
      {revealEffect && (
        <div className={styles.revealBadge}>
          <img src={`/images/cards/special/${revealEffect}.png`} alt={revealEffect} />
        </div>
      )}
    </div>
  )
}
