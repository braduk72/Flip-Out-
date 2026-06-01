import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './RevealGame.module.css'
import { useSfx, playFile } from '../hooks/useSfx'
import confetti from 'canvas-confetti'

// ── Constants ─────────────────────────────────────────────────────────────────
const BACK_SRC   = '/images/back.webp'
const CARD_START = 1
const CARD_COUNT = 4

const PEEP_DECKS = [
  { id: 'puppies-kittens', label: 'Puppies & Kittens', preview: '/images/peepoh/puppies-kittens/cards/1.webp', path: '/images/peepoh/puppies-kittens/cards', cardCount: 20 },
  { id: 'shapes-colours',  label: 'Shapes & Colours',  preview: '/images/peepoh/shapes-colours/cards/1.webp',  path: '/images/peepoh/shapes-colours/cards',  cardCount: 20 },
]

// Background images for this deck — cycle through all before repeating (0–10)
const REVEAL_BGS = Array.from({ length: 11 }, (_, i) => `/images/peepoh/puppies-kittens/bgs/${i}.webp`)

const SFX_OOPSIE   = '/sounds/used/oopsie.mp3'
const SFX_WIN      = '/sounds/used/victory-level2.mp3'
const SFX_LOSE     = '/sounds/used/game-over-organ.mp3'
const MUSIC_TRACKS = ['/music/peepoh.mp3', '/music/peepoh_lyrics.mp3', '/music/peepoh_lyrics2.mp3']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DEFAULT_DECK = PEEP_DECKS[0]

const WIN_MESSAGES = ['Amazing!', 'Well Done!', 'You Did It!', 'Go You!', 'Brilliant!', 'Superstar!', 'Fantastic!']

// ── Confetti helpers ──────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF69B4', '#00BFFF', '#FF6347', '#98FB98', '#DDA0DD', '#FFA500', '#ffffff']

function burstConfetti() {
  // Big multi-shot explosion from the bottom centre
  const base = { origin: { x: 0.5, y: 0.75 }, colors: CONFETTI_COLORS }
  confetti({ ...base, particleCount: 80,  spread: 50,  startVelocity: 65, decay: 0.92 })
  confetti({ ...base, particleCount: 60,  spread: 90,  startVelocity: 50, decay: 0.90 })
  confetti({ ...base, particleCount: 40,  spread: 130, startVelocity: 40, decay: 0.88, scalar: 0.8 })
  // Side cannons after a tiny delay
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS })
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS })
  }, 150)
}

function popConfetti() {
  // Small celebratory pop when a pair is matched
  confetti({
    particleCount: 20,
    spread: 60,
    startVelocity: 30,
    decay: 0.88,
    scalar: 0.7,
    origin: { x: 0.5, y: 0.5 },
    colors: CONFETTI_COLORS,
  })
}

function makeCards(chosen, cardsPath = DEFAULT_DECK.path) {
  // chosen: array of CARD_COUNT unique image numbers from pickNextCards()
  // pairId matches the image number (n) directly — no index remapping
  const ts = Date.now() // unique prefix so React never reuses keys across levels
  return shuffle(chosen.flatMap(n => [
    { id: `${ts}-${n}a`, pairId: n, src: `${cardsPath}/${n}.webp`, state: 'down' },
    { id: `${ts}-${n}b`, pairId: n, src: `${cardsPath}/${n}.webp`, state: 'down' },
  ]))
}


function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen({ onBack, onStart }) {
  const [chosenDeck, setChosenDeck] = useState(null)

  // ── Step 1: pick a deck ───────────────────────────────────────────────────
  if (!chosenDeck) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <span className={styles.title}>Peep-Oh!</span>
        </div>
        <div className={styles.setupWrap}>
          <div className={styles.setupHeading}>Choose a deck!</div>
          <p className={styles.setupDesc}>Peep-oh! is for the young and the young at heart. A less challenging game that the whole family can play together. Look out for more special educational decks in the shop soon!</p>
          {PEEP_DECKS.map(deck => (
            <button key={deck.id} className={styles.livesBtn} onClick={() => setChosenDeck(deck)}>
              <img src={deck.preview} className={styles.deckPreview} alt={deck.label} />
              <span className={styles.livesLabel}>{deck.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 2: pick lives ────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => setChosenDeck(null)}>← Back</button>
        <span className={styles.title}>Peep-Oh!</span>
      </div>
      <div className={styles.setupWrap}>
        <div className={styles.setupHeading}>How many lives?</div>
        <button className={styles.livesBtn} onClick={() => onStart(3, chosenDeck)}>
          <span className={styles.livesEmoji}>❤️❤️❤️</span>
          <span className={styles.livesLabel}>3 Lives</span>
        </button>
        <button className={styles.livesBtn} onClick={() => onStart(5, chosenDeck)}>
          <span className={styles.livesEmoji}>❤️❤️❤️❤️❤️</span>
          <span className={styles.livesLabel}>5 Lives</span>
        </button>
        <button className={styles.livesBtn} onClick={() => onStart(Infinity, chosenDeck)}>
          <span className={styles.livesEmoji}>∞</span>
          <span className={styles.livesLabel}>Infinite</span>
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RevealGame({ onBack, sfxOn }) {
  // Card queue — cycles through all 20 images before any can repeat (mirrors bgQueueRef)
  // Must be declared before useState(makeCards) so the lazy initialiser can use it
  const cardQueueRef = useRef([])

  function pickNextCards(cardCount = DEFAULT_DECK.cardCount) {
    if (cardQueueRef.current.length < CARD_COUNT) {
      cardQueueRef.current = shuffle(Array.from({ length: cardCount }, (_, i) => i + CARD_START))
    }
    return cardQueueRef.current.splice(0, CARD_COUNT)
  }

  const [phase,     setPhase]     = useState('setup')
  const [deckInfo,  setDeckInfo]  = useState(DEFAULT_DECK)
  const [maxLives,  setMaxLives]  = useState(3)
  const [cards,     setCards]     = useState(() => makeCards(pickNextCards()))
  const [picked,    setPicked]    = useState([])
  const [busy,      setBusy]      = useState(false)
  const [lives,     setLives]     = useState(3)
  const [won,       setWon]       = useState(false)
  const [lost,      setLost]      = useState(false)
  const [winMsg,    setWinMsg]    = useState('')
  const [score,     setScore]     = useState(0)
  const [turns,     setTurns]     = useState(0)   // pairs flipped this level
  const [elapsed,   setElapsed]   = useState(0)   // running clock (seconds)
  const [levelTime, setLevelTime] = useState(0)   // time when level was won
  const [levelTurns,setLevelTurns]= useState(0)   // turns when level was won

  const { play, stopAll } = useSfx(sfxOn)
  const musicRef       = useRef(null)
  const timerRef       = useRef(null)
  const startRef       = useRef(null)
  const bgQueueRef     = useRef([])
  const trackIdxRef    = useRef(0)      // rotates through all MUSIC_TRACKS each round

  function nextBg() {
    if (bgQueueRef.current.length === 0) {
      bgQueueRef.current = shuffle(REVEAL_BGS.map((_, i) => i))
    }
    return REVEAL_BGS[bgQueueRef.current.pop()]
  }

  const [currentBg, setCurrentBg] = useState(() => {
    bgQueueRef.current = shuffle(REVEAL_BGS.map((_, i) => i))
    return REVEAL_BGS[bgQueueRef.current.pop()]
  })

  // ── Timer helpers ─────────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(timerRef.current)
    startRef.current = Date.now()
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    timerRef.current = null
    const t = startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0
    setLevelTime(t)
    return t
  }

  // ── Music helpers ─────────────────────────────────────────────────────────
  function startMusic() {
    stopMusic()
    const track = MUSIC_TRACKS[trackIdxRef.current % MUSIC_TRACKS.length]
    trackIdxRef.current += 1
    const audio = new Audio(track)
    audio.loop   = true
    audio.volume = 0.4
    audio.play().catch(() => {})
    musicRef.current = audio
  }

  function stopMusic() {
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.src = ''; musicRef.current = null }
  }

  // Stop music when won / lost
  useEffect(() => { if (won || lost) stopMusic() }, [won, lost])

  // Cleanup on unmount
  useEffect(() => () => { stopAll(); stopMusic(); clearInterval(timerRef.current) }, [])

  // ── Start / restart helpers ───────────────────────────────────────────────
  function handleStart(chosen, deck) {
    setDeckInfo(deck)
    cardQueueRef.current = []  // reset queue when deck changes
    setMaxLives(chosen)
    setLives(chosen)
    setScore(0)
    setTurns(0)
    setCards(makeCards(pickNextCards(deck.cardCount), deck.path))
    setCurrentBg(nextBg())
    setPicked([])
    setBusy(false)
    setWon(false)
    setLost(false)
    setPhase('playing')
    startMusic()
    startTimer()
  }

  // Next level after win — keep score, new bg, reset hearts + board + timer + turns
  function nextLevel() {
    setLives(maxLives)
    setTurns(0)
    setCards(makeCards(pickNextCards(deckInfo.cardCount), deckInfo.path))
    setCurrentBg(nextBg())
    setPicked([])
    setBusy(false)
    setWon(false)
    startTimer()
    startMusic()
  }

  // Keep going after losing hearts — new bg, reset hearts + board + timer + turns
  function keepGoing() {
    setLives(maxLives)
    setTurns(0)
    setCards(makeCards(pickNextCards(deckInfo.cardCount), deckInfo.path))
    setCurrentBg(nextBg())
    setPicked([])
    setBusy(false)
    setLost(false)
    startTimer()
    startMusic()
  }

  // Quit back to setup
  function quit() {
    setPhase('setup')
    stopMusic()
    stopTimer()
  }

  // ── Flip logic ────────────────────────────────────────────────────────────
  const flip = useCallback((idx) => {
    if (busy || won || lost) return
    if (cards[idx].state !== 'down') return

    const newPicked = [...picked, idx]
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, state: 'up' } : c))
    setPicked(newPicked)

    if (newPicked.length < 2) return

    const [a, b] = newPicked
    setBusy(true)
    setPicked([])
    setTurns(t => t + 1)

    if (cards[a].pairId === cards[b].pairId) {
      play('match')
      popConfetti()
      setTimeout(() => {
        setCards(prev => {
          const next = prev.map((c, i) =>
            i === a || i === b ? { ...c, state: 'matched' } : c
          )
          if (next.every(c => c.state === 'matched')) {
            const t = stopTimer()
            setLevelTime(t)
            setLevelTurns(turns + 1)  // +1 for this turn
            setScore(s => s + 1)
            setWinMsg(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)])
            setWon(true)
            if (sfxOn) playFile(SFX_WIN)
            burstConfetti()
          }
          return next
        })
        setBusy(false)
      }, 400)
    } else {
      if (sfxOn) playFile(SFX_OOPSIE)
      setTimeout(() => {
        setCards(prev => prev.map((c, i) =>
          i === a || i === b ? { ...c, state: 'down' } : c
        ))
        if (maxLives !== Infinity) {
          setLives(prev => {
            const next = prev - 1
            if (next <= 0) {
              stopTimer()
              setLost(true)
              if (sfxOn) playFile(SFX_LOSE)
            }
            return next
          })
        }
        setBusy(false)
      }, 900)
    }
  }, [busy, won, lost, cards, picked, turns, play, sfxOn, maxLives])

  // ── Render: setup ─────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return <SetupScreen onBack={onBack} onStart={handleStart} />
  }

  // ── Render: game ──────────────────────────────────────────────────────────
  const heartsDisplay = maxLives === Infinity
    ? '∞'
    : Array.from({ length: maxLives }, (_, i) => i < lives ? '❤️' : '🖤').join('')

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={quit}>← Back</button>
        <span className={styles.title}>Peep-Oh!</span>
        <span className={styles.hearts}>{heartsDisplay}</span>
      </div>

      <div className={styles.statsBar}>
        <span className={styles.statScore}>⭐ {score}</span>
        <span className={styles.statScore}>🔄 {turns}</span>
        <span className={styles.statTime}>⏱ {formatTime(elapsed)}</span>
      </div>

      <div className={styles.gridWrap}>
        <img src={currentBg} className={styles.revealBg} alt="" />
        <div className={styles.grid}>
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className={[
                styles.card,
                (card.state === 'up' || card.state === 'matched') ? styles.faceUp : '',
                card.state === 'matched' ? styles.cardMatched : '',
              ].join(' ')}
              onClick={() => flip(idx)}
            >
              <div className={styles.inner}>
                <div className={styles.back}>
                  <img src={BACK_SRC} className={styles.cardImg} alt="" />
                </div>
                <div className={styles.front}>
                  <img src={card.src} className={styles.cardImg} alt="" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Win overlay */}
      {won && (
        <div className={styles.winOverlay}>
          <div className={styles.overlayEmoji}>🎉</div>
          <div className={styles.overlayText}>{winMsg}</div>
          <div className={styles.overlayStats}>
            <span>⭐ {score}</span>
            <span>🔄 {levelTurns} turns</span>
            <span>⏱ {formatTime(levelTime)}</span>
          </div>
          <button className={styles.playAgainBtn} onClick={nextLevel}>Next Level!</button>
        </div>
      )}

      {/* Lose overlay */}
      {lost && (
        <div className={`${styles.winOverlay} ${styles.loseOverlay}`}>
          <div className={styles.overlayEmoji}>😿</div>
          <div className={styles.overlayText}>Keep Going!</div>
          <button className={styles.playAgainBtn} onClick={keepGoing}>Keep Going!</button>
        </div>
      )}

    </div>
  )
}
