import { useState, useEffect, useRef } from 'react'
import Home from './screens/Home'
import DeckPicker from './screens/DeckPicker'
import Shop from './screens/Shop'
import AvatarPicker from './screens/AvatarPicker'
import Settings from './screens/Settings'
import Game from './screens/Game'
import Gauntlet from './screens/Gauntlet'
import RoundStart from './screens/RoundStart'
import MultiplayerLobby from './screens/MultiplayerLobby'
import LuckySpin from './screens/LuckySpin'
import Leaderboard from './screens/Leaderboard'
import { KNOCKOUT_OPPONENTS } from './data/opponents'
import { DECKS } from './data/decks'
import { useMultiplayer } from './hooks/useMultiplayer'
import { buildBoard } from './hooks/useGame'

function awardGoldCard() {
  if (!localStorage.getItem('fo_gold_card')) {
    localStorage.setItem('fo_gold_card', new Date().toISOString().slice(0, 10))
  }
}

function addCoins(amount) {
  const current = parseInt(localStorage.getItem('fo_coins') || '0')
  localStorage.setItem('fo_coins', String(current + amount))
}

export default function App() {
  const [screen,     setScreen]     = useState('home')
  const [deck,       setDeck]       = useState(null)
  const [portrait,   setPortrait]   = useState(() => parseInt(localStorage.getItem('fo_portrait')   || '1'))
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('fo_difficulty')          || 'Medium')
  const [musicOn,    setMusicOn]    = useState(() => localStorage.getItem('fo_music')               !== 'off')
  const [sfxOn,      setSfxOn]      = useState(() => localStorage.getItem('fo_sfx')                 !== 'off')
  const [mode,       setMode]       = useState('vs')

  // Multiplayer
  const mp = useMultiplayer()
  const [mpDeck,  setMpDeck]  = useState(null)
  const [mpCards, setMpCards] = useState(null)

  // Gauntlet state
  const [gauntletStep,    setGauntletStep]    = useState(() => parseInt(localStorage.getItem('fo_gauntlet_step') || '0'))
  const [gauntletActive,  setGauntletActive]  = useState(false) // true while playing a gauntlet fight

  const audioRef = useRef(null)

  // ── Multiplayer board sync effects ──────────────────────────────────────────
  // When game_start fires, host generates the board; guest waits for fo:board
  useEffect(() => {
    if (mp.status !== 'starting') return
    const deckObj = DECKS.find(d => d.id === mp.deckId)
    if (!deckObj) return
    const numPairs = { Easy: 5, Medium: 7, Hard: 9, Lethal: 9 }[mp.difficulty] ?? 7
    setMpDeck(deckObj)
    if (mp.isHost) {
      const cards = buildBoard(deckObj, numPairs)
      setMpCards(cards)
      mp.sendBoard(cards)
    }
  }, [mp.status, mp.isHost, mp.deckId, mp.difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  // Guest receives board
  useEffect(() => {
    if (!mp.prebuiltCards) return
    setMpCards(mp.prebuiltCards)
    setMpDeck(DECKS.find(d => d.id === mp.deckId) ?? null)
  }, [mp.prebuiltCards]) // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to game once both deck + cards are ready
  useEffect(() => {
    if (mp.status === 'playing' && mpCards && mpDeck) setScreen('mpgame')
  }, [mp.status, mpCards, mpDeck])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('unlock') === 'gizmo') {
      const allIds = DECKS.filter(d => !d.free).map(d => d.id)
      const existing = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
      const merged = [...new Set([...existing, ...allIds])]
      localStorage.setItem('fo_owned_decks', JSON.stringify(merged))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const audio = new Audio('/music/deal-the-tension.mp3')
    audio.loop   = true
    audio.volume = 0.45
    audio.addEventListener('ended', () => { audio.currentTime = 0; audio.play().catch(() => {}) })
    audioRef.current = audio

    const tryPlay = () => { if (musicOn) audio.play().catch(() => {}) }

    if (musicOn) {
      audio.play().catch(() => {
        const unlock = () => {
          tryPlay()
          document.removeEventListener('click',      unlock)
          document.removeEventListener('touchstart', unlock)
        }
        document.addEventListener('click',      unlock)
        document.addEventListener('touchstart', unlock)
      })
    }

    return () => { audio.pause(); audio.src = '' }
  }, [])

  function toggleMusic() {
    const next = !musicOn
    setMusicOn(next)
    localStorage.setItem('fo_music', next ? 'on' : 'off')
    if (audioRef.current) {
      next ? audioRef.current.play().catch(() => {}) : audioRef.current.pause()
    }
  }

  function toggleSfx() {
    const next = !sfxOn
    setSfxOn(next)
    localStorage.setItem('fo_sfx', next ? 'on' : 'off')
  }

  // ── Normal game flow ───────────────────────────────────────────────────────
  function handlePlay()         { setScreen('deckpicker') }
  function handleSelectDeck(d) {
    setDeck(d)
    setScreen('game')
  }
  function handleBack() {
    setScreen('home')
    setDeck(null)
    setGauntletActive(false)
  }

  // ── Multiplayer flow ───────────────────────────────────────────────────────
  function handleOnline()    { setScreen('mplobby') }
  function handleMpBack()    { mp.disconnect(); setMpDeck(null); setMpCards(null); setScreen('home') }
  function handleMpGameBack() { mp.disconnect(); setMpDeck(null); setMpCards(null); setScreen('home') }

  // ── Gauntlet flow ──────────────────────────────────────────────────────────
  function handleKnockout() {
    setGauntletStep(0)
    localStorage.setItem('fo_gauntlet_step', '0')
    setScreen('gauntlet')
  }

  function handleGauntletFight() {
    const ownedIds = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
    const deck = available[Math.floor(Math.random() * available.length)]
    setDeck(deck)
    setGauntletActive(true)
    setScreen('roundstart')
  }

  function handleGauntletResult(winner) {
    if (winner === 'player') {
      const next = gauntletStep + 1
      setGauntletStep(next)
      localStorage.setItem('fo_gauntlet_step', String(next))
      // Defeating Professor Claw (final boss) awards the Gold Collector Card + 100 coins
      if (gauntletStep === KNOCKOUT_OPPONENTS.length - 1) {
        awardGoldCard()
        addCoins(100)
      }
    } else {
      // Loss = back to round 1
      setGauntletStep(0)
      localStorage.setItem('fo_gauntlet_step', '0')
    }
    setDeck(null)
    setGauntletActive(false)
    setScreen('gauntlet')
  }

  function handleGauntletReset() {
    setGauntletStep(0)
    localStorage.setItem('fo_gauntlet_step', '0')
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  function handlePortrait(idx) { setPortrait(idx); localStorage.setItem('fo_portrait', idx) }
  function handleDifficulty(d) { setDifficulty(d); localStorage.setItem('fo_difficulty', d) }

  const navProps = {
    onShop:     () => setScreen('shop'),
    onHome:     () => setScreen('home'),
    onSettings: () => setScreen('settings'),
    onRanks:    () => setScreen('leaderboard'),
    onSpin:     () => setScreen('luckyspin'),
  }

  // ── Gauntlet game props ────────────────────────────────────────────────────
  const gauntletOpponent = gauntletActive
    ? KNOCKOUT_OPPONENTS[Math.min(gauntletStep, KNOCKOUT_OPPONENTS.length - 1)]
    : null

  // ── Screens ───────────────────────────────────────────────────────────────
  if (screen === 'shop') {
    return <Shop onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'luckyspin') {
    return <LuckySpin onBack={() => setScreen('shop')} navProps={navProps} />
  }
  if (screen === 'leaderboard') {
    return <Leaderboard portrait={portrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'avatarpicker') {
    return <AvatarPicker portrait={portrait} onPortrait={handlePortrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'settings') {
    return <Settings onBack={() => setScreen('home')} musicOn={musicOn} sfxOn={sfxOn} onToggleMusic={toggleMusic} onToggleSfx={toggleSfx} difficulty={difficulty} onDifficulty={handleDifficulty} navProps={navProps} />
  }
  if (screen === 'gauntlet') {
    return (
      <Gauntlet
        step={gauntletStep}
        onFight={handleGauntletFight}
        onBack={() => setScreen('home')}
        onReset={handleGauntletReset}
        navProps={navProps}
      />
    )
  }
  if (screen === 'roundstart') {
    const roundOpponent = KNOCKOUT_OPPONENTS[Math.min(gauntletStep, KNOCKOUT_OPPONENTS.length - 1)]
    return (
      <RoundStart
        key={`roundstart-${gauntletStep}`}
        opponent={roundOpponent}
        round={gauntletStep + 1}
        total={KNOCKOUT_OPPONENTS.length}
        onStart={() => setScreen('game')}
        sfxOn={sfxOn}
      />
    )
  }
  if (screen === 'game' && deck) {
    const isGauntlet = !!gauntletOpponent
    return (
      <Game
        key={deck.id + Date.now()}
        deck={deck}
        portrait={portrait}
        mode={isGauntlet ? 'vs' : mode}
        difficulty={isGauntlet ? gauntletOpponent.difficulty : difficulty}
        opponentImage={isGauntlet ? gauntletOpponent.image : undefined}
        opponentDefeatedImage={isGauntlet ? gauntletOpponent.defeatedImage : undefined}
        opponentName={isGauntlet ? gauntletOpponent.name : undefined}
        opponentModel={isGauntlet ? gauntletOpponent.model : undefined}
        opponentBio={isGauntlet ? gauntletOpponent.bio : undefined}
        gauntletStep={isGauntlet ? gauntletStep : undefined}
        onBack={handleBack}
        onResult={isGauntlet ? handleGauntletResult : undefined}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  if (screen === 'deckpicker') {
    return <DeckPicker onSelect={handleSelectDeck} onBack={handleBack} />
  }
  if (screen === 'mplobby') {
    return <MultiplayerLobby mp={mp} portrait={portrait} onBack={handleMpBack} />
  }
  if (screen === 'mpgame' && mpDeck && mpCards) {
    return (
      <Game
        key={`mp-${mp.roomCode}`}
        deck={mpDeck}
        portrait={portrait}
        mode="mp"
        difficulty={mp.difficulty}
        prebuiltCards={mpCards}
        mpState={mp}
        onBack={handleMpGameBack}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  return (
    <Home
      onPlay={handlePlay}
      onKnockout={handleKnockout}
      onOnline={handleOnline}
      onShop={() => setScreen('shop')}
      onAvatar={() => setScreen('avatarpicker')}
      onSettings={() => setScreen('settings')}
      portrait={portrait}
      onPortrait={handlePortrait}
      gauntletStep={gauntletStep}
      mode={mode}
      onMode={setMode}
      musicOn={musicOn}
      sfxOn={sfxOn}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
    />
  )
}
