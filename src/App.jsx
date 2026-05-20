import { useState, useEffect, useRef } from 'react'
import Home from './screens/Home'
import DeckPicker from './screens/DeckPicker'
import Game from './screens/Game'

export default function App() {
  const [screen,   setScreen]   = useState('home')
  const [deck,     setDeck]     = useState(null)
  const [portrait, setPortrait] = useState(() => parseInt(localStorage.getItem('fo_portrait') || '1'))
  const [musicOn,  setMusicOn]  = useState(() => localStorage.getItem('fo_music') !== 'off')
  const [sfxOn,    setSfxOn]    = useState(() => localStorage.getItem('fo_sfx')   !== 'off')
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio('/music/deal-the-tension.mp3')
    audio.loop = true
    audio.volume = 0.45
    audioRef.current = audio

    if (musicOn) {
      audio.play().catch(() => {
        const unlock = () => {
          audio.play().catch(() => {})
          document.removeEventListener('click', unlock)
          document.removeEventListener('touchstart', unlock)
        }
        document.addEventListener('click', unlock)
        document.addEventListener('touchstart', unlock)
      })
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  function toggleMusic() {
    const next = !musicOn
    setMusicOn(next)
    localStorage.setItem('fo_music', next ? 'on' : 'off')
    if (audioRef.current) {
      if (next) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }

  function toggleSfx() {
    const next = !sfxOn
    setSfxOn(next)
    localStorage.setItem('fo_sfx', next ? 'on' : 'off')
  }

  function handlePlay()        { setScreen('deckpicker') }
  function handleSelectDeck(d) { setDeck(d); setScreen('game') }
  function handleBack()        { setScreen('home'); setDeck(null) }
  function handlePortrait(idx) { setPortrait(idx); localStorage.setItem('fo_portrait', idx) }

  if (screen === 'game' && deck) {
    return (
      <Game
        key={deck.id + Date.now()}
        deck={deck}
        portrait={portrait}
        onBack={handleBack}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  if (screen === 'deckpicker') {
    return <DeckPicker onSelect={handleSelectDeck} onBack={() => setScreen('home')} />
  }
  return (
    <Home
      onPlay={handlePlay}
      portrait={portrait}
      onPortrait={handlePortrait}
      musicOn={musicOn}
      sfxOn={sfxOn}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
    />
  )
}
