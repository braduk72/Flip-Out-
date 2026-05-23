import styles from './Gauntlet.module.css'
import BottomNav from '../components/BottomNav'
import { KNOCKOUT_OPPONENTS } from '../data/opponents'

const TIER_COLORS = {
  Easy:   { bg: 'rgba(26,110,46,0.85)',  color: '#afffb8', border: '#1a6e2e' },
  Medium: { bg: 'rgba(122,82,0,0.85)',   color: '#ffe080', border: '#c8840a' },
  Hard:   { bg: 'rgba(122,21,0,0.85)',   color: '#ffaaaa', border: '#cc2200' },
  Lethal: { bg: 'rgba(80,0,120,0.9)',    color: '#e060ff', border: '#9400cc' },
}

export default function Gauntlet({ step, onFight, onBack, onReset, navProps }) {
  const isComplete  = step >= KNOCKOUT_OPPONENTS.length
  const goldCardDate = localStorage.getItem('fo_gold_card')
  const current    = KNOCKOUT_OPPONENTS[Math.min(step, KNOCKOUT_OPPONENTS.length - 1)]
  const tierColor  = TIER_COLORS[current.tier] || TIER_COLORS.Easy

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">← Back</button>
        <h1 className={styles.title}>KNOCKOUT<br />GAUNTLET</h1>
      </div>

      {/* Opponent timeline — scrollable row of portrait circles */}
      <div className={styles.timelineWrap}>
        <div className={styles.timeline}>
          {KNOCKOUT_OPPONENTS.map((opp, i) => {
            const status = i < step ? 'beaten' : i === step ? 'current' : 'locked'
            return (
              <div
                key={opp.id}
                className={`${styles.timelineItem} ${styles[status]} ${opp.isBoss ? styles.boss : ''}`}
              >
                <div className={styles.timelinePortrait}>
                  <img
                    src={status === 'beaten' && opp.defeatedImage ? opp.defeatedImage : opp.image}
                    alt=""
                    draggable="false"
                  />
                  {status === 'beaten' && <div className={styles.beatenOverlay}>✕</div>}
                  {status === 'locked' && !opp.isBoss && <div className={styles.lockedOverlay}>🔒</div>}
                  {status === 'locked' && opp.isBoss  && <div className={styles.lockedOverlay}>💀</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main area */}
      {isComplete ? (

        /* Champion screen */
        <div className={styles.champion}>
          <div className={styles.championTitle}>CHAMPION!</div>
          <div className={styles.championSub}>You defeated Professor Claw!</div>

          {/* Gold Collector Card */}
          {goldCardDate && (
            <div className={styles.goldCard}>
              <div className={styles.goldCardShimmer} />
              <div className={styles.goldCardHeader}>✦ GOLD COLLECTOR CARD ✦</div>
              <div className={styles.goldCardPortraitWrap}>
                <img src="/images/Opponants/l1.webp" alt="Professor Claw" className={styles.goldCardPortrait} />
              </div>
              <div className={styles.goldCardName}>PROFESSOR CLAW</div>
              <div className={styles.goldCardRarity}>GAUNTLET CHAMPION · UNIQUE</div>
              <div className={styles.goldCardDate}>Earned {goldCardDate}</div>
            </div>
          )}
        </div>

      ) : (

        /* Current opponent card */
        <div className={styles.currentCard} style={{ borderColor: tierColor.border }}>
          <div
            className={styles.currentPortraitWrap}
            style={{ borderColor: current.isBoss ? '#cc44ff' : 'rgba(255,215,0,0.6)' }}
          >
            <img src={current.image} alt="" className={styles.currentPortrait} draggable="false" />
          </div>
          {current.name && (
            <div className={styles.opponentName} style={{ color: current.isBoss ? '#e060ff' : '#fff' }}>
              {current.name}
            </div>
          )}
          <div
            className={styles.tierBadge}
            style={{ background: tierColor.bg, color: tierColor.color, borderColor: tierColor.border }}
          >
            {current.isBoss ? '💀 FINAL BOSS' : `ROUND ${step + 1}`}
          </div>
          <div className={styles.stepLabel}>{step + 1} of {KNOCKOUT_OPPONENTS.length}</div>
        </div>

      )}

      {/* Action buttons */}
      <div className={styles.actions}>
        {isComplete ? (
          <button className={styles.resetBtn} onClick={onReset}>Play Again</button>
        ) : (
          <button
            className={`${styles.fightBtn} ${current.isBoss ? styles.fightBtnBoss : ''}`}
            onClick={onFight}
          >
            {current.isBoss ? '⚡ FACE THE CLAW ⚡' : 'FIGHT!'}
          </button>
        )}
        {!isComplete && step > 0 && (
          <button className={styles.resetLink} onClick={onReset}>
            Reset progress
          </button>
        )}
      </div>

      <BottomNav active="home" {...navProps} />
    </div>
  )
}
