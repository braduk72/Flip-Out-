import { useEffect, useRef, useCallback, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { useSfx, playFile } from '../hooks/useSfx'
import Card from '../components/Card'
import styles from './Game.module.css'
import { SPECIAL_CARDS, SPECIAL_POOL } from '../data/specialCards'
import { getDeckBackImage, DECKS } from '../data/decks'
import { createTransactionId, economy } from '../utils/economyService.js'
import { Modal } from '../ui/components.jsx'

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
    economy.applyTransaction({
      id: `joker-pool:${todayKey()}`,
      source: 'joker-pool',
      changes: { flags: { fo_joker_date: todayKey(), fo_jokers: pool } },
    })
    return pool
  }
  return Math.min(pool, parseInt(localStorage.getItem('fo_jokers') || '0'))
}

function spendJoker(transactionId) {
  const result = economy.applyTransaction({
    id: transactionId,
    source: 'joker-use',
    changes: { counters: { jokers: -1 } },
  })
  return result.applied ? getJokersRemaining() : null
}

const CONTESTANT_COUNT = 4

const SFX_ROBOT_COUNTDOWN = '/sounds/used/robot_countdown.mp3'
const SFX_HEARTBEAT       = '/sounds/used/countdown-heartbeat.mp3'


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
      const options = ['freeze','boom','tornado','magnet','bolt','rocket','dice','shield','stopwatch','crown','shuffle','xray']
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

export default function Game({ deck, portrait = 1, onBack, musicOn, sfxOn, onToggleMusic, onToggleSfx, difficulty = 'Medium', mode = 'vs', prebuiltCards = null, mpState = null, yourTurn = true, opponentImage, opponentDefeatedImage, opponentName, opponentModel, opponentBio, onResult, onQuit, onPlayerLost, onPlayerWon, onRetry, canRetry = false, gauntletStep, streakMode = false, currentStreak = 0, bestStreak = 0, onStreakWin, onStreakContinue, onStreakGiveUp, streakContinueUsed = false }) {
  const economySessionId = useRef(createTransactionId('game')).current
  const { state, flipCard, aiFlip, hideFlipped, clearEffect, clearFrozen, teachAI, getAIMove, applyPendingSpecial, triggerDevSpecial, commitResolve, endStopwatch, useJoker: activateJoker, forceGameOver } = useGame(deck, difficulty, prebuiltCards, mode === 'mp' ? (yourTurn ? 'player' : 'ai') : 'player', mode === 'solo')
  // Dev toolbar — only exists in Preview (dev branch) builds.
  // Set VITE_DEV_TOOLS=true in Vercel → Preview env vars; leave it unset for Production.
  const devEnabled  = import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true'
  const devSpecials = devEnabled && new URLSearchParams(window.location.search).has('specials')
  const [devToolsOpen, setDevToolsOpen] = useState(() => devEnabled && (devSpecials || localStorage.getItem('fo_dev_toolbar') === 'on'))
  const [jokersRemaining, setJokersRemaining] = useState(() => getJokersRemaining())
  const aiContRef  = useRef(randomContestant(portrait))
  const aiTimerRef = useRef(null)
  const consecutiveAITurnRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [cinematicDismissed, setCinematicDismissed] = useState(false)
  const [portraitFlipped, setPortraitFlipped] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const soloFrozenReadyToClear = useRef(false)
  const [xrayPeeked, setXrayPeeked] = useState([])
  const [swSecsLeft, setSwSecsLeft] = useState(null)
  const swRafRef     = useRef(null)
  const heartbeatRef        = useRef(null)
  const robotSoundTimeout   = useRef(null)
  const [shuffleAnimating, setShuffleAnimating] = useState(false)
  const [tornadoStep, setTornadoStep] = useState(-1)
  const [rocketStep, setRocketStep] = useState(-1)
  const snakeOrderRef = useRef([])
  const [diceDisplay, setDiceDisplay] = useState([1, 1])
  const [diceRevealed, setDiceRevealed] = useState(false)
  const [tieBreakers, setTieBreakers] = useState(() => parseInt(localStorage.getItem('fo_tiebreakers') || '0', 10))
  const [coinFlipPhase, setCoinFlipPhase] = useState(null) // null | 'spinning' | 'result'
  const [coinWon, setCoinWon] = useState(null)

  // Local (pass-and-play) mode
  const [passDevice, setPassDevice]     = useState(null) // null | 1 | 2
  const localPrevTurnRef                = useRef(null)
  const pendingPassRef                  = useRef(null)

  // Turn timer (VS / MP only — not solo)
  const turnTimerRef      = useRef(null)
  const turnCountdownRef  = useRef(null)
  const [turnSecsLeft, setTurnSecsLeft] = useState(null)
  // Second-flip timeout — fires when player stalls after flipping one card (e.g. target is frozen)
  const secondFlipTimerRef = useRef(null)
  const secondFlipCountRef = useRef(null)
  const [showEasyWin, setShowEasyWin] = useState(false)
  const [showEasyLose, setShowEasyLose] = useState(false)
  const easyWinShown = useRef(false)
  const easyLoseShown = useRef(false)

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
    activeEffect, pendingSpecial, pendingResolve, stopwatchEnd, gameOver, winner,
  } = state

  const { play, stopAll } = useSfx(sfxOn)

  // ── Heartbeat helpers (Stopwatch only) ───────────────────────────────────
  function startHeartbeat() {
    stopHeartbeat()
    if (!sfxOn) return
    const a = new Audio(SFX_HEARTBEAT)
    a.loop   = true
    a.volume = 0.5
    a.play().catch(() => {})
    heartbeatRef.current = a
  }

  function stopHeartbeat() {
    if (heartbeatRef.current) {
      try { heartbeatRef.current.pause(); heartbeatRef.current.src = '' } catch {
        // Heartbeat audio cleanup is best-effort.
      }
      heartbeatRef.current = null
    }
  }

  // Stopwatch heartbeat — runs only while the Stopwatch special card is active
  useEffect(() => {
    if (stopwatchEnd && Date.now() < stopwatchEnd) {
      startHeartbeat()
    } else {
      stopHeartbeat()
    }
    return () => stopHeartbeat()
  }, [stopwatchEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stop all SFX immediately when leaving the game screen
  useEffect(() => () => { stopAll(); stopHeartbeat(); clearTimeout(robotSoundTimeout.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dev: ?gameover=1 instantly triggers the game-over screen
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('gameover')) {
      forceGameOver('player')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sound effects ─────────────────────────────────────────────────────────
  // Card flip — fires whenever a card is added to the flipped array
  const prevFlippedLen = useRef(0)
  useEffect(() => {
    if (flipped.length > prevFlippedLen.current) play('flip')
    prevFlippedLen.current = flipped.length
  }, [flipped.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Match / no-match / special card sounds
  const prevEffectType = useRef(null)
  useEffect(() => {
    if (!activeEffect || activeEffect.type === prevEffectType.current) return
    prevEffectType.current = activeEffect.type
    if      (activeEffect.type === 'match')       play('match')
    else if (activeEffect.type === 'no_match')    play('nomatch')
    else if (activeEffect.type === 'shuffle')     play('shuffle')
    else if (activeEffect.type === 'dice')        play('dice_roll')
    else                                           play('special')
    if (activeEffect.type === 'tiebreaker' && activeEffect.data?.whose === 'player') {
      economy.applyTransaction({
        id: `${economySessionId}:tiebreaker:${activeEffect.data.index}`,
        source: 'tiebreaker-card',
        changes: { counters: { tiebreakers: 1 } },
      })
      const timer = setTimeout(() => setTieBreakers(economy.getCounter('tiebreakers')), 0)
      return () => clearTimeout(timer)
    }
  }, [activeEffect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Game over fanfare
  const gameOverSoundFired = useRef(false)
  useEffect(() => {
    if (!gameOver || gameOverSoundFired.current) return
    gameOverSoundFired.current = true
    if (winner === 'player') play('win')
    else if (winner === 'ai') { play('lose'); onPlayerLost?.() }
  }, [gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevTurnRef = useRef(turn)

  // When cinematic is dismissed, fire the result callback
  useEffect(() => {
    if (cinematicDismissed && onResult) onResult(winner)
  }, [cinematicDismissed, winner, onResult])

  // Flip portrait to defeated version halfway through the spin
  useEffect(() => {
    if (gameOver && winner === 'player' && onResult && opponentDefeatedImage) {
      const t = setTimeout(() => setPortraitFlipped(true), 600) // halfway through 1.2s spin
      return () => clearTimeout(t)
    }
  }, [gameOver, winner, onResult, opponentDefeatedImage])

  // Reset consecutive-turn counter on every turn change
  useEffect(() => { consecutiveAITurnRef.current = 0 }, [turn])

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

  // Local mode: note when turn changes (but don't show overlay yet — cards may still be face-up)
  useEffect(() => {
    if (mode !== 'local' || gameOver) { localPrevTurnRef.current = turn; return }
    if (localPrevTurnRef.current !== null && localPrevTurnRef.current !== turn) {
      pendingPassRef.current = turn === 'player' ? 1 : 2
    }
    localPrevTurnRef.current = turn
  }, [turn, mode, gameOver])

  // Local mode: show pass overlay once all cards are face-down AND no special is mid-flight
  useEffect(() => {
    if (mode !== 'local' || gameOver || flipped.length > 0 || pendingSpecial || activeEffect) return
    if (pendingPassRef.current !== null) {
      setPassDevice(pendingPassRef.current)
      pendingPassRef.current = null
    }
  }, [flipped.length, mode, gameOver, pendingSpecial, activeEffect])

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

  // Fire STOPWATCH_END when the 10-second window expires
  useEffect(() => {
    if (!stopwatchEnd) return
    const remaining = stopwatchEnd - Date.now()
    if (remaining <= 0) { endStopwatch(); return }
    const t = setTimeout(endStopwatch, remaining)
    return () => clearTimeout(t)
  }, [stopwatchEnd, endStopwatch])

  // Stopwatch countdown display — rAF loop updates secsLeft each frame
  useEffect(() => {
    if (!stopwatchEnd) { setSwSecsLeft(null); cancelAnimationFrame(swRafRef.current); return }
    function tick() {
      const rem = stopwatchEnd - Date.now()
      if (rem <= 0) { setSwSecsLeft(null); return }
      setSwSecsLeft(Math.ceil(rem / 1000))
      swRafRef.current = requestAnimationFrame(tick)
    }
    swRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(swRafRef.current)
  }, [stopwatchEnd])

  // ── 10-second turn timer (VS / MP only) ──────────────────────────────────
  // After 5 s of inactivity on the player's turn, show a 5→0 red countdown.
  // At 0 s hideFlipped() is called automatically.
  useEffect(() => {
    clearTimeout(turnTimerRef.current)
    clearInterval(turnCountdownRef.current)
    setTurnSecsLeft(null)

    if (mode === 'solo' || mode === 'local' || gameOver || (stopwatchEnd && Date.now() < stopwatchEnd) || turn !== 'player') return

    turnTimerRef.current = setTimeout(() => {
      setTurnSecsLeft(5)
      if (sfxOn) { playFile(SFX_ROBOT_COUNTDOWN) }
      let n = 5
      turnCountdownRef.current = setInterval(() => {
        n -= 1
        if (n > 0) {
          setTurnSecsLeft(n)
        } else {
          clearInterval(turnCountdownRef.current)
          setTurnSecsLeft(null)
          hideFlipped()
        }
      }, 1000)
    }, 10000)

    return () => {
      clearTimeout(turnTimerRef.current)
      clearInterval(turnCountdownRef.current)
    }
  }, [turn, gameOver, stopwatchEnd, mode, matched.length]) // eslint-disable-line react-hooks/exhaustive-deps
  // matched.length added so the timer restarts after any match (player keeps playing after a match)

  // Cancel turn timer as soon as the player flips their first card
  useEffect(() => {
    if (pendingResolve || flipped.length >= 1) {
      clearTimeout(turnTimerRef.current)
      clearInterval(turnCountdownRef.current)
      setTurnSecsLeft(null)
    }
  }, [pendingResolve, flipped.length])

  // Second-flip timeout — if one card is flipped and the player stalls on the second
  // (e.g. the card they wanted is frozen), auto-hide after 15 s with a 5 s warning.
  // This runs on each player's own device, so it covers the opponent's turn in MP too.
  useEffect(() => {
    clearTimeout(secondFlipTimerRef.current)
    clearInterval(secondFlipCountRef.current)

    if (
      mode === 'solo' || mode === 'local' || gameOver ||
      turn !== 'player' || flipped.length !== 1 ||
      pendingResolve || (stopwatchEnd && Date.now() < stopwatchEnd)
    ) return

    secondFlipTimerRef.current = setTimeout(() => {
      setTurnSecsLeft(5)
      if (sfxOn) { playFile(SFX_ROBOT_COUNTDOWN) }
      let n = 5
      secondFlipCountRef.current = setInterval(() => {
        n -= 1
        if (n > 0) {
          setTurnSecsLeft(n)
        } else {
          clearInterval(secondFlipCountRef.current)
          setTurnSecsLeft(null)
          hideFlipped()
        }
      }, 1000)
    }, 10000)

    return () => {
      clearTimeout(secondFlipTimerRef.current)
      clearInterval(secondFlipCountRef.current)
    }
  }, [turn, flipped.length, gameOver, mode, pendingResolve, stopwatchEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-skip player's turn when stunned by a bolt
  useEffect(() => {
    if (turn !== 'player' || stunned !== 'player' || gameOver) return
    const t = setTimeout(() => hideFlipped(), 1800)
    return () => clearTimeout(t)
  }, [turn, stunned, gameOver, hideFlipped])

  // Local mode: auto-skip stunned Player 2
  useEffect(() => {
    if (mode !== 'local' || turn !== 'ai' || stunned !== 'ai' || gameOver) return
    const t = setTimeout(() => hideFlipped(), 1800)
    return () => clearTimeout(t)
  }, [turn, stunned, gameOver, mode, hideFlipped])

  // Local mode: 15-second inactivity timer (resets on each flip and turn change)
  const localTimerRef = useRef(null)
  const localCountRef = useRef(null)
  useEffect(() => {
    clearTimeout(localTimerRef.current)
    clearInterval(localCountRef.current)
    setTurnSecsLeft(null)
    if (mode !== 'local' || gameOver || passDevice) return
    localTimerRef.current = setTimeout(() => {
      setTurnSecsLeft(5)
      if (sfxOn) { playFile(SFX_ROBOT_COUNTDOWN) }
      let n = 5
      localCountRef.current = setInterval(() => {
        n--
        if (n > 0) { setTurnSecsLeft(n) } else {
          clearInterval(localCountRef.current)
          setTurnSecsLeft(null)
          hideFlipped()
        }
      }, 1000)
    }, 10000)
    return () => { clearTimeout(localTimerRef.current); clearInterval(localCountRef.current) }
  }, [turn, mode, gameOver, passDevice, matched.length, flipped.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopwatchActive = stopwatchEnd && Date.now() < stopwatchEnd

  // Resolve match/no-match — instant during PLAYER stopwatch, fast in solo, normal in vs/mp
  useEffect(() => {
    if (!pendingResolve) return
    const playerStopwatch = stopwatchActive && pendingResolve.whose === 'player'
    const delay = playerStopwatch ? 50 : mode === 'solo' ? 300 : 950
    const t = setTimeout(() => commitResolve(pendingResolve.whose), delay)
    return () => clearTimeout(t)
  }, [pendingResolve, commitResolve, stopwatchEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle no-match — hide cards after delay; solo is faster and skippable by tap
  // During stopwatch: no-match should never fire (we only call resolveFlip on actual matches),
  // but if it somehow does, just clear the effect and keep cards revealed.
  useEffect(() => {
    if (activeEffect?.type === 'no_match') {
      const playerStopwatch = stopwatchActive && activeEffect.data?.whose === 'player'
      if (playerStopwatch) { clearEffect(); return }
      const delay = mode === 'solo' ? 500 : 1800
      const t = setTimeout(() => { hideFlipped(); clearEffect() }, delay)
      return () => clearTimeout(t)
    }
  }, [activeEffect, hideFlipped, clearEffect, stopwatchEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear effect after display — long enough for players to read
  // During stopwatch: clear match banner fast so the player can keep flipping
  useEffect(() => {
    if (
      activeEffect &&
      activeEffect.type !== 'no_match' &&
      activeEffect.type !== 'stopwatch' &&
      activeEffect.type !== 'xray' &&
      activeEffect.type !== 'boom' &&
      activeEffect.type !== 'tornado' &&
      activeEffect.type !== 'rocket' &&
      activeEffect.type !== 'shuffle'
    ) {
      const swNow = stopwatchEnd && Date.now() < stopwatchEnd
      const t = setTimeout(clearEffect, swNow ? 700 : 5000)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Boom reveal — independent 2s timer, not tied to the banner
  useEffect(() => {
    if (activeEffect?.type === 'boom') {
      const t = setTimeout(clearEffect, 2000)
      return () => clearTimeout(t)
    }
  }, [activeEffect, clearEffect])

  // Tornado — snake sweep one card at a time (row 0 L→R, row 1 R→L, etc.)
  useEffect(() => {
    if (activeEffect?.type !== 'tornado') { setTornadoStep(-1); return }
    const numRows = Math.ceil(cards.length / 4)
    const snakeOrder = []
    for (let r = 0; r < numRows; r++) {
      const row = Array.from({ length: 4 }, (_, c) => r * 4 + c).filter(i => i < cards.length)
      if (r % 2 === 1) row.reverse()
      snakeOrder.push(...row)
    }
    snakeOrderRef.current = snakeOrder
    const timers = []
    for (let s = 0; s < snakeOrder.length; s++) {
      timers.push(setTimeout(() => setTornadoStep(s), 50 + s * 100))
    }
    const total = 50 + snakeOrder.length * 100
    timers.push(setTimeout(() => { clearEffect(); setTornadoStep(-1) }, total + 500))
    return () => timers.forEach(clearTimeout)
  }, [activeEffect?.type, clearEffect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Rocket — step through line one card at a time as rocket flies past
  useEffect(() => {
    if (activeEffect?.type !== 'rocket') { setRocketStep(-1); return }
    const { line } = activeEffect.data
    const timers = []
    for (let s = 0; s < line.length; s++) {
      timers.push(setTimeout(() => setRocketStep(s), s * 200))
    }
    timers.push(setTimeout(() => { clearEffect(); setRocketStep(-1) }, line.length * 200 + 400))
    return () => timers.forEach(clearTimeout)
  }, [activeEffect?.type, clearEffect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Dice — roll animation then reveal final values
  useEffect(() => {
    if (activeEffect?.type !== 'dice') { setDiceRevealed(false); return }
    const { die1, die2 } = activeEffect.data
    setDiceRevealed(false)
    // Build timing schedule: fast → slow
    const delays = [
      ...Array(10).fill(60),
      ...Array(6).fill(100),
      ...Array(3).fill(160),
      ...Array(2).fill(230),
    ]
    let elapsed = 0
    const timers = delays.map(d => {
      elapsed += d
      return setTimeout(() => setDiceDisplay([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]), elapsed)
    })
    const revealTimer = setTimeout(() => {
      setDiceDisplay([die1, die2])
      setDiceRevealed(true)
    }, elapsed + 280)
    return () => { timers.forEach(clearTimeout); clearTimeout(revealTimer) }
  }, [activeEffect?.type]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear frozen — player gets one full turn with frozen cards, then clear when turn returns to AI
  useEffect(() => {
    if (frozen.length === 0) { soloFrozenReadyToClear.current = false; return }
    if (turn !== 'player') return
    if (!soloFrozenReadyToClear.current) {
      // Player's turn just arrived with frozen cards — flag to clear after they've played it
      soloFrozenReadyToClear.current = true
      return
    }
    // Player matched and kept their turn — frozen cards have done their job, clear now
    const t = setTimeout(() => { clearFrozen(); clearEffect(); soloFrozenReadyToClear.current = false }, 200)
    return () => clearTimeout(t)
  }, [turn, frozen, clearFrozen, clearEffect])

  // Clear frozen when player's frozen turn ends (turn flips to AI) — all modes
  useEffect(() => {
    if (!soloFrozenReadyToClear.current || frozen.length === 0) return
    if (turn === 'ai') {
      soloFrozenReadyToClear.current = false
      clearFrozen()
      clearEffect()
    }
  }, [turn, frozen, clearFrozen, clearEffect])

  // AI turn logic — kept in a ref so the trigger effect below doesn't re-fire
  // mid-turn when state (flipped, cards, etc.) changes between move1 and move2.
  const aiTurnStateRef = useRef({ state, cards, flipped, matched, consumed, frozen })
  useEffect(() => {
    aiTurnStateRef.current = { state, cards, flipped, matched, consumed, frozen }
  })

  const doAITurn = useCallback((duringStopwatch = false) => {
    const { state, flipped } = aiTurnStateRef.current
    if (state.turn !== 'ai' || state.gameOver) return
    // Guard: if cards are already mid-flip, don't start a new sequence
    if (flipped.length > 0) return

    // If AI is stunned, skip turn
    if (state.stunned === 'ai') {
      setTimeout(() => hideFlipped(), 800)
      return
    }

    const isConsecutive = consecutiveAITurnRef.current > 0
    consecutiveAITurnRef.current++
    // During stopwatch: AI clicks much faster to take advantage of the 10s window
    const delay1 = duringStopwatch
      ? 80 + Math.random() * 100
      : isConsecutive ? 400 + Math.random() * 300 : 1200 + Math.random() * 800
    aiTimerRef.current = setTimeout(() => {
      const { cards, flipped, matched, consumed, frozen } = aiTurnStateRef.current
      const move1 = getAIMove(cards, flipped, matched, consumed, frozen)
      if (move1 === null) return
      aiFlip(move1)

      // Second flip — fast during stopwatch, normal otherwise
      const delay2 = duringStopwatch ? 200 + Math.random() * 200 : 1500 + Math.random() * 800
      aiTimerRef.current = setTimeout(() => {
        const { cards, matched, consumed, frozen } = aiTurnStateRef.current
        const move2 = getAIMove(cards, [move1], matched, consumed, frozen)
        if (move2 === null) return
        aiFlip(move2)
      }, delay2)
    }, delay1)
  }, [aiFlip, hideFlipped, getAIMove]) // stable deps only — reads live state via ref

  const doAITurnRef = useRef(doAITurn)
  useEffect(() => { doAITurnRef.current = doAITurn }, [doAITurn])

  useEffect(() => {
    // In solo, also pass the turn back during freeze so cards don't lock up for 5s
    const soloFreeze = mode === 'solo' && turn === 'ai' && !gameOver && activeEffect?.type === 'freeze'
    // Stopwatch: excluded from the general 5s clearEffect, so needs its own trigger.
    // When AI plays stopwatch, keep calling doAITurn so it actually benefits from the window.
    const stopwatchAI = turn === 'ai' && !gameOver && activeEffect?.type === 'stopwatch'
    if ((turn === 'ai' && !gameOver && !activeEffect) || soloFreeze || stopwatchAI) {
      if (mode === 'solo') {
        const t = setTimeout(() => hideFlipped(), soloFreeze ? 1200 : 500)
        return () => clearTimeout(t)
      }
      if (mode === 'mp') {
        // Opponent controls their own turn — do nothing locally
        return
      }
      if (mode === 'local') {
        // Player 2 is human — they control the board themselves
        return
      }
      doAITurnRef.current(stopwatchAI)
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [turn, gameOver, activeEffect, mode, hideFlipped]) // doAITurn removed — prevents mid-turn re-fires

  // Magnet + AI: when magnet fires on AI's turn, flip one card so the pair-reveal effect can run.
  // The main AI turn effect doesn't fire while an activeEffect is set, and its cleanup would have
  // already cancelled the queued second-flip timer, so we handle this case separately.
  useEffect(() => {
    if (activeEffect?.type !== 'magnet' || turn !== 'ai' || flipped.length !== 0 || gameOver) return
    if (mode === 'mp' || mode === 'local') return
    const t = setTimeout(() => {
      const { cards, matched, consumed, frozen } = aiTurnStateRef.current
      const move = getAIMove(cards, [], matched, consumed, frozen)
      if (move !== null) aiFlip(move)
    }, 1200)
    return () => clearTimeout(t)
  }, [activeEffect, turn, flipped.length, gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // X-ray — peek mode: player taps up to 2 cards to sneak a look, then takes their turn
  useEffect(() => {
    if (activeEffect?.type !== 'xray') { setXrayPeeked([]); return }

    // AI played xray — briefly reveal all cards to the player, then AI continues its turn
    if (activeEffect.data?.playedBy === 'ai') {
      const t = setTimeout(() => clearEffect(), 2500)
      return () => clearTimeout(t)
    }

    // Player played xray — wait for taps
    if (xrayPeeked.length === 0) return // waiting for player to tap
    // Auto-close 1.5s after 2nd peek, or 4s if they only tapped 1
    const delay = xrayPeeked.length >= 2 ? 1500 : 4000
    const t = setTimeout(() => clearEffect(), delay)
    return () => clearTimeout(t)
  }, [activeEffect?.type, activeEffect?.data?.playedBy, xrayPeeked.length, clearEffect])

  // Shuffle — animate cards out/in, then clear
  useEffect(() => {
    if (activeEffect?.type !== 'shuffle') { setShuffleAnimating(false); return }
    setShuffleAnimating(true)
    const t = setTimeout(() => { setShuffleAnimating(false); clearEffect() }, 1000)
    return () => clearTimeout(t)
  }, [activeEffect, clearEffect])

  // Fire once when the result is mathematically certain
  useEffect(() => {
    if (gameOver || mode === 'solo' || mode === 'mp') return
    const remaining = totalPairs - playerScore - aiScore
    if (remaining <= 0) return
    if (!easyWinShown.current && playerScore > aiScore + remaining) {
      easyWinShown.current = true
      setShowEasyWin(true)
    }
    if (!easyLoseShown.current && aiScore > playerScore + remaining) {
      easyLoseShown.current = true
      setShowEasyLose(true)
    }
  }, [playerScore, aiScore, gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleJoker() {
    if (jokersRemaining <= 0 || state.jokerUsed || flipped.length !== 1) return
    const remaining = spendJoker(`${economySessionId}:joker`)
    if (remaining === null) return
    activateJoker()
    setJokersRemaining(remaining)
    play('joker')
  }

  function flipCoin() {
    const win = Math.random() < 0.5
    setCoinWon(win)
    setCoinFlipPhase('spinning')
    setTimeout(() => {
      setCoinFlipPhase('result')
      play(win ? 'coinwin' : 'coinlose')
      setTimeout(() => {
        setCoinFlipPhase(null)
        forceGameOver(win ? 'player' : 'ai')
      }, 2000)
    }, 2200)
  }

  function useTieBreaker() {
    const n = Math.max(0, tieBreakers - 1)
    const result = economy.applyTransaction({
      id: `${economySessionId}:use-tiebreaker`,
      source: 'tiebreaker-use',
      changes: { counters: { tiebreakers: -1 } },
    })
    if (!result.applied) return
    setTieBreakers(n)
    forceGameOver('player')
  }

  // Award trophies + show interstitial before navigating away
  function addTrophies(count, action) {
    economy.applyTransaction({
      id: `${economySessionId}:trophies:${action}`,
      source: 'game-trophies',
      changes: { counters: { trophies: count } },
    })
  }

  function addStars(amount, action) {
    economy.applyTransaction({
      id: `${economySessionId}:stars:${action}`,
      source: 'game-stars',
      changes: { counters: { stars: amount } },
    })
  }

  // Award 10 coins once when the player wins any round
  const coinAwardedRef = useRef(false)
  useEffect(() => {
    if (winner === 'player' && !coinAwardedRef.current) {
      coinAwardedRef.current = true
      addStars(100, 'win')
    }
  }, [winner])

  function withInterstitial(cb) {
    cb()
  }


  const totalPairs = cards.filter(c => c.type === 'regular').length / 2
  const progress = ((playerScore + aiScore) / totalPairs) * 100
  const breatheDuration = Math.max(1.5, 8 - 6.5 * Math.pow(progress / 100, 1.5)).toFixed(2)

  const isCardFlipped = i => flipped.includes(i)
  const revealEffectType = i => {
    if (activeEffect?.type === 'xray' && xrayPeeked.includes(i)) return 'xray'
    if (activeEffect?.type === 'boom' && activeEffect.data.launched.includes(i)) return 'boom'
    if (activeEffect?.type === 'rocket' && rocketStep >= 0 && activeEffect.data.line.indexOf(i) <= rocketStep) return 'rocket'
    if (activeEffect?.type === 'tornado' && tornadoStep >= 0 && activeEffect.data.trail.includes(i) && snakeOrderRef.current.indexOf(i) <= tornadoStep) return 'tornado'
    return null
  }
  const isRevealed = i => {
    if (activeEffect?.type === 'xray') return xrayPeeked.includes(i)
    if (activeEffect?.type === 'boom') return activeEffect.data.launched.includes(i)
    if (activeEffect?.type === 'rocket') return rocketStep >= 0 && activeEffect.data.line.indexOf(i) <= rocketStep
    if (activeEffect?.type === 'tornado') return tornadoStep >= 0 && activeEffect.data.trail.includes(i) && snakeOrderRef.current.indexOf(i) <= tornadoStep
    return false
  }

  const effectCard = activeEffect
    ? SPECIAL_CARDS[activeEffect.type] || SPECIAL_CARDS[activeEffect?.data?.chosen]
    : null

  // Boom explosion: staggered outward-flying animation per launched card
  function getBoomStyle(i) {
    if (activeEffect?.type !== 'boom' || !activeEffect.data.launched.includes(i)) return undefined
    const launchedIdx = activeEffect.data.launched.indexOf(i)
    const bombIdx = activeEffect.data.index
    const bombCol = bombIdx % 4, bombRow = Math.floor(bombIdx / 4)
    const cardCol = i % 4, cardRow = Math.floor(i / 4)
    let dx = cardCol - bombCol
    let dy = cardRow - bombRow
    if (dx === 0 && dy === 0) { dx = 1; dy = 0 }
    const spin = dx >= 0 ? 1 : -1
    return {
      '--boom-dx': dx,
      '--boom-dy': dy,
      '--boom-spin': spin,
      animation: `boomExplode 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${launchedIdx * 80}ms both`,
      position: 'relative',
      zIndex: 15,
    }
  }

  return (
    <div className={`${styles.page} foTheme`} data-concept-screen="gameplay" data-screen="memory-game" style={{ '--breathe-duration': `${breatheDuration}s` }}>
      {/* All game UI in a centred responsive column. */}
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
                : winner === 'player' ? (mode === 'local' ? '🏆 PLAYER 1 WINS!' : '🏆 YOU WIN!')
                : mode === 'mp' ? '😢 OPPONENT WINS!'
                : mode === 'local' ? '🏆 PLAYER 2 WINS!'
                : '😢 YOU LOST!')
              : stunned === 'player' && turn === 'player' ? '⚡ STUNNED! Turn skipped…'
              : stunned === 'ai'     && turn === 'ai'     ? (mode === 'local' ? '⚡ PLAYER 2 STUNNED! Skipping…' : `⚡ ${(opponentName || 'AI').toUpperCase()} STUNNED! Skipping…`)
              : mode === 'solo' ? 'SOLO MODE'
              : mode === 'local' ? 'YOUR TURN'
              : mode === 'mp' ? (turn === 'player' ? 'YOUR TURN' : "OPPONENT'S TURN")
              : turn === 'player' ? 'YOUR TURN' : `${(opponentName || 'AI').toUpperCase()}'S TURN`
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
              ${turn !== 'player' && mode !== 'solo' && mode !== 'mp' && mode !== 'local' ? styles.aiTurn : ''}
            `}
          >
            {cards.map((card, i) => (
              <Card
                key={card.id}
                card={card}
                isFlipped={isCardFlipped(i) || isRevealed(i)}
                isMatched={matched.includes(i)}
                keepVisible={difficulty === 'Easy' || difficulty === 'Medium'}
                isFrozen={frozen.includes(i)}
                isConsumed={consumed.includes(i)}
                revealEffect={revealEffectType(i)}
                isShuffling={shuffleAnimating && !matched.includes(i) && !consumed.includes(i)}
                onClick={() => {
                  if (gameOver) return
                  if (pendingSpecial) return
                  if (passDevice) return  // waiting for device pass
                  // X-ray peek: player taps up to 2 cards to sneak a look before their real flip
                  if (activeEffect?.type === 'xray') {
                    if (activeEffect.data?.playedBy === 'player'
                        && !flipped.includes(i) && !matched.includes(i) && !consumed.includes(i)
                        && !xrayPeeked.includes(i) && xrayPeeked.length < 2) {
                      setXrayPeeked(prev => [...prev, i])
                    }
                    return
                  }
                  // Solo: tap any unmatched card during no-match delay to skip it immediately
                  if (mode === 'solo' && activeEffect?.type === 'no_match'
                      && !matched.includes(i) && !consumed.includes(i)) {
                    hideFlipped()  // turn: player → ai
                    clearEffect()
                    hideFlipped()  // turn: ai → player (simulates AI pass-back)
                    flipCard(i)
                    return
                  }
                  // During stopwatch: no 2-flip limit — cards stay revealed until time runs out
                  if (pendingResolve || (!stopwatchActive && flipped.length >= 2)) return
                  if (mode === 'solo' || turn === 'player') {
                    flipCard(i)
                    if (mode === 'mp') mpState?.sendFlip(i)
                  } else if (mode === 'local' && turn === 'ai') {
                    aiFlip(i)
                  }
                }}
                backImage={getDeckBackImage(deck)}
                style={getBoomStyle(i)}
              />
            ))}

            {/* Tornado sweep overlay — inside .board so % positions map to card cells */}
            {activeEffect?.type === 'tornado' && tornadoStep >= 0 && (() => {
              const cardIdx = snakeOrderRef.current[tornadoStep]
              if (cardIdx === undefined) return null
              const numRows = Math.ceil(cards.length / 4)
              return (
                <div className={styles.sweepTrack} aria-hidden="true">
                  <span className={styles.tornadoIcon} style={{
                    left: `${(cardIdx % 4 + 0.5) * 25}%`,
                    top:  `${(Math.floor(cardIdx / 4) + 0.5) / numRows * 100}%`,
                  }}>🌪️</span>
                </div>
              )
            })()}

            {/* Rocket fly overlay — inside .board so % positions map to card cells */}
            {activeEffect?.type === 'rocket' && rocketStep >= 0 && (() => {
              const { line } = activeEffect.data
              const cardIdx = line[Math.min(rocketStep, line.length - 1)]
              if (cardIdx === undefined) return null
              const numRows = Math.ceil(cards.length / 4)
              return (
                <div className={styles.sweepTrack} aria-hidden="true">
                  <span className={styles.rocketIcon} style={{
                    left: `${(cardIdx % 4 + 0.5) * 25}%`,
                    top:  `${(Math.floor(cardIdx / 4) + 0.5) / numRows * 100}%`,
                  }}>🚀</span>
                </div>
              )
            })()}
          </div>
        </div>{/* end boardWrap */}

        {/* Joker button — appears when player has flipped one card */}
        {turn === 'player' && flipped.length === 1 && !state.jokerUsed && jokersRemaining > 0 && !gameOver && (
          <button className={styles.jokerBtn} onClick={handleJoker}>
            <img src="/images/jokers/1.webp" alt="Joker" className={styles.jokerImg} />
            <span className={styles.jokerLabel}>USE JOKER</span>
            <span className={styles.jokerCount}>{jokersRemaining} left today</span>
          </button>
        )}

        {/* Portraits + scores */}
        <div className={styles.contestants}>
          <div className={styles.sidePanel}>
            <div className={styles.portraitGroup}>
              <div className={`${styles.portraitWrap} ${mode !== 'solo' && turn !== 'player' ? styles.inactive : ''} ${mode !== 'solo' && spinning ? styles.spinning : ''} ${playerShield ? styles.shieldActive : ''}`}>
                <img src={`/images/a${portrait}.webp`} alt="You" className={styles.portrait} />
              </div>
              {playerShield && (
                <img
                  src="/images/cards/special/shield.webp"
                  alt="Shield active"
                  draggable="false"
                  className={styles.shieldBadge}
                />
              )}
            </div>
            <span className={styles.sideScore}>{playerScore}</span>
            <span className={`${styles.contLabel} ${styles.youLabel}`}>
              {mode === 'local' && turn === 'ai' ? 'PLAYER 1' : 'YOU'}{crownHolder === 'player' ? ' 👑' : ''}
            </span>
          </div>
          {mode === 'solo' ? (
            <div className={styles.sidePanel}>
              <div className={styles.soloClockWrap}>
                <span className={styles.soloClockTime}>{formatTime(elapsed)}</span>
              </div>
              <span className={`${styles.contLabel} ${styles.timeLabel}`}>TIME</span>
            </div>
          ) : (
            <div className={styles.sidePanel}>
              <div className={styles.portraitGroup}>
                <div className={`${styles.portraitWrap} ${turn !== 'ai' ? styles.inactive : ''} ${spinning ? styles.spinning : ''} ${difficulty === 'Lethal' && turn === 'ai' ? styles.lethalAiActive : ''} ${aiShield ? styles.shieldActive : ''}`}>
                  <img
                    src={mode === 'mp'
                      ? `/images/a${mpState?.opponentPortrait ?? 1}.webp`
                      : mode === 'local'
                      ? `/images/a${(portrait % 4) + 1}.webp`
                      : opponentImage || `/images/a${aiContRef.current}.webp`}
                    alt={mode === 'mp' ? 'Opponent' : 'AI'}
                    className={styles.portrait}
                  />
                </div>
                {aiShield && (
                  <img
                    src="/images/cards/special/shield.webp"
                    alt="Shield active"
                    draggable="false"
                    className={styles.shieldBadge}
                  />
                )}
              </div>
              <span className={styles.sideScore}>{aiScore}</span>
              <span className={`${styles.contLabel} ${styles.cpuLabel}`}>
                {mode === 'mp' ? 'OPPONENT' : mode === 'local' ? (turn === 'ai' ? 'YOU' : 'PLAYER 2') : (opponentName || 'CPU').toUpperCase()}{crownHolder === 'ai' ? ' 👑' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Stopwatch countdown — number zooms from deep background to centre */}
        {swSecsLeft !== null && !gameOver && (
          <div className={styles.swOverlay}>
            <div key={swSecsLeft} className={styles.swNum}>{swSecsLeft}</div>
          </div>
        )}

        {/* Turn timer countdown — red urgent countdown when player is slow */}
        {turnSecsLeft !== null && !gameOver && (
          <div className={styles.turnOverlay}>
            <div key={turnSecsLeft} className={styles.turnNum}>{turnSecsLeft}</div>
          </div>
        )}

        {/* Dice roll overlay */}
        {activeEffect?.type === 'dice' && (
          <div className={styles.diceOverlay} onClick={diceRevealed ? clearEffect : undefined}>
            <div className={styles.diceRow}>
              <span className={`${styles.dieFace} ${diceRevealed ? styles.diceReveal : styles.diceRolling}`}>
                {['⚀','⚁','⚂','⚃','⚄','⚅'][diceDisplay[0] - 1]}
              </span>
              <span className={`${styles.dieFace} ${diceRevealed ? styles.diceReveal : styles.diceRolling}`}>
                {['⚀','⚁','⚂','⚃','⚄','⚅'][diceDisplay[1] - 1]}
              </span>
            </div>
            {diceRevealed && (
              <>
                <div className={styles.diceResultText}>
                  {activeEffect.data.isDouble ? '🎉 DOUBLE! Bonus turn after this!' : 'No double — opponent goes next'}
                </div>
                <div className={styles.effectDismissHint}>tap to dismiss</div>
              </>
            )}
          </div>
        )}

        {/* Effect overlay banner */}
        {activeEffect && activeEffect.type !== 'no_match' && activeEffect.type !== 'dice' && effectCard && (
          <div
            className={styles.effectBanner}
            style={{ '--effect-color': effectCard.color }}
            onClick={clearEffect}
          >
            <img src={effectCard.image} alt={effectCard.name} className={styles.effectIcon} />
            <div style={{ flex: 1 }}>
              <div className={styles.effectName}>{effectCard.name}</div>
              <div className={styles.effectDesc}>{effectCard.description}</div>
            </div>
            <span className={styles.effectDismiss}>✕</span>
          </div>
        )}

        {/* Pass device overlay — local pass-and-play mode */}
        {mode === 'local' && passDevice && !gameOver && (
          <div className={styles.passOverlay}>
            <div className={styles.passCard}>
              <div className={styles.passEmoji}>📱</div>
              <div className={styles.passTitle}>PLAYER {passDevice}'S TURN</div>
              <div className={styles.passSub}>Pass the device to Player {passDevice}</div>
              <button className={styles.passReadyBtn} onClick={() => setPassDevice(null)}>
                I'M READY! 👍
              </button>
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

                  <button className={styles.cinematicNextBtn} onClick={() => withInterstitial(() => { addTrophies(10, 'cinematic-win'); setCinematicDismissed(true) })}>
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
                      : winner === 'ai' ? '😢'
                      : '🤝'}
                  </div>
                  <div className={styles.resultTitle}>
                    {mpState?.opponentLeft ? 'Opponent Left'
                      : winner === 'player' ? 'You Win!'
                      : winner === 'ai' ? 'You Lost!'
                      : "It's a Draw!"}
                  </div>
                  <div className={styles.finalScores}>
                    <span>You: {playerScore}</span>
                    <span>Opp: {aiScore}</span>
                  </div>
                  <button className={styles.playAgainBtn} onClick={() => {
                    const mpWinner = mpState?.opponentLeft ? 'player' : winner
                    onResult?.(mpWinner)
                    withInterstitial(onBack)
                  }}>BACK TO MENU</button>
                </div>
              </div>
            ) : winner === 'ai' ? (
              /* ── Standard YOU LOST screen ── */
              <div className={styles.gameOverlay}>
                <div className={styles.stdDefeatCard}>
                  <img
                    src={`/images/a${portrait}d.webp`}
                    alt="Defeated"
                    className={styles.stdDefeatAvatar}
                  />
                  <img src="/images/defeated_banner.webp" alt="Defeated" className={styles.stdBanner} />
                  <div className={styles.finalScores}>
                    <span>You: {playerScore}</span>
                    <span>{mode === 'local' ? 'Player 2' : 'Opponent'}: {aiScore}</span>
                  </div>
                  {streakMode ? (
                    <>
                      <div className={styles.streakInfo}>
                        <div className={styles.streakNumber} style={{ color: '#ff6b6b' }}>💀 {currentStreak}</div>
                        <div className={styles.streakLabel} style={{ color: 'rgba(255,107,107,0.8)' }}>STREAK ENDED</div>
                        <div className={styles.streakBest}>Best: {bestStreak}</div>
                      </div>
                      <div className={styles.streakDefeatBtns}>
                        {!streakContinueUsed && (() => {
                          const playerCoins = parseInt(localStorage.getItem('fo_coins') || '0', 10)
                          const canAfford = playerCoins >= 25
                          return (
                            <button
                              className={styles.stdImgBtn}
                              disabled={!canAfford}
                              onClick={() => onStreakContinue?.()}
                            >
                              <img src="/images/try_again_25.webp" alt="Try Again – 25 coins" className={`${styles.stdBtnImg} ${!canAfford ? styles.stdBtnDim : ''}`} />
                            </button>
                          )
                        })()}
                        <button className={styles.streakGiveUpBtn} onClick={() => onStreakGiveUp?.()}>
                          GIVE UP
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.stdDefeatBtns}>
                        {canRetry && (() => {
                          const playerCoins = parseInt(localStorage.getItem('fo_coins') || '0', 10)
                          const canAfford = playerCoins >= 25
                          return (
                            <button
                              className={styles.stdImgBtn}
                              disabled={!canAfford}
                              onClick={() => {
                                const result = economy.applyTransaction({
                                  id: `${economySessionId}:retry`,
                                  source: 'game-retry',
                                  changes: { counters: { coins: -25, trophies: 1 } },
                                })
                                if (!result.applied) return
                                onRetry?.()
                              }}
                            >
                              <img src="/images/try_again_25.webp" alt="Try Again – 25 coins" className={`${styles.stdBtnImg} ${!canAfford ? styles.stdBtnDim : ''}`} />
                            </button>
                          )
                        })()}
                        <button
                          className={styles.stdImgBtn}
                          onClick={() => { addTrophies(1, 'defeat-give-up'); onBack() }}
                        >
                          <img src="/images/btn_giveup.webp" alt="Give Up" className={styles.stdBtnImg} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : winner === 'player' ? (
              /* ── Standard VICTORY screen ── */
              <div className={styles.gameOverlay}>
                <div className={styles.stdVictoryCard}>
                  <img src="/images/victory_banner.webp" alt="Victory!" className={styles.stdBanner} />
                  {opponentDefeatedImage ? (
                    <img src={opponentDefeatedImage} alt="Defeated opponent" className={styles.stdDefeatAvatar} />
                  ) : opponentImage ? (
                    <div className={styles.stdDefeatAvatarWrap}>
                      <img src={opponentImage} alt="" className={styles.stdDefeatAvatar} />
                      <div className={styles.stdDefeatX}>✕</div>
                    </div>
                  ) : null}
                  <div className={styles.finalScores}>
                    <span>You: {playerScore}</span>
                    <span>{mode === 'local' ? 'Player 2' : 'Opponent'}: {aiScore}</span>
                  </div>
                  {streakMode ? (
                    <>
                      <div className={styles.streakInfo}>
                        <div className={styles.streakNumber}>🔥 {currentStreak + 1}</div>
                        <div className={styles.streakLabel}>STREAK</div>
                        {Math.max(bestStreak, currentStreak + 1) > 0 && (
                          <div className={styles.streakBest}>Best: {Math.max(bestStreak, currentStreak + 1)}</div>
                        )}
                      </div>
                      <button className={styles.streakNextBtn} onClick={() => { addTrophies(5, 'streak-next'); onPlayerWon?.(); onStreakWin?.() }}>
                        NEXT GAME 🔥
                      </button>
                      <button className={styles.streakQuitBtn} onClick={() => withInterstitial(() => { addTrophies(5, 'streak-end'); onPlayerWon?.(); onStreakGiveUp?.() })}>
                        End Streak
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.stdImgBtn}
                      onClick={() => withInterstitial(() => { addTrophies(5, 'victory-continue'); onPlayerWon?.(); onBack() })}
                    >
                      <img src="/images/btn_continue.webp" alt="Continue" className={styles.stdBtnImg} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── Draw / Tie Break ── */
              <div className={styles.gameOverlay}>
                <div className={styles.tieBreakCard}>
                  {coinFlipPhase ? (
                    /* Coin flip animation */
                    <div className={styles.coinFlipSection}>
                      <div className={styles.coinWrap}>
                        <div className={`${styles.coinInner} ${coinWon ? styles.coinSpinHeads : styles.coinSpinTails}`}>
                          <div className={styles.coinFace}>
                            <img src="/images/heads.webp" alt="Heads" draggable="false" className={styles.coinImg} />
                          </div>
                          <div className={`${styles.coinFace} ${styles.coinTails}`}>
                            <img src="/images/tails.webp" alt="Tails" draggable="false" className={styles.coinImg} />
                          </div>
                        </div>
                      </div>
                      {coinFlipPhase === 'result' && (
                        <div className={`${styles.coinResult} ${coinWon ? styles.coinWin : styles.coinLose}`}>
                          {coinWon ? '🎉 HEADS — YOU WIN!' : '💀 TAILS — GAME OVER!'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className={styles.tieBreakEmoji}>🪙</div>
                      <div className={styles.tieBreakTitle}>TIE BREAK!</div>
                      <div className={styles.finalScores}>
                        <span>{mode === 'local' ? 'Player 1' : 'You'}: {playerScore}</span>
                        <span>{mode === 'local' ? 'Player 2' : (opponentName || 'AI').toUpperCase()}: {aiScore}</span>
                      </div>
                      <div className={styles.tieBreakBtns}>
                        <button className={styles.tieBreakBtn} onClick={() => onRetry?.()}>
                          🔄 Replay the Round
                          <span className={styles.tieBreakBtnSub}>Deal again and try to win outright</span>
                        </button>
                        <button className={styles.tieBreakBtn} onClick={flipCoin}>
                          🪙 Flip a Coin
                          <span className={styles.tieBreakBtnSub}>Win = you take the round  •  Lose = game over</span>
                        </button>
                        <button
                          className={`${styles.tieBreakBtn} ${styles.tieBreakBtnCard} ${tieBreakers === 0 ? styles.tieBreakBtnDisabled : ''}`}
                          onClick={tieBreakers > 0 ? useTieBreaker : undefined}
                          disabled={tieBreakers === 0}
                        >
                          🃏 Use Tie Breaker {tieBreakers > 0 ? `(${tieBreakers})` : '(none)'}
                          <span className={styles.tieBreakBtnSub}>Guaranteed win — card consumed on use</span>
                        </button>
                        <button className={`${styles.tieBreakBtn} ${styles.tieBreakBtnGiveUp}`} onClick={() => { addTrophies(1, 'draw-give-up'); withInterstitial(onBack) }}>
                          🏳️ Give Up
                        </button>
                      </div>
                    </>
                  )}
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
      <button className={styles.backBtn} onClick={() => !gameOver && (onResult || streakMode) ? setShowQuitModal(true) : onBack()} aria-label="Close">
        <span className={styles.closeX}>✕</span>
      </button>

      {/* Interstitial ad — shown when navigating away from game-over */}

      {/* Dev special-card toolbar — compiled out on Production (VITE_DEV_TOOLS not set) */}
      {devEnabled && <div style={{ display:'flex', flexDirection:'column', position:'relative', zIndex:50 }}>
        <button
          onClick={() => {
            const next = !devToolsOpen
            setDevToolsOpen(next)
            localStorage.setItem('fo_dev_toolbar', next ? 'on' : 'off')
          }}
          style={{ alignSelf:'center', margin:'4px 0 2px', padding:'2px 10px', background:'rgba(255,0,102,0.15)', border:'1px solid rgba(255,0,102,0.5)', borderRadius:'50px', color:'#ff0066', fontSize:'9px', fontFamily:'Nunito Sans', fontWeight:700, letterSpacing:'1px', cursor:'pointer' }}
        >
          {devToolsOpen ? '▲ DEV' : '▼ DEV'}
        </button>
        {devToolsOpen && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', padding:'6px 8px', background:'#1a0010', justifyContent:'center', borderTop:'2px solid #ff0066' }}>
            {SPECIAL_POOL.map(type => (
              <button
                key={type}
                title={type}
                onClick={() => triggerDevSpecial(type, generateSpecialSeed(type, 0, cards, matched, consumed))}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'4px 6px', cursor:'pointer' }}
              >
                <img src={`/images/cards/special/${type}.webp`} alt={type} style={{ width:'32px', height:'32px', objectFit:'contain', display:'block' }} />
                <span style={{ color:'#fff', fontSize:'8px', fontFamily:'Atkinson Hyperlegible', textTransform:'uppercase' }}>{type}</span>
              </button>
            ))}
            {onResult && (
              <button
                title="Force win"
                onClick={() => onResult('player')}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.45)', borderRadius:'8px', padding:'4px 6px', cursor:'pointer' }}
              >
                <span style={{ fontSize:'26px', lineHeight:'32px', display:'block', width:'32px', textAlign:'center' }}>🏆</span>
                <span style={{ color:'#FFD700', fontSize:'8px', fontFamily:'Atkinson Hyperlegible', textTransform:'uppercase', fontWeight:700 }}>WIN</span>
              </button>
            )}
          </div>
        )}
      </div>}

      {/* Easy-win modal — player's lead is unassailable */}
      <Modal open={showEasyWin} title="You've got this!" tone="success" onDismiss={() => setShowEasyWin(false)} actions={<><button className={styles.quitStayBtn} onClick={() => setShowEasyWin(false)}>Keep playing</button><button className={styles.quitLeaveBtn} onClick={() => { setShowEasyWin(false); forceGameOver('player') }}>Move on</button></>}>
        <div className={styles.quitIcon} aria-hidden="true">🏆</div>
        <p>Your opponent cannot catch you. Keep playing or move on?</p>
      </Modal>

      {/* Cannot-win modal */}
      <Modal open={showEasyLose} title="That's tough" tone="error" onDismiss={() => setShowEasyLose(false)} actions={<><button className={styles.quitStayBtn} onClick={() => setShowEasyLose(false)}>Keep trying</button><button className={styles.quitLeaveBtn} onClick={() => { setShowEasyLose(false); withInterstitial(() => { addTrophies(1, 'early-give-up'); onBack() }) }}>Give up</button></>}>
        <div className={styles.quitIcon} aria-hidden="true">😔</div>
        <p>You cannot catch your opponent. Keep trying or give up?</p>
      </Modal>

      {/* Quit confirmation modal — gauntlet / season */}
      <Modal open={showQuitModal} title={streakMode ? 'End streak?' : gauntletStep !== undefined ? 'Quit Gauntlet?' : 'Quit this round?'} tone="error" onDismiss={() => setShowQuitModal(false)} actions={<><button className={styles.quitStayBtn} onClick={() => setShowQuitModal(false)}>Keep playing</button><button className={styles.quitLeaveBtn} onClick={() => {
        setShowQuitModal(false)
        if (streakMode) { onStreakGiveUp?.() }
        else if (onQuit) { onQuit() }
        else { onResult?.('ai') }
      }}>{streakMode ? 'End streak' : 'Quit and lose'}</button></>}>
        <div className={styles.quitIcon} aria-hidden="true">{streakMode ? '🔥' : '⚠️'}</div>
        <p>{streakMode
          ? `Your current streak of ${currentStreak} will be lost.`
          : gauntletStep !== undefined
            ? 'Leaving now counts as a loss and resets Gauntlet progress to Round 1.'
            : 'Leaving now counts as a loss for this round.'}</p>
      </Modal>
    </div>
  )
}
