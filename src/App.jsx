/* eslint-disable react-hooks/refs -- established app orchestration reads stable refs during render */
import { lazy, useState, useEffect, useRef } from 'react'
import Home from './screens/Home'
import DeckPicker from './screens/DeckPicker'
import AvatarPicker from './screens/AvatarPicker'
import Settings from './screens/Settings'
import AboutUs from './screens/AboutUs'
import PrivacyPolicy from './screens/PrivacyPolicy'
import PatchNotes from './screens/PatchNotes'
import Gauntlet from './screens/Gauntlet'
import RoundStart from './screens/RoundStart'
import MultiplayerLobby from './screens/MultiplayerLobby'
import Leaderboard from './screens/Leaderboard'
import { KNOCKOUT_OPPONENTS, pickStdOpponent } from './data/opponents'
import { DECKS } from './data/decks'
import { useMultiplayer } from './hooks/useMultiplayer'
import { buildBoard } from './hooks/useGame'
import { verifySession, applyPurchase, syncStats } from './utils/foShop.js'
import { setSfxVol } from './hooks/useSfx'
import { snapshotToCookie } from './utils/gameStorage.js'
import { isAutomatedAudioDisabled } from './utils/audioSafety.js'
import { createTransactionId, economy } from './utils/economyService.js'
import CookieBanner, { consentAnswered, hasConsent } from './components/CookieBanner.jsx'
import { isMatch3TokenReviewRequest } from './match3/tokenReviewAccess.js'
import { isBoosterOpeningReviewRequest } from './ui/boosterOpeningReviewAccess.js'
import { isDevToolkitRequest } from './ui/devToolkitAccess.js'
import { LoadingState, Modal } from './ui/components.jsx'
import appStyles from './App.module.css'

const Shop=lazy(()=>import('./screens/Shop'))
const Game=lazy(()=>import('./screens/Game'))
const LuckySpin=lazy(()=>import('./screens/LuckySpin'))
const Inventory=lazy(()=>import('./screens/Inventory'))
const Marketplace=lazy(()=>import('./screens/Marketplace'))
const RevealGame=lazy(()=>import('./screens/RevealGame'))
const Match3=lazy(()=>import('./screens/Match3'))
const Match3TokenReview=lazy(()=>import('./screens/Match3TokenReview'))
const BoosterOpeningReview=lazy(()=>import('./screens/BoosterOpeningReview'))
const DevToolkit=lazy(()=>import('./screens/DevToolkit'))

// ── Music pools ───────────────────────────────────────────────────────────────
const HOME_TRACKS = [
  '/music/home_1.mp3',
  '/music/home_2.mp3',
]
const GAMEOVER_TRACKS = [
  '/music/tryagain_1.mp3',
  '/music/tryagain_2.mp3',
]
const WIN_TRACKS      = [
  '/music/victory_1.mp3',
  '/music/victory_2.mp3',
]
const RANKS_TRACKS    = [
  '/music/victory_1.mp3',
]
const SHOP_TRACKS     = [
  '/music/victory_2.mp3',
]
const BOSS_TRACKS     = [
  '/music/gauntlet_1.mp3',
  '/music/gauntlet_2.mp3',
]
const INGAME_TRACKS   = [
  '/music/game_1.mp3',
  '/music/game_1b.mp3',
  '/music/game_2a.mp3',
  '/music/game_3.mp3',
  '/music/game_3b.mp3',
  '/music/game_4.mp3',
  '/music/game_4b.mp3',
  '/music/game_4b2.mp3',
]
const ABOUT_TRACKS    = []
const SPIN_TRACKS     = [
  '/music/spin_1.mp3',
  '/music/spin_2.mp3',
]
const GAME_SCREENS = new Set(['game','mpgame','roundstart'])

export default function App() {
  const [screen,     setScreen]     = useState(() => isDevToolkitRequest() ? 'dev-toolkit' : isBoosterOpeningReviewRequest() ? 'booster-opening-review' : isMatch3TokenReviewRequest() ? 'match3-token-review' : 'home')
  const [cookieBannerDone, setCookieBannerDone] = useState(consentAnswered)
  const [deck,       setDeck]       = useState(null)
  const [portrait,   setPortrait]   = useState(() => parseInt(localStorage.getItem('fo_portrait')   || '1'))
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('fo_difficulty')          || 'Medium')
  const [musicOn,    setMusicOn]    = useState(() => !isAutomatedAudioDisabled() && localStorage.getItem('fo_music') !== 'off')
  const [sfxOn,      setSfxOn]      = useState(() => !isAutomatedAudioDisabled() && localStorage.getItem('fo_sfx') !== 'off')
  const [musicVol,   setMusicVol]   = useState(() => parseFloat(localStorage.getItem('fo_music_vol') ?? '0.45'))
  const [sfxVol,     setSfxVolState]= useState(() => parseFloat(localStorage.getItem('fo_sfx_vol')   ?? '0.7'))
  const [mode,       setMode]       = useState('vs')
  const [purchaseStatus, setPurchaseStatus] = useState(null) // null | 'verifying' | 'success' | 'error'
  const [purchaseResult, setPurchaseResult] = useState(null)
  const [devMatch3Level, setDevMatch3Level] = useState(null)

  // Multiplayer
  const mp = useMultiplayer()
  const [mpDeck,          setMpDeck]          = useState(null)
  const [mpCards,         setMpCards]         = useState(null)
  const [mpUnlockPrompt,  setMpUnlockPrompt]  = useState(null) // deck to offer after MP game
  const mpResultRef = useRef(null) // 'player' | 'ai' | 'draw' — set by onResult before handleMpGameBack fires

  // Standard vs-AI opponent — picked once per game session
  const [stdOpponent,    setStdOpponent]    = useState(() => pickStdOpponent())
  const [retryKey,       setRetryKey]       = useState(0)
  const [tryAgainUsed,   setTryAgainUsed]   = useState(false)

  // Streak mode state
  const [showStreakIntro,    setShowStreakIntro]    = useState(false)
  const [streakActive,       setStreakActive]       = useState(false)
  const [streakCurrent,      setStreakCurrent]      = useState(() => parseInt(localStorage.getItem('fo_streak')      || '0'))
  const [streakBest,         setStreakBest]         = useState(() => parseInt(localStorage.getItem('fo_streak_best') || '0'))
  const [streakContinueUsed, setStreakContinueUsed] = useState(false)

  // Gauntlet state
  const [gauntletStep,    setGauntletStep]    = useState(() => parseInt(localStorage.getItem('fo_gauntlet_step') || '0'))
  const [gauntletActive,  setGauntletActive]  = useState(false)

  // Legacy season progress is retained only for Home summary compatibility.
  const [seasonStep] = useState(() => parseInt(localStorage.getItem('fo_season1_step') || '0'))
  // e-type checkpoint opponents at rounds 6,11,16,21,26,31 (steps 5,10,15,20,25,30)

  const audioRef       = useRef(null)
  const activePoolRef  = useRef(null)   // which pool array is currently playing
  const lastSrcRef     = useRef(null)   // avoid back-to-back repeats
  const prevScreenRef  = useRef(null)   // detect game-screen entries
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
      economy.applyTransaction({ id: 'dev:unlock-gizmo', source: 'dev', changes: { decks: allIds } })
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
      economy.applyTransaction({
        id: createTransactionId('dev:reset-season'),
        source: 'dev',
        changes: { flags: { fo_season1_gold_card: '' } },
      })
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('resetgauntlet') === '1') {
      localStorage.removeItem('fo_gauntlet_step')
      economy.applyTransaction({
        id: createTransactionId('dev:reset-gauntlet'),
        source: 'dev',
        changes: { flags: { fo_gold_card: '' } },
      })
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
  const playNextRef   = useRef(null)
  const unlockClickRef = useRef(null)
  const unlockTouchRef = useRef(null)

  function clearUnlockListeners() {
    if (unlockClickRef.current) { document.removeEventListener('click',      unlockClickRef.current); unlockClickRef.current = null }
    if (unlockTouchRef.current) { document.removeEventListener('touchstart', unlockTouchRef.current); unlockTouchRef.current = null }
  }

  playNextRef.current = function playNext(pool) {
    const choices = pool.length > 1 ? pool.filter(t => t !== lastSrcRef.current) : pool
    const src     = choices[Math.floor(Math.random() * choices.length)]
    lastSrcRef.current = src

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    const audio = new Audio(src)
    audio.volume = musicVol
    audio.addEventListener('ended', () => {
      if (activePoolRef.current === pool && musicOnRef.current) playNextRef.current(pool)
    })
    audioRef.current = audio
    if (musicOnRef.current) {
      audio.play().catch(() => {
        clearUnlockListeners()
        const unlock = () => {
          if (audioRef.current === audio) audio.play().catch(() => {})
          clearUnlockListeners()
        }
        unlockClickRef.current = unlock
        unlockTouchRef.current = unlock
        document.addEventListener('click',      unlock)
        document.addEventListener('touchstart', unlock)
      })
    }
  }

  function switchToPool(pool) {
    if (!pool || pool.length === 0) return
    if (activePoolRef.current === pool) return
    activePoolRef.current = pool
    playNextRef.current(pool)
  }

  // Snapshot progress to cookie on every screen change (only if user consented)
  useEffect(() => { if (hasConsent()) snapshotToCookie() }, [screen])

  // Stop any playing track immediately on screen change; clear any orphaned unlock listeners
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null }
    activePoolRef.current = null
    clearUnlockListeners()
  }, [screen])

  // Switch to the correct music pool for the new screen
  useEffect(() => {
    if (!musicOn) return
    prevScreenRef.current = screen
    const isGame = GAME_SCREENS.has(screen)

    if (isGame) {
      switchToPool(INGAME_TRACKS)
    } else if (screen === 'home') {
      switchToPool(HOME_TRACKS)
    } else if (screen === 'gauntlet' || screen === 'roundstart') {
      switchToPool(BOSS_TRACKS)
    } else if (screen === 'leaderboard') {
      switchToPool(RANKS_TRACKS)
    } else if (screen === 'shop') {
      switchToPool(SHOP_TRACKS)
    } else if (screen === 'about') {
      switchToPool(ABOUT_TRACKS)
    } else if (screen === 'luckyspin') {
      switchToPool(SPIN_TRACKS)
    } else if (screen === 'reveal') {
      // RevealGame manages its own audio — stop app music, start nothing
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null }
      activePoolRef.current = null
    } else {
      // Use home tracks as fallback for all menu screens (settings, shop, etc.)
      switchToPool(HOME_TRACKS)
    }
  }, [screen, musicOn])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' } }
  }, [])

  // Sync sfxVol module var on mount and whenever it changes
  useEffect(() => { setSfxVol(sfxVol) }, [sfxVol])

  // Kick off music on very first user interaction (browsers block autoplay until a gesture)
  useEffect(() => {
    if (!musicOn) return
    const unlock = () => {
      if (!audioRef.current || audioRef.current.paused) {
        activePoolRef.current = null
        switchToPool(GAME_SCREENS.has(prevScreenRef.current || screen) ? INGAME_TRACKS : HOME_TRACKS)
      }
      document.removeEventListener('click',      unlock)
      document.removeEventListener('touchstart', unlock)
    }
    document.addEventListener('click',      unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true, passive: true })
    return () => {
      document.removeEventListener('click',      unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlayerLost() {
    activePoolRef.current = null // force switch even if already on gameover
    switchToPool(GAMEOVER_TRACKS)
  }

  function handlePlayerWon() {
    activePoolRef.current = null
    switchToPool(WIN_TRACKS)
  }

  function toggleMusic() {
    const next = !musicOn
    setMusicOn(next)
    musicOnRef.current = next
    localStorage.setItem('fo_music', next ? 'on' : 'off')
    if (!next) {
      if (audioRef.current) audioRef.current.pause()
    } else {
      if (screen === 'home') {
        activePoolRef.current = null
        switchToPool(HOME_TRACKS)
      } else if (audioRef.current && !audioRef.current.ended) {
        audioRef.current.play().catch(() => {})
      } else {
        activePoolRef.current = null
        switchToPool(GAME_SCREENS.has(screen) ? INGAME_TRACKS : HOME_TRACKS)
      }
    }
  }

  function toggleSfx() {
    const next = !sfxOn
    setSfxOn(next)
    localStorage.setItem('fo_sfx', next ? 'on' : 'off')
  }

  function handleMusicVol(v) {
    const val = parseFloat(v)
    setMusicVol(val)
    localStorage.setItem('fo_music_vol', String(val))
    if (audioRef.current) audioRef.current.volume = val
  }

  function handleSfxVol(v) {
    const val = parseFloat(v)
    setSfxVolState(val)
    setSfxVol(val)
    localStorage.setItem('fo_sfx_vol', String(val))
  }

  // ── Normal game flow ───────────────────────────────────────────────────────
  function handlePlay(showIntro = true) {
    if (showIntro) {
      setShowStreakIntro(true)
    } else {
      setStreakActive(true)
      setStreakContinueUsed(false)
      setScreen('deckpicker')
    }
  }
  function handleStreakIntroDismiss() {
    setShowStreakIntro(false)
    setStreakActive(true)
    setStreakContinueUsed(false)
    setScreen('deckpicker')
  }
  function handleSelectDeck(d) {
    setDeck(d)
    setStdOpponent(pickStdOpponent())
    setRetryKey(0)
    setTryAgainUsed(false)
    setScreen('game')
  }
  function handleBack() {
    if (streakActive) {
      if (streakCurrent > streakBest) {
        setStreakBest(streakCurrent)
        localStorage.setItem('fo_streak_best', String(streakCurrent))
        syncStats(streakCurrent, parseInt(localStorage.getItem('fo_pvp_wins') || '0'))
      }
      setStreakCurrent(0)
      localStorage.setItem('fo_streak', '0')
    }
    setScreen('home')
    setDeck(null)
    setRetryKey(0)
    setTryAgainUsed(false)
    setGauntletActive(false)
    setStreakActive(false)
    setMode('vs')
  }

  // ── Local (pass-and-play) flow ─────────────────────────────────────────────
  function handleLocalPlay() {
    setMode('local')
    setStreakActive(false)
    setTryAgainUsed(false)
    setRetryKey(0)
    setScreen('deckpicker')
  }

  // ── Streak handlers ────────────────────────────────────────────────────────
  function handleStreakWin() {
    const next = streakCurrent + 1
    setStreakCurrent(next)
    localStorage.setItem('fo_streak', String(next))
    if (next > streakBest) {
      setStreakBest(next)
      localStorage.setItem('fo_streak_best', String(next))
      syncStats(next, parseInt(localStorage.getItem('fo_pvp_wins') || '0'))
    }
    // Auto-pick a new random deck for the next round
    const ownedIds = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
    const nextDeck = available[Math.floor(Math.random() * available.length)]
    setDeck(nextDeck)
    setStdOpponent(pickStdOpponent())
    setStreakContinueUsed(false)
    setRetryKey(k => k + 1)
  }

  function handleStreakContinue() {
    const result = economy.applyTransaction({
      id: `streak-continue:${streakCurrent}:${retryKey}`,
      source: 'streak-continue',
      changes: { counters: { coins: -25 } },
    })
    if (!result.applied) return
    setStreakContinueUsed(true)
    setRetryKey(k => k + 1)
  }

  function handleStreakGiveUp() {
    if (streakCurrent > streakBest) {
      setStreakBest(streakCurrent)
      localStorage.setItem('fo_streak_best', String(streakCurrent))
      syncStats(streakCurrent, parseInt(localStorage.getItem('fo_pvp_wins') || '0'))
    }
    setStreakCurrent(0)
    localStorage.setItem('fo_streak', '0')
    setStreakActive(false)
    setDeck(null)
    setRetryKey(0)
    setScreen('home')
  }

  // ── Multiplayer flow ───────────────────────────────────────────────────────
  function handleOnline()    { setScreen('mplobby') }
  function handleMpBack() { mp.disconnect(); setMpDeck(null); setMpCards(null); setScreen('home') }
  function handleMpGameBack() {
    const playedDeck = mpDeck
    const wasGuest   = !mp.isHost
    // Increment PVP win counter if the player won
    if (mpResultRef.current === 'player') {
      const cur = parseInt(localStorage.getItem('fo_pvp_wins') || '0')
      const next = cur + 1
      localStorage.setItem('fo_pvp_wins', String(next))
      syncStats(parseInt(localStorage.getItem('fo_streak_best') || '0'), next)
    }
    mpResultRef.current = null
    mp.disconnect()
    setMpDeck(null)
    setMpCards(null)
    setScreen('home')
    // If the guest played with a paid deck they don't own, offer to unlock it
    if (wasGuest && playedDeck && !playedDeck.free) {
      const ownedIds = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
      if (!ownedIds.includes(playedDeck.id)) setMpUnlockPrompt(playedDeck)
    }
  }

  // No opponent found after 30s — drop into a normal VS CPU game
  function handleMpFallbackCPU({ deckId, difficulty: fallbackDiff }) {
    mp.disconnect()
    setMpDeck(null)
    setMpCards(null)
    const ownedIds   = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const available  = DECKS.filter(d => d.free || ownedIds.includes(d.id))
    const fallbackDeck = available.find(d => d.id === deckId) ?? available[0] ?? DECKS[0]
    setDeck(fallbackDeck)
    setDifficulty(fallbackDiff)
    setStdOpponent(pickStdOpponent())
    setRetryKey(0)
    setTryAgainUsed(false)
    setMode('vs')
    setScreen('game')
  }

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
        economy.applyTransaction({
          id: 'gauntlet:first-completion',
          source: 'gauntlet-completion',
          changes: {
            counters: { stars: 1000 },
            flags: { fo_gold_card: new Date().toISOString().slice(0, 10) },
          },
        })
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
  // Season progression remains visible on Home, but its legacy map and fight route are retired.

  // ── Misc ──────────────────────────────────────────────────────────────────
  function handlePortrait(idx) { setPortrait(idx); localStorage.setItem('fo_portrait', idx) }
  function handleDifficulty(d) { setDifficulty(d); localStorage.setItem('fo_difficulty', d) }

  const navProps = {
    onShop:     () => setScreen('shop'),
    onHome:     () => { if (screen !== 'home') setScreen('home') },
    onSettings: () => setScreen('settings'),
    onRanks:    () => setScreen('leaderboard'),
    onSpin:     () => setScreen('luckyspin'),
    onCollection: () => setScreen('inventory'),
    onRewards: () => setScreen('luckyspin'),
    onMore: () => setScreen('settings'),
  }

  // ── Gauntlet game props ────────────────────────────────────────────────────
  const gauntletOpponent = gauntletActive
    ? KNOCKOUT_OPPONENTS[Math.min(gauntletStep, KNOCKOUT_OPPONENTS.length - 1)]
    : null

  // ── Screens ───────────────────────────────────────────────────────────────
  if (screen === 'shop') {
    return <Shop onBack={() => setScreen('home')} onInventory={() => setScreen('inventory')} onMarketplace={() => setScreen('marketplace')} navProps={navProps} />
  }
  if (screen === 'luckyspin') {
    return <LuckySpin onBack={() => setScreen('shop')} navProps={navProps} />
  }
  if (screen === 'match3') return <Match3 onBack={() => { setDevMatch3Level(null); setScreen('home') }} initialLevel={devMatch3Level} />
  if (screen === 'match3-token-review') return <Match3TokenReview onBack={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('home') }} />
  if (screen === 'booster-opening-review') return <BoosterOpeningReview onBack={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('home') }} />
  if (screen === 'dev-toolkit') return <DevToolkit onBack={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('home') }} navProps={navProps} onJumpMatch3={level => { setDevMatch3Level(level); window.history.replaceState({}, '', window.location.pathname); setScreen('match3') }} />
  if (screen === 'inventory') {
    return <Inventory onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'marketplace') {
    return <Marketplace onBack={() => setScreen('shop')} navProps={navProps} />
  }
  if (screen === 'leaderboard') {
    return <Leaderboard portrait={portrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'avatarpicker') {
    return <AvatarPicker portrait={portrait} onPortrait={handlePortrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'settings') {
    return <Settings onBack={() => setScreen('home')} onAbout={() => setScreen('about')} onPrivacy={() => setScreen('privacy')} onPatchNotes={() => setScreen('patchnotes')} musicOn={musicOn} sfxOn={sfxOn} onToggleMusic={toggleMusic} onToggleSfx={toggleSfx} musicVol={musicVol} sfxVol={sfxVol} onMusicVol={handleMusicVol} onSfxVol={handleSfxVol} difficulty={difficulty} onDifficulty={handleDifficulty} navProps={navProps} />
  }
  if (screen === 'about') {
    return <AboutUs onBack={() => setScreen('settings')} navProps={navProps} />
  }
  if (screen === 'privacy') {
    return <PrivacyPolicy onBack={() => setScreen('settings')} navProps={navProps} />
  }
  if (screen === 'patchnotes') {
    return <PatchNotes onBack={() => setScreen('settings')} navProps={navProps} />
  }
  if (screen === 'reveal') {
    return <RevealGame onBack={() => setScreen('home')} sfxOn={sfxOn} />
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
        opponentName={isGauntlet ? gauntletOpponent.name : stdOpponent.name}
        opponentModel={isGauntlet ? gauntletOpponent.model : undefined}
        opponentBio={isGauntlet ? gauntletOpponent.bio : undefined}
        gauntletStep={isGauntlet ? gauntletStep : undefined}
        canRetry={!isGauntlet && !tryAgainUsed && !streakActive}
        onBack={handleBack}
        onRetry={isGauntlet ? () => setRetryKey(k => k + 1) : (!tryAgainUsed ? () => { setTryAgainUsed(true); setRetryKey(k => k + 1) } : undefined)}
        onResult={isGauntlet ? handleGauntletResult : undefined}
        streakMode={streakActive && !isGauntlet}
        currentStreak={streakCurrent}
        bestStreak={streakBest}
        onStreakWin={streakActive && !isGauntlet ? handleStreakWin : undefined}
        onStreakContinue={streakActive && !isGauntlet ? handleStreakContinue : undefined}
        onStreakGiveUp={streakActive && !isGauntlet ? handleStreakGiveUp : undefined}
        streakContinueUsed={streakContinueUsed}
        onQuit={isGauntlet ? (() => {
          setGauntletStep(0)
          localStorage.setItem('fo_gauntlet_step', '0')
          setDeck(null)
          setGauntletActive(false)
          setScreen('home')
        }) : undefined}
        onPlayerLost={handlePlayerLost}
        onPlayerWon={handlePlayerWon}
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
    return <MultiplayerLobby mp={mp} portrait={portrait} onBack={handleMpBack} onFallbackCPU={handleMpFallbackCPU} />
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
        onResult={(w) => { mpResultRef.current = w }}
        onPlayerLost={handlePlayerLost}
        onPlayerWon={handlePlayerWon}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  // ── Purchase overlay (shown after Stripe redirect) ─────────────────────────
  if (purchaseStatus === 'verifying') {
    return <div className={`${appStyles.overlayPage} foTheme`} data-concept-screen="route"><LoadingState label="Claiming your purchase…" /></div>
  }
  if (purchaseStatus === 'success' && purchaseResult) {
    const { product_type, coins, decks, extras } = purchaseResult
    return (
      <div className="foTheme" data-concept-screen="route"><Modal open title="Purchase complete" tone="success" actions={<button className={appStyles.primaryAction} onClick={() => { setPurchaseStatus(null); setPurchaseResult(null) }}>Continue</button>}>
        <div className={appStyles.rewardIcon} aria-hidden="true">★</div>
        {coins > 0 && <p><strong>+{coins} Coins</strong> added.</p>}
        {decks?.length > 0 && <p>New deck{decks.length > 1 ? 's' : ''} unlocked.</p>}
        {product_type === 'remove_ads' && <p>Advertising removed.</p>}
        {extras && Object.entries(extras).map(([k, v]) => (
          <p key={k}>{v}× {k} power-up added.</p>
        ))}
      </Modal></div>
    )
  }
  if (purchaseStatus === 'error') {
    return (
      <div className="foTheme" data-concept-screen="route"><Modal open title="Purchase needs attention" tone="danger" actions={<button className={appStyles.primaryAction} onClick={() => setPurchaseStatus(null)}>Continue</button>}>
        <p>Your payment may have completed. Use Restore Purchases in the Shop to claim the items safely.</p>
      </Modal></div>
    )
  }

  return (
    <>
    {/* Online deck unlock prompt — shown after guest plays a deck they don't own */}
    <Modal open={Boolean(mpUnlockPrompt)} title="Liked that deck?" onDismiss={() => setMpUnlockPrompt(null)} actions={<><button className={appStyles.secondaryAction} onClick={() => setMpUnlockPrompt(null)}>Maybe later</button><button className={appStyles.primaryAction} onClick={() => { setMpUnlockPrompt(null); setScreen('shop') }}>Visit Shop</button></>}>
      <p>You just played with <strong>{mpUnlockPrompt?.name}</strong>. Unlock it in the Shop to use it any time.</p>
    </Modal>
    <Modal open={showStreakIntro} title="Streak Mode" tone="success" onDismiss={handleStreakIntroDismiss} actions={<button className={appStyles.primaryAction} onClick={handleStreakIntroDismiss}>Start streak</button>}>
      <p>{streakBest > 0 ? <>Your best streak is <strong>{streakBest}</strong>. Can you beat it?</> : <>You have not set a streak yet. Time to change that.</>}</p>
    </Modal>
    <Home
      onMatch3={() => { setDevMatch3Level(null); setScreen('match3') }}
      onMemory={() => handlePlay(false)}
      onKnockout={handleKnockout}
      onOnline={handleOnline}
      onLocalPlay={handleLocalPlay}
      onReveal={() => setScreen('reveal')}
      onShop={() => setScreen('shop')}
      onAvatar={() => setScreen('avatarpicker')}
      onCollection={() => setScreen('inventory')}
      onRewards={() => setScreen('luckyspin')}
      onMore={() => setScreen('settings')}
      seasonStep={seasonStep}
      sfxOn={sfxOn}
    />
    {!cookieBannerDone && (
      <CookieBanner
        onAccept={() => { setCookieBannerDone(true); snapshotToCookie() }}
        onDecline={() => setCookieBannerDone(true)}
      />
    )}
    </>
  )
}
