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
import SeasonMap from './screens/SeasonMap'
import { KNOCKOUT_OPPONENTS, STANDARD_OPPONENTS } from './data/opponents'
import { ACTIVE_SEASON, STEPS_PER_STAGE, BOSS_STEP, GENERIC_OPPONENT } from './data/seasonalOpponents'
import { DECKS } from './data/decks'
import { useMultiplayer } from './hooks/useMultiplayer'
import { buildBoard } from './hooks/useGame'
import { verifySession, applyPurchase } from './utils/foShop.js'
import { getDeviceUuid } from './utils/deviceId.js'

// ── Music pools ───────────────────────────────────────────────────────────────
const MENU_TRACKS = [
  '/music/menu_1.mp3',
  '/music/menu_2.mp3',
]
const GAMEOVER_TRACKS = [
  '/music/gameover_1.mp3',
  '/music/gameover_2.mp3',
  '/music/gameover_3.mp3',
  '/music/gameover_4.mp3',
]
const BOSS_TRACKS = [
  '/music/ingame_boss_final.mp3',
]
const INGAME_TRACKS = [
  '/music/ingame_arcade_cabbage.mp3',
  '/music/ingame_arcade_cabbage_short.mp3',
  '/music/ingame_boss_checkout.mp3',
  '/music/ingame_boss_checkout_2.mp3',
  '/music/ingame_boss_gauntlet.mp3',
  '/music/ingame_boss_gauntlet_2.mp3',
  '/music/ingame_boss_keyfire.mp3',
  '/music/ingame_boss_keyfire_fast.mp3',
  '/music/ingame_cartridge_laughter.mp3',
  '/music/ingame_cartridge_laughter_2.mp3',
  '/music/ingame_checkpoint_thunder.mp3',
  '/music/ingame_checkpoint_thunder_2.mp3',
  '/music/ingame_gavel_lightning.mp3',
  '/music/ingame_gavel_lightning_2.mp3',
  '/music/ingame_pixel_meltdown.mp3',
  '/music/ingame_tangerine_rumble.mp3',
  '/music/ingame_tangerine_rumble_short.mp3',
  '/music/ingame_tin_piano.mp3',
]
const MENU_SCREENS = new Set(['home','deckpicker','shop','avatarpicker','settings','leaderboard','luckyspin','mplobby','gauntlet','seasonmap'])
const GAME_SCREENS = new Set(['game','mpgame','roundstart','seasongame','seasonroundstart'])

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
  const [purchaseStatus, setPurchaseStatus] = useState(null) // null | 'verifying' | 'success' | 'error'
  const [purchaseResult, setPurchaseResult] = useState(null)

  // Multiplayer
  const mp = useMultiplayer()
  const [mpDeck,  setMpDeck]  = useState(null)
  const [mpCards, setMpCards] = useState(null)

  // Standard vs-AI opponent — picked once per game session
  const [stdOpponent,    setStdOpponent]    = useState(() => STANDARD_OPPONENTS[Math.floor(Math.random() * STANDARD_OPPONENTS.length)])
  const [retryKey,       setRetryKey]       = useState(0)
  const [tryAgainUsed,   setTryAgainUsed]   = useState(false)

  // Gauntlet state
  const [gauntletStep,    setGauntletStep]    = useState(() => parseInt(localStorage.getItem('fo_gauntlet_step') || '0'))
  const [gauntletActive,  setGauntletActive]  = useState(false)

  // Season state — seasonStep 0..BOSS_STEP (0-indexed, 30 steps total)
  const [seasonStep,   setSeasonStep]   = useState(() => parseInt(localStorage.getItem('fo_season1_step') || '0'))
  const [seasonActive, setSeasonActive] = useState(false)
  const isBossStep = seasonStep === BOSS_STEP

  const audioRef       = useRef(null)
  const activePoolRef  = useRef(null)   // which pool array is currently playing
  const lastSrcRef     = useRef(null)   // avoid back-to-back repeats
  const musicOnRef     = useRef(musicOn)
  useEffect(() => { musicOnRef.current = musicOn }, [musicOn])

  // ── Multiplayer board sync effects ──────────────────────────────────────────
  // When game_start fires, host generates the board; guest waits for fo:board
  useEffect(() => {
    if (mp.status !== 'starting') return
    const deckObj = DECKS.find(d => d.id === mp.deckId)
    if (!deckObj) return
    const numPairs    = { Easy: 6, Medium: 6, Hard: 8, Lethal: 8 }[mp.difficulty] ?? 6
    const numSpecials = { Easy: 1, Medium: 2, Hard: 3, Lethal: 3 }[mp.difficulty] ?? 2
    setMpDeck(deckObj)
    if (mp.isHost) {
      const devSpecials = new URLSearchParams(window.location.search).has('specials')
      const cards = buildBoard(deckObj, devSpecials ? 1 : numPairs, devSpecials ? 14 : numSpecials)
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
    // Dev helpers — never linked publicly
    if (params.get('resetoffer') === '1') {
      localStorage.removeItem('fo_offer_seen')
      localStorage.removeItem('fo_offer_expires')
      localStorage.removeItem('fo_offer_bought')
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('resetseason') === '1') {
      localStorage.removeItem('fo_season1_step')
      localStorage.removeItem('fo_season1_gold_card')
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('resetgauntlet') === '1') {
      localStorage.removeItem('fo_gauntlet_step')
      localStorage.removeItem('fo_gold_card')
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.has('testprize')) {
      setScreen('luckyspin')
    }
    if (params.has('gameover')) {
      const freeDeck = DECKS.find(d => d.free)
      if (freeDeck) { setDeck(freeDeck); setScreen('game') }
    }

    // ── Post-Stripe redirect: verify purchase and credit to localStorage ──────
    const foSession = params.get('fo_session')
    const foDevice  = params.get('fo_device')
    if (foSession && foDevice) {
      window.history.replaceState({}, '', window.location.pathname)
      setPurchaseStatus('verifying')
      verifySession(foSession, foDevice)
        .then(result => {
          applyPurchase(result)
          setPurchaseResult(result)
          setPurchaseStatus('success')
        })
        .catch(() => setPurchaseStatus('error'))
    }
  }, [])

  // ── Music manager ─────────────────────────────────────────────────────────
  // Stable ref to the play function so ended-listeners can call it without
  // stale-closure issues.
  const playNextRef = useRef(null)
  playNextRef.current = function playNext(pool) {
    const choices = pool.length > 1 ? pool.filter(t => t !== lastSrcRef.current) : pool
    const src     = choices[Math.floor(Math.random() * choices.length)]
    lastSrcRef.current = src

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    const audio = new Audio(src)
    audio.volume = 0.45
    audio.addEventListener('ended', () => {
      if (activePoolRef.current === pool && musicOnRef.current) playNextRef.current(pool)
    })
    audioRef.current = audio
    if (musicOnRef.current) {
      audio.play().catch(() => {
        const unlock = () => {
          if (audioRef.current === audio) audio.play().catch(() => {})
          document.removeEventListener('click',      unlock)
          document.removeEventListener('touchstart', unlock)
        }
        document.addEventListener('click',      unlock)
        document.addEventListener('touchstart', unlock)
      })
    }
  }

  function switchToPool(pool) {
    if (activePoolRef.current === pool) return
    activePoolRef.current = pool
    playNextRef.current(pool)
  }

  // Switch pool when screen changes
  useEffect(() => {
    if (!musicOn) return
    // Boss fight gets its own dedicated track
    if (screen === 'seasongame' && isBossStep) {
      switchToPool(BOSS_TRACKS)
    } else if (GAME_SCREENS.has(screen)) {
      switchToPool(INGAME_TRACKS)
    } else {
      switchToPool(MENU_TRACKS)
    }
  }, [screen, musicOn, seasonStep]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' } }
  }, [])

  function handlePlayerLost() {
    activePoolRef.current = null // force switch even if already on gameover
    switchToPool(GAMEOVER_TRACKS)
  }

  function toggleMusic() {
    const next = !musicOn
    setMusicOn(next)
    musicOnRef.current = next
    localStorage.setItem('fo_music', next ? 'on' : 'off')
    if (!next) {
      if (audioRef.current) audioRef.current.pause()
    } else {
      if (audioRef.current && !audioRef.current.ended) {
        audioRef.current.play().catch(() => {})
      } else {
        activePoolRef.current = null
        switchToPool(GAME_SCREENS.has(screen) ? INGAME_TRACKS : MENU_TRACKS)
      }
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
    setStdOpponent(STANDARD_OPPONENTS[Math.floor(Math.random() * STANDARD_OPPONENTS.length)])
    setRetryKey(0)
    setTryAgainUsed(false)
    setScreen('game')
  }
  function handleBack() {
    setScreen('home')
    setDeck(null)
    setRetryKey(0)
    setTryAgainUsed(false)
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

  // ── Season flow ────────────────────────────────────────────────────────────
  function handleSeasonMap() { setScreen('seasonmap') }

  function handleSeasonFight() {
    const ownedIds  = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
    const d         = available[Math.floor(Math.random() * available.length)]
    setDeck(d)
    setSeasonActive(true)
    setScreen('seasongame')
  }

  function handleSeasonResult(winner) {
    if (winner === 'player') {
      if (seasonStep === BOSS_STEP) {
        // Beat the final boss — award season gold card + coins, then reset for replay
        const key = ACTIVE_SEASON.boss.rewardKey
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, new Date().toISOString().slice(0, 10))
        }
        addCoins(150)
        setSeasonStep(0)
        localStorage.setItem('fo_season1_step', '0')
      } else {
        const next = seasonStep + 1
        setSeasonStep(next)
        localStorage.setItem('fo_season1_step', String(next))
      }
    }
    setDeck(null)
    setSeasonActive(false)
    setScreen('seasonmap')
  }

  // Dev helper — advance one season step (for testing levels)
  function handleDevSeasonWin() {
    handleSeasonResult('player')
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
  if (screen === 'seasonmap') {
    return (
      <SeasonMap
        seasonStep={seasonStep}
        portrait={portrait}
        onFight={handleSeasonFight}
        onBack={() => setScreen('home')}
        navProps={navProps}
      />
    )
  }
  if (screen === 'seasongame' && deck) {
    const opp = isBossStep ? ACTIVE_SEASON.boss : GENERIC_OPPONENT
    return (
      <Game
        key={`season-${seasonStep}-${deck.id}`}
        deck={deck}
        portrait={portrait}
        mode="vs"
        difficulty={isBossStep ? 'Lethal' : difficulty}
        opponentImage={opp.image ?? undefined}
        opponentDefeatedImage={opp.defeatedImage ?? stdOpponent.defeatedImage}
        opponentName={opp.name}
        opponentModel={opp.model ?? undefined}
        opponentBio={opp.bio ?? undefined}
        onBack={() => { setDeck(null); setSeasonActive(false); setScreen('seasonmap') }}
        onResult={handleSeasonResult}
        onPlayerLost={handlePlayerLost}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
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
    return <Settings onBack={() => setScreen('home')} onSeason={handleSeasonMap} musicOn={musicOn} sfxOn={sfxOn} onToggleMusic={toggleMusic} onToggleSfx={toggleSfx} difficulty={difficulty} onDifficulty={handleDifficulty} onDevWin={handleDevSeasonWin} seasonStep={seasonStep} navProps={navProps} />
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
        key={deck.id + retryKey}
        deck={deck}
        portrait={portrait}
        mode={isGauntlet ? 'vs' : mode}
        difficulty={isGauntlet ? gauntletOpponent.difficulty : difficulty}
        opponentImage={isGauntlet ? gauntletOpponent.image : stdOpponent.image}
        opponentDefeatedImage={isGauntlet ? gauntletOpponent.defeatedImage : stdOpponent.defeatedImage}
        opponentName={isGauntlet ? gauntletOpponent.name : undefined}
        opponentModel={isGauntlet ? gauntletOpponent.model : undefined}
        opponentBio={isGauntlet ? gauntletOpponent.bio : undefined}
        gauntletStep={isGauntlet ? gauntletStep : undefined}
        canRetry={!isGauntlet && !tryAgainUsed}
        onBack={handleBack}
        onRetry={!isGauntlet ? () => { setTryAgainUsed(true); setRetryKey(k => k + 1) } : undefined}
        onResult={isGauntlet ? handleGauntletResult : undefined}
        onQuit={isGauntlet ? (() => {
          setGauntletStep(0)
          localStorage.setItem('fo_gauntlet_step', '0')
          setDeck(null)
          setGauntletActive(false)
          setScreen('home')
        }) : undefined}
        onPlayerLost={handlePlayerLost}
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
        yourTurn={mp.getYourTurn()}
        onBack={handleMpGameBack}
        onPlayerLost={handlePlayerLost}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  // ── Purchase overlay (shown after Stripe redirect) ─────────────────────────
  if (purchaseStatus === 'verifying') {
    return (
      <div style={{ position:'fixed', inset:0, background:'#0d0030', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'#fff', fontFamily:'Arial' }}>
        <div style={{ fontSize:48 }}>⌛</div>
        <div style={{ fontSize:20, fontWeight:700 }}>Claiming your purchase…</div>
      </div>
    )
  }
  if (purchaseStatus === 'success' && purchaseResult) {
    const { product_type, coins, decks, extras } = purchaseResult
    return (
      <div style={{ position:'fixed', inset:0, background:'#0d0030', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'#fff', fontFamily:'Arial', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:64 }}>🎉</div>
        <div style={{ fontSize:24, fontWeight:900, color:'#FFD700' }}>Purchase complete!</div>
        {coins > 0 && <div style={{ fontSize:16 }}>+{coins} coins added 🪙</div>}
        {decks?.length > 0 && <div style={{ fontSize:16 }}>New deck{decks.length > 1 ? 's' : ''} unlocked! 🃏</div>}
        {product_type === 'remove_ads' && <div style={{ fontSize:16 }}>Ads removed 🚫</div>}
        {extras && Object.entries(extras).map(([k, v]) => (
          <div key={k} style={{ fontSize:16 }}>{v}× {k} power-up added ⚡</div>
        ))}
        <button
          onClick={() => { setPurchaseStatus(null); setPurchaseResult(null) }}
          style={{ marginTop:16, padding:'14px 40px', borderRadius:50, border:'none', background:'linear-gradient(180deg,#32d96a,#1a9e48)', color:'#fff', fontSize:18, fontWeight:900, cursor:'pointer' }}
        >
          Let's play!
        </button>
      </div>
    )
  }
  if (purchaseStatus === 'error') {
    return (
      <div style={{ position:'fixed', inset:0, background:'#0d0030', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'#fff', fontFamily:'Arial', padding:24, textAlign:'center' }}>
        <div style={{ fontSize:48 }}>⚠️</div>
        <div style={{ fontSize:20, fontWeight:700 }}>Something went wrong</div>
        <div style={{ fontSize:14, opacity:0.7 }}>Your payment went through — tap Restore Purchases in Settings to claim your items.</div>
        <button onClick={() => setPurchaseStatus(null)} style={{ marginTop:8, padding:'12px 32px', borderRadius:50, border:'1px solid rgba(255,255,255,0.3)', background:'transparent', color:'#fff', fontSize:16, cursor:'pointer' }}>
          OK
        </button>
      </div>
    )
  }

  return (
    <Home
      onPlay={handlePlay}
      onKnockout={handleKnockout}
      onOnline={handleOnline}
      onSeason={handleSeasonMap}
      onShop={() => setScreen('shop')}
      onAvatar={() => setScreen('avatarpicker')}
      onSettings={() => setScreen('settings')}
      portrait={portrait}
      onPortrait={handlePortrait}
      gauntletStep={gauntletStep}
      seasonStep={seasonStep}
      mode={mode}
      onMode={setMode}
      musicOn={musicOn}
      sfxOn={sfxOn}
      onToggleMusic={toggleMusic}
      onToggleSfx={toggleSfx}
    />
  )
}
