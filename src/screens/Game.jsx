import { useEffect, useRef, useCallback } from 'react'
import { useGame } from '../hooks/useGame'
import Card from '../components/Card'
import styles from './Game.module.css'
import { SPECIAL_CARDS } from '../data/specialCards'
import { getDeckBackImage } from '../data/decks'

const COLS = 4
const STAGE_COUNT = 4
const CONTESTANT_COUNT = 12

function randomStage() { return Math.floor(Math.random() * STAGE_COUNT) + 1 }
function randomContestant(exclude) {
  let pick
  do { pick = Math.floor(Math.random() * CONTESTANT_COUNT) + 1 } while (pick === exclude)
  return pick
}

export default function Game({ deck, portrait = 1, onBack, musicOn, sfxOn, onToggleMusic, onToggleSfx }) {
  const { state, flipCard, aiFlip, hideFlipped, clearEffect, clearFrozen, teachAI, getAIMove, applyPendingSpecial, commitResolve } = useGame(deck)
  const stageRef  = useRef(randomStage())
  const aiContRef = useRef(randomContestant(portrait))
  const aiTimerRef = useRef(null)

  const {
    cards, flipped, matched, consumed, frozen,
    playerScore, aiScore, turn, stunned,
    playerShield, aiShield, crownHolder,
    activeEffect, pendingSpecial, pendingResolve, gameOver, winner,
  } = state

  // Teach AI about cards it can see
  useEffect(() => {
    flipped.forEach(i => teachAI(i, cards[i]))
  }, [flipped, cards, teachAI])

  // Fire pending special after flip animation (380ms transition + brief pause)
  useEffect(() => {
    if (!pendingSpecial) return
    const t = setTimeout(
      () => applyPendingSpecial(pendingSpecial.index, pendingSpecial.whose),
      600
    )
    return () => clearTimeout(t)
  }, [pendingSpecial, applyPendingSpecial])

  // Resolve match/no-match after zoom animation plays on both cards
  useEffect(() => {
    if (!pendingResolve) return
    const t = setTimeout(
      () => commitResolve(pendingResolve.whose),
      950
    )
    return () => clearTimeout(t)
  }, [pendingResolve, commitResolve])

  // Handle no-match — hide cards after delay
  useEffect(() => {
    if (activeEffect?.type === 'no_match') {
      const t = setTimeout(() => {
        hideFlipped()
        clearEffect()
      }, 1800)
      return () => clearTimeout(t)
    }
  }, [activeEffect, hideFlipped, clearEffect])

  // Clear effect after brief display
  useEffect(() => {
    if (
      activeEffect &&
      activeEffect.type !== 'no_match' &&
      activeEffect.type !== 'flashlight' &&
      activeEffect.type !== 'stopwatch' &&
      activeEffect.type !== 'xray'
    ) {
      const t = setTimeout(clearEffect, 1800)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect])

  // Clear frozen after opponent's turn passes
  useEffect(() => {
    if (frozen.length > 0 && turn !== 'player') {
      const t = setTimeout(clearFrozen, 200)
      return () => clearTimeout(t)
    }
  }, [turn, frozen, clearFrozen])

  // AI turn logic
  const doAITurn = useCallback(() => {
    if (state.turn !== 'ai' || state.gameOver) return

    // If AI is stunned, skip turn
    if (state.stunned === 'ai') {
      setTimeout(() => hideFlipped(), 800)
      return
    }

    const delay1 = 900 + Math.random() * 500
    aiTimerRef.current = setTimeout(() => {
      const move1 = getAIMove(cards, flipped, matched, consumed, frozen)
      if (move1 === null) return
      aiFlip(move1)

      // Second flip — long enough for player to see the first card
      const delay2 = 1200 + Math.random() * 600
      aiTimerRef.current = setTimeout(() => {
        const move2 = getAIMove(cards, [move1], matched, consumed, frozen)
        if (move2 === null) return
        aiFlip(move2)
      }, delay2)
    }, delay1)
  }, [state, cards, flipped, matched, consumed, frozen, aiFlip, hideFlipped, getAIMove])

  useEffect(() => {
    if (turn === 'ai' && !gameOver && !activeEffect) {
      doAITurn()
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [turn, gameOver, activeEffect, doAITurn])

  // Flashlight effect — close after 3 seconds
  useEffect(() => {
    if (activeEffect?.type === 'flashlight') {
      const t = setTimeout(clearEffect, 3200)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect])

  // X-ray — close after 2 seconds
  useEffect(() => {
    if (activeEffect?.type === 'xray') {
      const t = setTimeout(clearEffect, 2000)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect])

  const totalPairs = cards.filter(c => c.type === 'regular').length / 2
  const progress = ((playerScore + aiScore) / totalPairs) * 100

  const isCardFlipped = i => flipped.includes(i)
  const isRevealed    = i => {
    if (activeEffect?.type === 'xray') return true
    if (activeEffect?.type === 'flashlight') return activeEffect.data.picks.includes(i)
    if (activeEffect?.type === 'boom')       return activeEffect.data.launched.includes(i)
    if (activeEffect?.type === 'rocket')     return activeEffect.data.line.includes(i)
    if (activeEffect?.type === 'tornado')    return activeEffect.data.trail.includes(i)
    return false
  }

  const effectCard = activeEffect
    ? SPECIAL_CARDS[activeEffect.type] || SPECIAL_CARDS[activeEffect?.data?.chosen]
    : null

  return (
    <div className={styles.page}>
      {/* Gameshow stage background */}
      <div
        className={styles.stage}
        style={{ backgroundImage: `url(/images/gameshowStages/${stageRef.current}.png)` }}
      />

      {/* All game UI in a centred phone-width column; stage bleeds full-screen behind */}
      <div className={styles.gameInner}>


        {/* Turn label */}
        <div className={styles.turnBar}>
          <span className={`${styles.turnDot} ${turn === 'player' ? styles.active : ''}`} />
          <div className={styles.turnLabel}>
            {gameOver
              ? winner === 'draw' ? '🤝 DRAW!' : winner === 'player' ? '🏆 YOU WIN!' : '😅 AI WINS!'
              : turn === 'player' ? 'YOUR TURN' : "AI'S TURN"
            }
          </div>
          <span className={`${styles.turnDot} ${turn === 'ai' ? styles.active : ''}`} />
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Card grid */}
        <div className={styles.boardWrap}>
          <div
            className={`
              ${styles.board}
              ${activeEffect?.type === 'flashlight' ? styles.darkRoom : ''}
              ${turn !== 'player' ? styles.aiTurn : ''}
            `}
          >
            {cards.map((card, i) => (
              <Card
                key={card.id}
                card={card}
                isFlipped={isCardFlipped(i) || isRevealed(i)}
                isMatched={matched.includes(i)}
                isFrozen={frozen.includes(i)}
                isConsumed={consumed.includes(i)}
                onClick={() => turn === 'player' && !gameOver && flipCard(i)}
                backImage={getDeckBackImage(deck)}
              />
            ))}
          </div>
        </div>

        {/* Portraits + scores */}
        <div className={styles.contestants}>
          <div className={styles.sidePanel}>
            <img src={`/images/contestants/${portrait}.png`} alt="You" className={styles.portrait} />
            <span className={styles.sideScore}>{playerScore}</span>
            <span className={styles.contLabel}>
              YOU{playerShield ? ' 🛡️' : ''}{crownHolder === 'player' ? ' 👑' : ''}
            </span>
          </div>
          <div className={styles.sidePanel}>
            <img src={`/images/contestants/${aiContRef.current}.png`} alt="AI" className={styles.portrait} />
            <span className={styles.sideScore}>{aiScore}</span>
            <span className={styles.contLabel}>
              CPU{aiShield ? ' 🛡️' : ''}{crownHolder === 'ai' ? ' 👑' : ''}
            </span>
          </div>
        </div>

        {/* Effect overlay banner */}
        {activeEffect && activeEffect.type !== 'no_match' && effectCard && (
          <div
            className={styles.effectBanner}
            style={{ '--effect-color': effectCard.color }}
          >
            <img src={effectCard.image} alt={effectCard.name} className={styles.effectIcon} />
            <div>
              <div className={styles.effectName}>{effectCard.name}</div>
              <div className={styles.effectDesc}>{effectCard.description}</div>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className={styles.gameOverlay}>
            <div className={styles.gameOverCard}>
              <div className={styles.resultEmoji}>
                {winner === 'player' ? '🏆' : winner === 'ai' ? '😅' : '🤝'}
              </div>
              <div className={styles.resultTitle}>
                {winner === 'player' ? 'You Win!'
                  : winner === 'ai' ? 'AI Wins!'
                  : "It's a Draw!"}
              </div>
              <div className={styles.finalScores}>
                <span>You: {playerScore}</span>
                <span>AI: {aiScore}</span>
              </div>
              <button className={styles.playAgainBtn} onClick={onBack}>
                Play Again
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Audio controls — outside gameInner so they stay top-left of full screen */}
      <div className={styles.audioControls}>
        <button
          className={`${styles.audioBtn} ${!musicOn ? styles.audioBtnOff : ''}`}
          onClick={onToggleMusic}
          aria-label={musicOn ? 'Mute music' : 'Unmute music'}
          title={musicOn ? 'Music on' : 'Music off'}
        >
          🎵
        </button>
        <button
          className={`${styles.audioBtn} ${!sfxOn ? styles.audioBtnOff : ''}`}
          onClick={onToggleSfx}
          aria-label={sfxOn ? 'Mute sound effects' : 'Unmute sound effects'}
          title={sfxOn ? 'Sound on' : 'Sound off'}
        >
          🔊
        </button>
      </div>

      {/* Back button — outside gameInner so it stays top-right of full screen */}
      <button className={styles.backBtn} onClick={onBack}>✕</button>
    </div>
  )
}
