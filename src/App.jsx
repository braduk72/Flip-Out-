/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs -- legacy app orchestration is outside the Home redesign */
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
import SeasonMap from './screens/SeasonMap'
import { KNOCKOUT_OPPONENTS, pickStdOpponent } from './data/opponents'
import { ACTIVE_SEASON, BOSS_STEP, GENERIC_OPPONENT, ROB_OPPONENTS, getRobNames } from './data/seasonalOpponents'
import { DECKS } from './data/decks'
import { useMultiplayer } from './hooks/useMultiplayer'
import { buildBoard } from './hooks/useGame'
import { verifySession, applyPurchase, syncStats } from './utils/foShop.js'
import { setSfxVol } from './hooks/useSfx'
import { snapshotToCookie } from './utils/gameStorage.js'
import { createTransactionId, economy } from './utils/economyService.js'
import CookieBanner, { consentAnswered, hasConsent } from './components/CookieBanner.jsx'
import { isMatch3TokenReviewRequest } from './match3/tokenReviewAccess.js'

const Shop=lazy(()=>import('./screens/Shop'))
const Game=lazy(()=>import('./screens/Game'))
const LuckySpin=lazy(()=>import('./screens/LuckySpin'))
const Inventory=lazy(()=>import('./screens/Inventory'))
const Marketplace=lazy(()=>import('./screens/Marketplace'))
const RevealGame=lazy(()=>import('./screens/RevealGame'))
const Match3=lazy(()=>import('./screens/Match3'))
const Match3TokenReview=lazy(()=>import('./screens/Match3TokenReview'))

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
const SEASON_TRACKS   = []
const ABOUT_TRACKS    = []
const SPIN_TRACKS     = [
  '/music/spin_1.mp3',
  '/music/spin_2.mp3',
]
const GAME_SCREENS = new Set(['game','mpgame','roundstart','seasongame','seasonroundstart'])

export default function App() {
  const [screen,     setScreen]     = useState(() => isMatch3TokenReviewRequest() ? 'match3-token-review' : 'home')
  const [cookieBannerDone, setCookieBannerDone] = useState(consentAnswered)
  const [deck,       setDeck]       = useState(null)
  const [portrait,   setPortrait]   = useState(() => parseInt(localStorage.getItem('fo_portrait')   || '1'))
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('fo_difficulty')          || 'Medium')
  const [musicOn,    setMusicOn]    = useState(() => localStorage.getItem('fo_music')               !== 'off')
  const [sfxOn,      setSfxOn]      = useState(() => localStorage.getItem('fo_sfx')                 !== 'off')
  const [musicVol,   setMusicVol]   = useState(() => parseFloat(localStorage.getItem('fo_music_vol') ?? '0.45'))
  const [sfxVol,     setSfxVolState]= useState(() => parseFloat(localStorage.getItem('fo_sfx_vol')   ?? '0.7'))
  const [mode,       setMode]       = useState('vs')
  const [purchaseStatus, setPurchaseStatus] = useState(null) // null | 'verifying' | 'success' | 'error'
  const [purchaseResult, setPurchaseResult] = useState(null)

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
  const [seasonRetryKey, setSeasonRetryKey] = useState(0)

  // Streak mode state
  const [showStreakIntro,    setShowStreakIntro]    = useState(false)
  const [streakActive,       setStreakActive]       = useState(false)
  const [streakCurrent,      setStreakCurrent]      = useState(() => parseInt(localStorage.getItem('fo_streak')      || '0'))
  const [streakBest,         setStreakBest]         = useState(() => parseInt(localStorage.getItem('fo_streak_best') || '0'))
  const [streakContinueUsed, setStreakContinueUsed] = useState(false)

  // Gauntlet state
  const [gauntletStep,    setGauntletStep]    = useState(() => parseInt(localStorage.getItem('fo_gauntlet_step') || '0'))
  const [gauntletActive,  setGauntletActive]  = useState(false)

  // Season state — seasonStep 0..BOSS_STEP (0-indexed, 30 steps total)
  const [seasonStep,   setSeasonStep]   = useState(() => parseInt(localStorage.getItem('fo_season1_step') || '0'))
  const [, setSeasonActive] = useState(false)
  const isBossStep  = seasonStep === BOSS_STEP
  const [robNames]  = useState(getRobNames)
  const isRobStep   = seasonStep < ROB_OPPONENTS.length && !isBossStep
  // e-type checkpoint opponents at rounds 6,11,16,21,26,31 (steps 5,10,15,20,25,30)
  const E_STEP_MAP  = { 5: 0, 10: 1, 15: 2, 20: 0, 25: 1, 30: 2 }

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

    if (screen === 'seasongame' && isBossStep) {
      switchToPool(BOSS_TRACKS)
    } else if (isGame) {
      switchToPool(INGAME_TRACKS)
    } else if (screen === 'seasonmap') {
      switchToPool(SEASON_TRACKS)
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
  }, [screen, musicOn, seasonStep]) // eslint-disable-line react-hooks/exhaustive-deps

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
  function handleSeasonMap() { setScreen('seasonmap') }

  function handleSeasonFight() {
    const ownedIds  = JSON.parse(localStorage.getItem('fo_owned_decks') || '[]')
    const available = DECKS.filter(d => d.free || ownedIds.includes(d.id))
    const d         = available[Math.floor(Math.random() * available.length)]
    setDeck(d)
    setSeasonActive(true)
    setSeasonRetryKey(0)
    setScreen('seasongame')
  }

  function handleSeasonResult(winner) {
    if (winner === 'player') {
      if (seasonStep === BOSS_STEP) {
        // Beat the final boss — award season gold card + coins, then reset for replay
        const key = ACTIVE_SEASON.boss.rewardKey
        economy.applyTransaction({
          id: 'season1:first-completion',
          source: 'season-completion',
          changes: {
            counters: { stars: 1500 },
            flags: { [key]: new Date().toISOString().slice(0, 10) },
          },
        })
        const completeStep = BOSS_STEP + 1
        setSeasonStep(completeStep)
        localStorage.setItem('fo_season1_step', String(completeStep))
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
    onHome:     () => { if (screen !== 'home') setScreen('home') },
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
    const robOpp = isRobStep ? { ...ROB_OPPONENTS[seasonStep], name: robNames[seasonStep] } : null
    const eIdx   = E_STEP_MAP[seasonStep]
    const eOpp   = eIdx !== undefined ? KNOCKOUT_OPPONENTS[eIdx] : null
    const opp = isBossStep ? ACTIVE_SEASON.boss : eOpp ?? robOpp ?? GENERIC_OPPONENT
    return (
      <Game
        key={`season-${seasonStep}-${deck.id}-${seasonRetryKey}`}
        deck={deck}
        portrait={portrait}
        mode="vs"
        difficulty={isBossStep ? 'Lethal' : opp.difficulty ?? difficulty}
        opponentImage={opp.image ?? undefined}
        opponentDefeatedImage={opp.defeatedImage ?? undefined}
        opponentName={opp.name}
        opponentModel={opp.model ?? undefined}
        opponentBio={opp.bio ?? undefined}
        onBack={() => { setDeck(null); setSeasonActive(false); setScreen('seasonmap') }}
        onResult={handleSeasonResult}
        onRetry={() => setSeasonRetryKey(k => k + 1)}
        onPlayerLost={handlePlayerLost}
        onPlayerWon={handlePlayerWon}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    )
  }
  if (screen === 'shop') {
    return <Shop onBack={() => setScreen('home')} onInventory={() => setScreen('inventory')} onMarketplace={() => setScreen('marketplace')} navProps={navProps} />
  }
  if (screen === 'luckyspin') {
    return <LuckySpin onBack={() => setScreen('shop')} navProps={navProps} />
  }
  if (screen === 'match3') return <Match3 onBack={() => setScreen('home')} />
  if (screen === 'match3-token-review') return <Match3TokenReview onBack={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('home') }} />
  if (screen === 'inventory') {
    return <Inventory onBack={() => setScreen('shop')} navProps={navProps} />
  }
  if (screen === 'marketplace') {
    return <Marketplace onBack={() => setScreen('shop')} />
  }
  if (screen === 'leaderboard') {
    return <Leaderboard portrait={portrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'avatarpicker') {
    return <AvatarPicker portrait={portrait} onPortrait={handlePortrait} onBack={() => setScreen('home')} navProps={navProps} />
  }
  if (screen === 'settings') {
    return <Settings onBack={() => setScreen('home')} onSeason={handleSeasonMap} onAbout={() => setScreen('about')} onPrivacy={() => setScreen('privacy')} onPatchNotes={() => setScreen('patchnotes')} musicOn={musicOn} sfxOn={sfxOn} onToggleMusic={toggleMusic} onToggleSfx={toggleSfx} musicVol={musicVol} sfxVol={sfxVol} onMusicVol={handleMusicVol} onSfxVol={handleSfxVol} difficulty={difficulty} onDifficulty={handleDifficulty} onDevWin={handleDevSeasonWin} seasonStep={seasonStep} navProps={navProps} />
  }
  if (screen === 'about') {
    return <AboutUs onBack={() => setScreen('settings')} navProps={navProps} />
  }
  if (screen === 'privacy') {
    return <PrivacyPolicy onBack={() => setScreen('settings')} navProps={navProps} />
  }
  if (screen === 'patchnotes') {
    return <PatchNotes onBack={() => setScreen('settings')} />
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
    <>
    {/* Online deck unlock prompt — shown after guest plays a deck they don't own */}
    {mpUnlockPrompt && (
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:'#1a0040', border:'2px solid rgba(255,215,0,0.5)', borderRadius:20, padding:'28px 24px', margin:'0 24px', maxWidth:320, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center', boxShadow:'0 0 40px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize:36 }}>🃏</div>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:1, color:'#FFD700', fontFamily:"'Arial Black', Arial, sans-serif" }}>LIKED THAT DECK?</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.8)', fontFamily:'Arial, sans-serif', lineHeight:1.5 }}>
            You just played with <strong style={{ color:'#FFD700' }}>{mpUnlockPrompt.name}</strong>. Unlock it in the Shop to play it any time!
          </div>
          <button
            onClick={() => { setMpUnlockPrompt(null); setScreen('shop') }}
            style={{ width:'100%', padding:14, background:'#FFD700', color:'#1a0040', fontSize:15, fontWeight:900, letterSpacing:2, borderRadius:12, border:'none', cursor:'pointer', fontFamily:"'Arial Black', Arial, sans-serif" }}
          >
            VISIT SHOP
          </button>
          <button
            onClick={() => setMpUnlockPrompt(null)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontSize:13, cursor:'pointer', fontFamily:'Arial, sans-serif' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    )}
    {showStreakIntro && (
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.2s ease' }}>
        <div style={{ position:'relative', background:'#1a0040', border:'2px solid rgba(255,215,0,0.5)', borderRadius:20, padding:'28px 24px', margin:'0 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center', boxShadow:'0 0 40px rgba(0,0,0,0.6)' }}>
          <button className="modal-close-x" onClick={handleStreakIntroDismiss} aria-label="Close">✕</button>
          <div style={{ fontSize:40 }}>🔥</div>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:2, color:'#FFD700', fontFamily:"'Arial Black', Arial, sans-serif" }}>STREAK MODE</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', fontFamily:'Arial, sans-serif', lineHeight:1.5 }}>
            {streakBest > 0
              ? <><span>Your best streak is </span><strong style={{ color:'#FFD700' }}>{streakBest}</strong><span>. Can you beat it?</span></>
              : <span>You haven't set a streak yet. Time to change that!</span>
            }
          </div>
          <div style={{ fontSize:18, fontWeight:900, color:'#FFD700', letterSpacing:2, fontFamily:"'Arial Black', Arial, sans-serif" }}>GOOD LUCK!</div>
          <button onClick={handleStreakIntroDismiss} style={{ marginTop:4, width:'100%', padding:14, background:'#FFD700', color:'#1a0040', fontSize:15, fontWeight:900, letterSpacing:2, borderRadius:12, border:'none', cursor:'pointer', fontFamily:"'Arial Black', Arial, sans-serif" }}>
            LET'S GO!
          </button>
        </div>
      </div>
    )}
    <Home
      onMatch3={() => setScreen('match3')}
      onMemory={() => handlePlay(false)}
      onKnockout={handleKnockout}
      onOnline={handleOnline}
      onLocalPlay={handleLocalPlay}
      onReveal={() => setScreen('reveal')}
      onSeason={handleSeasonMap}
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
