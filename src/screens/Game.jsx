import { useEffect, useRef, useCallback, useState } from 'react'
import { useGame } from '../hooks/useGame'
import Card from '../components/Card'
import styles from './Game.module.css'
import { SPECIAL_CARDS, SPECIAL_POOL } from '../data/specialCards'
import { getDeckBackImage, DECKS } from '../data/decks'
import Interstitial from '../components/Interstitial'

// ── Joker daily pool helpers ───────────────────────────────────────────────────
function todayKey() { return new Date().toISOString().slice(0, 10) }

function getOwnedPaidCount() {
  const owned = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
  return DECKS.filter(d => !d.free && owned.includes(d.id)).length
}

function getJokersRemaining() {
  const pool = getOwnedPaidCount()
  if (pool === 0) return 0
  const stored = localStorage.getItem('fo_joker_date')
  if (stored !== todayKey()) {
    localStorage.setItem('fo_joker_date', todayKey())
    localStorage.setItem('fo_jokers', String(pool))
    return pool
  }
  return Math.min(pool, parseInt(localStorage.getItem('fo_jokers') || '0'))
}

function spendJoker() {
  const n = Math.max(0, getJokersRemaining() - 1)
  localStorage.setItem('fo_jokers', String(n))
  return n
}

const COLS = 4
const STAGE_COUNT = 4
const CONTESTANT_COUNT = 4

function randomStage() { return Math.floor(Math.random() * STAGE_COUNT) + 1 }
function randomContestant(exclude) {
  let pick
  do { pick = Math.floor(Math.random() * CONTESTANT_COUNT) + 1 } while (pick === exclude)
  return pick
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// Generate all random values for a special card effect (MP: active player sends to server)
function generateSpecialSeed(specialType, index, cards, matched, consumed) {
  function shuffleArr(arr) {
    const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a
  }
  switch (specialType) {
    case 'dice':
      return { die1: Math.ceil(Math.random() * 6), die2: Math.ceil(Math.random() * 6) }
    case 'flashlight': {
      const pool = cards.map((_, i) => i).filter(i => !matched.includes(i) && !consumed.includes(i) && i !== index)
      return { picks: shuffleArr(pool).slice(0, 3) }
    }
    case 'random': {
      const options = ['freeze','boom','tornado','magnet','bolt','rocket','dice','shield','stopwatch','crown','flashlight','shuffle','xray']
      const chosen  = options[Math.floor(Math.random() * options.length)]
      return { chosen, innerSeed: generateSpecialSeed(chosen, index, cards, matched, consumed) }
    }
    case 'shuffle': {
      const unmatched = cards.map((_, i) => i).filter(i => !matched.includes(i) && !consumed.includes(i))
      function arr(a) { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
      return { positions: arr(unmatched) }
    }
    case 'rocket':
      return { useRow: Math.random() < 0.5 }
    default:
      return {}
  }
}

const DEV_SPECIALS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('specials')

export default function Game({ deck, portrait = 1, onBack, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty = 'Medium', mode = 'vs', prebuiltCards = null, mpState = null, yourTurn = true, opponentImage, opponentDefeatedImage, opponentName, opponentModel, opponentBio, onResult, gauntletStep }) {
  const { state, flipCard, aiFlip, hideFlipped, clearEffect, clearFrozen, teachAI, getAIMove, applyPendingSpecial, commitResolve, useJoker } = useGame(deck, difficulty, prebuiltCards, mode === 'mp' ? (yourTurn ? 'player' : 'ai') : 'player')
  const [jokersRemaining, setJokersRemaining] = useState(() => getJokersRemaining())
  const stageRef   = useRef(randomStage())
  const aiContRef  = useRef(randomContestant(portrait))
  const aiTimerRef = useRef(null)
  const [spinning, setSpinning] = useState(false)
  const [cinematicDismissed, setCinematicDismissed] = useState(false)
  const [portraitFlipped, setPortraitFlipped] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const pendingAction = useRef(null)

  // Solo mode timer
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const timerStarted = useRef(false)
  const timerIntervalRef = useRef(null)
  const [soloFinalTime, setSoloFinalTime] = useState(0)
  const [soloNewBest, setSoloNewBest] = useState(false)
  const [soloLevel, setSoloLevel] = useState(0)
  const [soloPrevBest, setSoloPrevBest] = useState(0)

  const {
    cards, flipped, matched, consumed, frozen,
    playerScore, aiScore, turn, stunned,
    playerShield, aiShield, crownHolder,
    activeEffect, pendingSpecial, pendingResolve, gameOver, winner,
  } = state

  const prevTurnRef = useRef(turn)

  // When cinematic is dismissed, fire the result callback
  useEffect(() => {
    if (cinematicDismissed && onResult) onResult(winner)
  }, [cinematicDismissed])

  // Flip portrait to defeated version halfway through the spin
  useEffect(() => {
    if (gameOver && winner === 'player' && onResult && opponentDefeatedImage) {
      const t = setTimeout(() => setPortraitFlipped(true), 600) // halfway through 1.2s spin
      return () => clearTimeout(t)
    }
  }, [gameOver, winner, onResult, opponentDefeatedImage])

  // Spin both portraits on turn change
  useEffect(() => {
    if (prevTurnRef.current !== turn) {
      prevTurnRef.current = turn
      setSpinning(true)
      const t = setTimeout(() => setSpinning(false), 600)
      return () => clearTimeout(t)
    }
  }, [turn])

  // Teach AI about cards it can see
  useEffect(() => {
    flipped.forEach(i => teachAI(i, cards[i]))
  }, [flipped, cards, teachAI])

  // Solo timer — start on first flip
  useEffect(() => {
    if (mode !== 'solo' || timerStarted.current || gameOver || flipped.length === 0) return
    timerStarted.current = true
    timerIntervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
  }, [flipped, gameOver, mode])

  // Solo timer — stop on game over, save stats
  useEffect(() => {
    if (mode !== 'solo' || !gameOver) return
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null }
    const finalTime = elapsedRef.current
    setSoloFinalTime(finalTime)
    const bestKey = `fo_best_${deck.id}_${difficulty}`
    const stored = parseInt(localStorage.getItem(bestKey) || '0')
    setSoloPrevBest(stored)
    if (finalTime > 0 && (stored === 0 || finalTime < stored)) {
      localStorage.setItem(bestKey, String(finalTime))
      setSoloNewBest(true)
    }
    const levelKey = `fo_solo_level_${difficulty}`
    const lvl = parseInt(localStorage.getItem(levelKey) || '0') + 1
    localStorage.setItem(levelKey, String(lvl))
    setSoloLevel(lvl)
  }, [gameOver, mode]) // deck.id and difficulty are stable for the life of a game

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }, [])

  // ── Multiplayer: register opponent flip handler ────────────────────────────
  useEffect(() => {
    if (!mpState) return
    mpState.setOppFlipHandler((index) => {
      // Opponent flipped — apply as AI flip so local game state stays in sync
      aiFlip(index)
    })
  }, [mpState, aiFlip])

  // ── Multiplayer: register special result handler (seed arrives from server) ─
  useEffect(() => {
    if (!mpState) return
    mpState.setSpecialResultHandler(({ index, seed }) => {
      // Opponent's special card resolved — apply with their seed
      applyPendingSpecial(index, 'ai', seed)
    })
  }, [mpState, applyPendingSpecial])

  // ── Multiplayer: report flip to server when player flips ──────────────────
  // (handled inline in onClick — see card grid below)

  // ── Multiplayer: report turn result when resolve completes ────────────────
  const prevResolveRef = useRef(null)
  useEffect(() => {
    if (!mpState?.active || !pendingResolve) return
    prevResolveRef.current = pendingResolve
  }, [pendingResolve, mpState])

  useEffect(() => {
    if (!mpState?.active || !prevResolveRef.current) return
    if (activeEffect?.type === 'match' && activeEffect.data?.whose === 'player') {
      mpState.sendTurnResult(true)
      prevResolveRef.current = null
    } else if (activeEffect?.type === 'no_match' && prevResolveRef.current?.whose === 'player') {
      mpState.sendTurnResult(false)
      prevResolveRef.current = null
    }
  }, [activeEffect, mpState])

  // ── Multiplayer: game over relay ───────────────────────────────────────────
  useEffect(() => {
    if (!mpState?.active || !gameOver) return
    mpState.sendGameOver(playerScore, aiScore)
  }, [gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Multiplayer: opponent left — show game over overlay ───────────────────
  // The hook sets status='finished' + opponentLeft=true. We force winner='player'
  // by awarding a win locally (score-based winner already handled by game state;
  // if the game wasn't over yet we just show the overlay via opponentLeft flag).

  // Fire pending special after flip animation (380ms transition + brief pause)
  useEffect(() => {
    if (!pendingSpecial) return

    if (mode === 'mp' && pendingSpecial.whose === 'player') {
      // Player triggered a special — generate seed, send to opponent, then apply locally
      const seed = generateSpecialSeed(
        cards[pendingSpecial.index]?.specialType,
        pendingSpecial.index,
        cards,
        matched,
        consumed
      )
      mpState?.sendSpecialResult({ index: pendingSpecial.index, seed })
      const t = setTimeout(() => applyPendingSpecial(pendingSpecial.index, pendingSpecial.whose, seed), 600)
      return () => clearTimeout(t)
    }

    if (mode === 'mp' && pendingSpecial.whose === 'ai') {
      // Opponent's special — don't fire locally, wait for fo:special_result seed
      return
    }

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

  // Clear effect after display — long enough for players to read
  useEffect(() => {
    if (
      activeEffect &&
      activeEffect.type !== 'no_match' &&
      activeEffect.type !== 'flashlight' &&
      activeEffect.type !== 'stopwatch' &&
      activeEffect.type !== 'xray' &&
      activeEffect.type !== 'boom'
    ) {
      const t = setTimeout(clearEffect, 5000)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect])

  // Boom reveal — independent 2s timer, not tied to the banner
  useEffect(() => {
    if (activeEffect?.type === 'boom') {
      const t = setTimeout(clearEffect, 2000)
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
      if (mode === 'solo') {
        const t = setTimeout(() => hideFlipped(), 500)
        return () => clearTimeout(t)
      }
      if (mode === 'mp') {
        // Opponent controls their own turn — do nothing locally
        return
      }
      doAITurn()
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [turn, gameOver, activeEffect, doAITurn, mode, hideFlipped])

  // Magnet: when active and 1 card is flipped, auto-reveal its pair
  useEffect(() => {
    if (activeEffect?.type !== 'magnet' || flipped.length !== 1) return
    const idx = flipped[0]
    const firstCard = cards[idx]
    if (!firstCard || firstCard.type !== 'regular') return
    const pairIdx = cards.findIndex((c, i) =>
      c.type === 'regular' &&
      c.pairId === firstCard.pairId &&
      i !== idx &&
      !matched.includes(i) &&
      !consumed.includes(i)
    )
    if (pairIdx === -1) return
    const t = setTimeout(() => {
      if (turn === 'player') {
        flipCard(pairIdx)
        if (mode === 'mp') mpState?.sendFlip(pairIdx)
      } else {
        aiFlip(pairIdx)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [flipped, activeEffect]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleJoker() {
    if (jokersRemaining <= 0 || state.jokerUsed || flipped.length !== 1) return
    useJoker()
    setJokersRemaining(spendJoker())
  }

  // Award trophies + show interstitial before navigating away
  function addTrophies(count) {
    const cur = parseInt(localStorage.getItem('fo_trophies') || '0')
    localStorage.setItem('fo_trophies', String(cur + count))
  }

  function withInterstitial(cb) {
    if (localStorage.getItem('fo_no_ads')) { cb(); return }
    pendingAction.current = cb
    setShowInterstitial(true)
  }

  function handleInterstitialClose() {
    setShowInterstitial(false)
    pendingAction.current?.()
    pendingAction.current = null
  }

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


        {/* Gauntlet step indicator */}
        {gauntletStep !== undefined && (
          <div className={styles.gauntletBadge}>
            GAUNTLET · {gauntletStep + 1}/10
          </div>
        )}

        {/* Turn label */}
        <div className={styles.turnBar}>
          {mode !== 'solo' && <span className={`${styles.turnDot} ${turn === 'player' ? styles.active : ''}`} />}
          <div className={styles.turnLabel}>
            {gameOver
              ? (mode === 'solo' ? '✓ DONE!'
                : mpState?.opponentLeft ? '🏆 OPPONENT LEFT!'
                : winner === 'draw' ? '🤝 DRAW!'
                : winner === 'player' ? '🏆 YOU WIN!'
                : mode === 'mp' ? '😅 OPPONENT WINS!'
                : '😅 AI WINS!')
              : mode === 'solo' ? `⏱ ${formatTime(elapsed)}`
              : mode === 'mp' ? (turn === 'player' ? 'YOUR TURN' : "OPPONENT'S TURN")
              : turn === 'player' ? 'YOUR TURN' : "AI'S TURN"
            }
          </div>
          {mode !== 'solo' && <span className={`${styles.turnDot} ${turn === 'ai' ? styles.active : ''} ${difficulty === 'Lethal' && turn === 'ai' ? styles.lethalDot : ''}`} />}
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
              ${turn !== 'player' && mode !== 'solo' && mode !== 'mp' ? styles.aiTurn : ''}
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
                onClick={() => {
                  if (gameOver) return
                  if (pendingResolve || pendingSpecial || flipped.length >= 2) return
                  if (mode === 'solo' || turn === 'player') {
                    flipCard(i)
                    if (mode === 'mp') mpState?.sendFlip(i)
                  }
                }}
                backImage={getDeckBackImage(deck)}
                style={activeEffect?.type === 'flashlight' && isRevealed(i)
                  ? { filter: 'brightness(14)', position: 'relative', zIndex: 2 }
                  : undefined}
              />
            ))}
          </div>
        </div>

        {/* Joker button — appears when player has flipped one card */}
        {turn === 'player' && flipped.length === 1 && !state.jokerUsed && jokersRemaining > 0 && !gameOver && (
          <button className={styles.jokerBtn} onClick={handleJoker}>
            <img src="/images/jokers/1.png" alt="Joker" className={styles.jokerImg} />
            <span className={styles.jokerLabel}>USE JOKER</span>
            <span className={styles.jokerCount}>{jokersRemaining} left today</span>
          </button>
        )}

        {/* Portraits + scores */}
        <div className={styles.contestants}>
          <div className={styles.sidePanel}>
            <div className={`${styles.portraitWrap} ${turn !== 'player' ? styles.inactive : ''} ${spinning ? styles.spinning : ''}`}>
              <img src={`/images/a${portrait}.png`} alt="You" className={styles.portrait} />
            </div>
            <span className={styles.sideScore}>{playerScore}</span>
            <span className={`${styles.contLabel} ${styles.youLabel}`}>
              YOU{playerShield ? ' 🛡️' : ''}{crownHolder === 'player' ? ' 👑' : ''}
            </span>
          </div>
          <div className={styles.sidePanel}>
            <div className={`${styles.portraitWrap} ${turn !== 'ai' ? styles.inactive : ''} ${spinning ? styles.spinning : ''} ${difficulty === 'Lethal' && turn === 'ai' ? styles.lethalAiActive : ''}`}>
              <img
                src={mode === 'mp'
                  ? `/images/a${mpState?.opponentPortrait ?? 1}.png`
                  : opponentImage || `/images/a${aiContRef.current}.png`}
                alt={mode === 'mp' ? 'Opponent' : 'AI'}
                className={styles.portrait}
              />
            </div>
            <span className={styles.sideScore}>{aiScore}</span>
            <span className={`${styles.contLabel} ${styles.cpuLabel}`}>
              {mode === 'mp' ? 'OPPONENT' : 'CPU'}{aiShield ? ' 🛡️' : ''}{crownHolder === 'ai' ? ' 👑' : ''}
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
              {activeEffect.type === 'dice' ? (
                <div className={styles.effectDesc}>
                  {['⚀','⚁','⚂','⚃','⚄','⚅'][activeEffect.data.die1 - 1]}{' '}
                  {['⚀','⚁','⚂','⚃','⚄','⚅'][activeEffect.data.die2 - 1]}{' '}
                  {activeEffect.data.isDouble ? '🎉 DOUBLE — extra turn!' : 'No double — turn passes'}
                </div>
              ) : (
                <div className={styles.effectDesc}>{effectCard.description}</div>
              )}
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {(gameOver || mpState?.opponentLeft) && (
          <>
            {/* ── Gauntlet WIN cinematic ── */}
            {onResult && winner === 'player' && opponentImage && !cinematicDismissed ? (
              <div className={styles.cinematic}>

                {/* Portrait — spins to reveal defeated version */}
                <div className={styles.cinematicPortraitWrap}>
                  <img
                    src={portraitFlipped && opponentDefeatedImage ? opponentDefeatedImage : opponentImage}
                    alt=""
                    className={`${styles.cinematicPortrait} ${opponentDefeatedImage ? styles.cinematicPortraitSpin : ''}`}
                    draggable="false"
                  />
                  <div className={styles.cinematicScanLines} />
                  <div className={styles.cinematicGradient} />

                  {/* Fireworks */}
                  <div className={styles.fireworks} aria-hidden="true">
                    <div className={`${styles.fw} ${styles.fw1}`} />
                    <div className={`${styles.fw} ${styles.fw2}`} />
                    <div className={`${styles.fw} ${styles.fw3}`} />
                    <div className={`${styles.fw} ${styles.fw4}`} />
                    <div className={`${styles.fw} ${styles.fw5}`} />
                    <div className={`${styles.fw} ${styles.fw6}`} />
                  </div>

                  {/* HUD corners */}
                  <div className={`${styles.hudCorner} ${styles.hudTL}`} />
                  <div className={`${styles.hudCorner} ${styles.hudTR}`} />
                  <div className={`${styles.hudCorner} ${styles.hudBL}`} />
                  <div className={`${styles.hudCorner} ${styles.hudBR}`} />

                  {/* Target lock label */}
                  <div className={styles.targetLabel}>■ TARGET ELIMINATED</div>

                  {/* Red X stamp */}
                  <div className={styles.cinematicX}>✕</div>
                </div>

                {/* Robot info card */}
                <div className={styles.robotInfoCard}>

                  {/* Status bar */}
                  <div className={styles.statusBar}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusText}>UNIT OFFLINE</span>
                    <span className={styles.statusSpacer} />
                    <span className={styles.statusCode}>ERR_MATCH_LOST</span>
                  </div>

                  {/* Name + model */}
                  <div className={styles.robotInfoTop}>
                    <div className={styles.robotName}>{opponentName || 'UNKNOWN'}</div>
                    <div className={styles.robotModel}>{opponentModel || ''}</div>
                  </div>

                  {/* Bio */}
                  <div className={styles.robotBioWrap}>
                    <div className={styles.robotBioHeader}>// UNIT PROFILE</div>
                    <p className={styles.robotBio}>{opponentBio || ''}</p>
                  </div>

                  {/* Data readouts */}
                  <div className={styles.dataGrid}>
                    <div className={styles.dataCell}>
                      <span className={styles.dataLabel}>THREAT LVL</span>
                      <span className={styles.dataValue}>NEUTRALISED</span>
                    </div>
                    <div className={styles.dataCell}>
                      <span className={styles.dataLabel}>STATUS</span>
                      <span className={styles.dataValue}>DECOMMISSIONED</span>
                    </div>
                  </div>

                  <button className={styles.cinematicNextBtn} onClick={() => withInterstitial(() => { addTrophies(10); setCinematicDismissed(true) })}>
                    <span className={styles.nextBtnArrow}>▶</span> CONTINUE
                  </button>
                </div>

              </div>

            ) : mode === 'solo' ? (
              /* ── Solo mode result ── */
              <div className={styles.gameOverlay}>
                <div className={styles.gameOverCard}>
                  <div className={styles.resultEmoji}>⏱️</div>
                  <div className={styles.resultTitle}>COMPLETED!</div>
                  <div className={styles.soloTime}>{formatTime(soloFinalTime)}</div>
                  {soloNewBest && <div className={styles.newBestBadge}>🏆 NEW BEST!</div>}
                  <div className={styles.soloMeta}>
                    {soloPrevBest > 0
                      ? `${soloNewBest ? 'Previous' : 'Best'}: ${formatTime(soloPrevBest)}`
                      : 'First time!'}
                  </div>
                  <div className={styles.soloMeta}>Level {soloLevel} · {difficulty}</div>
                  <button className={styles.playAgainBtn} onClick={() => withInterstitial(onBack)}>Play Again</button>
                </div>
              </div>
            ) : mode === 'mp' ? (
              /* ── Multiplayer game over ── */
              <div className={styles.gameOverlay}>
                <div className={styles.gameOverCard}>
                  <div className={styles.resultEmoji}>
                    {mpState?.opponentLeft ? '🚪'
                      : winner === 'player' ? '🏆'
                      : winner === 'ai' ? '😅'
                      : '🤝'}
                  </div>
                  <div className={styles.resultTitle}>
                    {mpState?.opponentLeft ? 'Opponent Left'
                      : winner === 'player' ? 'You Win!'
                      : winner === 'ai' ? 'Opponent Wins!'
                      : "It's a Draw!"}
                  </div>
                  <div className={styles.finalScores}>
                    <span>You: {playerScore}</span>
                    <span>Opp: {aiScore}</span>
                  </div>
                  <button className={styles.playAgainBtn} onClick={() => withInterstitial(onBack)}>BACK TO MENU</button>
                </div>
              </div>
            ) : (
              /* ── Standard game over card (loss / draw / non-gauntlet) ── */
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
                  <button
                    className={styles.playAgainBtn}
                    onClick={() => withInterstitial(() => {
                      if (winner === 'player') addTrophies(onResult ? 10 : 5)
                      else addTrophies(1)
                      if (onResult) onResult(winner); else onBack()
                    })}
                  >
                    {onResult
                      ? winner === 'player' ? 'NEXT →' : 'GAME OVER! Try again?'
                      : 'Play Again'}
                  </button>
                </div>
              </div>
            )}
          </>
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
      <button className={styles.backBtn} onClick={() => onResult && !gameOver ? setShowQuitModal(true) : onBack()}>✕</button>

      {/* Interstitial ad — shown when navigating away from game-over */}
      {showInterstitial && <Interstitial onClose={handleInterstitialClose} />}

      {/* Dev special-card toolbar — visible when ?specials is in URL */}
      {DEV_SPECIALS && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', padding:'6px 8px', background:'rgba(0,0,0,0.75)', justifyContent:'center', position:'relative', zIndex:50 }}>
          {SPECIAL_POOL.map(type => (
            <button
              key={type}
              title={type}
              onClick={() => applyPendingSpecial(0, 'player', generateSpecialSeed(type, 0, cards, matched, consumed))}
              style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'3px', cursor:'pointer' }}
            >
              <img src={`/images/cards/special/${type}.png`} alt={type} style={{ width:'32px', height:'32px', objectFit:'contain', display:'block' }} />
            </button>
          ))}
        </div>
      )}

      {/* Quit confirmation modal — gauntlet only */}
      {showQuitModal && (
        <div className={styles.quitOverlay}>
          <div className={styles.quitModal}>
            <div className={styles.quitIcon}>⚠️</div>
            <div className={styles.quitTitle}>QUIT GAUNTLET?</div>
            <div className={styles.quitBody}>Leaving now counts as a loss — your gauntlet progress will reset to Round 1.</div>
            <div className={styles.quitBtns}>
              <button className={styles.quitStayBtn} onClick={() => setShowQuitModal(false)}>KEEP PLAYING</button>
              <button className={styles.quitLeaveBtn} onClick={() => { setShowQuitModal(false); onResult('ai') }}>QUIT & LOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
