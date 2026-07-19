import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BottomNavigation,
  CardPanel,
  CollectionPreviewCard,
  DailyRewardCard,
  ErrorState,
  FoilProgressCard,
  LoadingState,
  Modal,
  PrimaryPlayButton,
  PromoCarousel,
  SafeAreaHeader,
  SeasonProgressCard,
} from '../ui/components.jsx'
import Match3Preview from '../ui/Match3Preview.jsx'
import NicknameOnboarding from '../components/NicknameOnboarding.jsx'
import { useMotionMode } from '../ui/motion.js'
import { claimHomeDailyReward, fetchHomeData } from '../ui/homeData.js'
import { playerGameApi } from '../utils/gameApi.js'
import { APP_VERSION } from '../version.js'
import '../ui/tokens.css'
import styles from './Home.module.css'

const EMPTY_HOME = {
  profile: { accountKind: 'guest', playerName: 'Guest Player', level: null, xp: null, xpTarget: null },
  currencies: { stars: null, coins: null },
  match3: { level: 1, completed: 0, resume: null },
  collection: { owned: 0, total: 1, newest: null },
  foil: { owned: 0, target: 10, available: false },
  season: { current: 0, total: 32, label: 'Season 1' },
  dailyLogin: { available: false },
  community: null,
}

export default function Home({
  onMatch3,
  onMemory,
  onKnockout,
  onOnline,
  onLocalPlay,
  onReveal,
  onShop,
  onAvatar,
  onCollection,
  onRewards,
  onMore,
  onSeason,
  seasonStep = 0,
  sfxOn = true,
  dataLoader = fetchHomeData,
  dailyClaimer = claimHomeDailyReward,
  nicknameSaver = playerGameApi.setDisplayName,
}) {
  const [data, setData] = useState(EMPTY_HOME)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [dailyPending, setDailyPending] = useState(false)
  const [dailyReceipt, setDailyReceipt] = useState(null)
  const dailyClaimInFlight = useRef(false)
  const [moreGamesOpen, setMoreGamesOpen] = useState(false)
  const scrollRef = useRef(null)
  const motion = useMotionMode()

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const result = await dataLoader({ seasonStep })
      setData(result)
      setStatus('ready')
    } catch (loadError) {
      setStatus('error')
      setError(loadError?.message || 'Player data could not be loaded.')
    }
  }, [dataLoader, seasonStep])

  useEffect(() => {
    let active = true
    dataLoader({ seasonStep }).then(result => {
      if (!active) return
      setData(result)
      setStatus('ready')
    }).catch(loadError => {
      if (!active) return
      setStatus('error')
      setError(loadError?.message || 'Player data could not be loaded.')
    })
    return () => { active = false }
  }, [dataLoader, seasonStep])
  useEffect(() => {
    document.documentElement.dataset.motion = motion
    return () => { delete document.documentElement.dataset.motion }
  }, [motion])

  const claimDaily = async () => {
    if (dailyClaimInFlight.current) return
    dailyClaimInFlight.current = true
    setDailyPending(true)
    try {
      const result = await dailyClaimer()
      const amount = Math.max(0, Number(result?.reward?.amount) || 0)
      setData(current => ({
        ...current,
        currencies: { ...current.currencies, stars: current.currencies.stars + amount },
        dailyLogin: { ...current.dailyLogin, available: false },
      }))
      setDailyReceipt(result)
      await load()
    } catch (claimError) {
      setError(claimError?.message || 'The Daily Reward could not be claimed.')
    } finally {
      dailyClaimInFlight.current = false
      setDailyPending(false)
    }
  }

  const promotions = (() => {
    const rows = [{
      id: 'coin-store',
      type: 'coin-store',
      eyebrow: 'Coin Store',
      title: 'Premium Coins. Safely yours.',
      detail: 'Verified purchases, durable receipts and a ledger-backed balance.',
      image: '/ui/promo/coin-store.webp',
      tone: 'legendary',
      action: { label: 'Open Coin Store', onClick: onShop },
    }]
    if (data.community) rows.push({
      id: `community-${data.community.id}`,
      type: 'community-challenge',
      eyebrow: 'Playing together',
      title: data.community.title,
      detail: 'Every completed objective moves the community closer.',
      image: '/ui/promo/community.webp',
      tone: 'feature',
      progress: { current: data.community.current, target: data.community.target, tone: 'cyan' },
      action: onRewards ? { label: 'View challenge', onClick: onRewards } : null,
    })
    rows.push({
      id: 'collection',
      type: 'new-collections',
      eyebrow: 'Collection',
      title: data.collection.newest ? `Newest: ${data.collection.newest.name}` : 'Your collection begins here',
      detail: data.collection.newest ? `${data.collection.owned} cards owned. See the next milestone.` : 'Discover cards, albums and future Foil variants.',
      image: '/ui/promo/collection.webp',
      tone: 'foil',
      action: onCollection ? { label: 'Open Collection', onClick: onCollection } : null,
    })
    rows.push({
      id: 'season',
      type: 'seasonal-announcement',
      eyebrow: data.season.label,
      title: 'Keep your season moving',
      detail: `${data.season.current} of ${data.season.total} stages complete.`,
      image: '/ui/promo/community.webp',
      tone: 'feature',
      progress: { current: data.season.current, target: data.season.total, tone: 'purple' },
      action: onSeason ? { label: 'View Season', onClick: onSeason } : null,
    })
    return rows
  })()

  const navigate = destination => {
    if (destination === 'home') scrollRef.current?.scrollTo({ top: 0, behavior: motion === 'full' ? 'smooth' : 'auto' })
    if (destination === 'collection') onCollection?.()
    if (destination === 'rewards') onRewards?.()
    if (destination === 'more') onMore?.()
  }

  if (status === 'ready' && !data.profile?.displayName) {
    return <NicknameOnboarding onSubmit={async displayName => {
      const result = await nicknameSaver(displayName)
      setData(current => ({
        ...current,
        profile: { ...current.profile, displayName: result.displayName, playerName: result.displayName },
      }))
    }}/>
  }

  return (
    <div className={`${styles.page} foTheme`} data-screen="home" data-build-version={APP_VERSION}>
      <div className={styles.ambient} aria-hidden="true"/>
      <SafeAreaHeader player={data.profile} currencies={data.currencies} status={status} onPlayerClick={onAvatar} onCoinStore={onShop} sfxOn={sfxOn}/>

      <main ref={scrollRef} className={styles.scrollRegion} id="main-content">
        <div className={styles.content}>
          <div className={styles.promoRegion}>
            {status === 'loading' ? <CardPanel variant="promo"><LoadingState label="Loading featured content…"/></CardPanel> : <PromoCarousel items={promotions} sfxOn={sfxOn}/>}
          </div>

          {status === 'error' && <div className={styles.errorRegion}><ErrorState message={error} onRetry={load} compact/></div>}

          <section className={styles.hero} aria-labelledby="match3-home-title">
            <img className={styles.heroFrame} src="/ui/panel-frame.svg" alt="" aria-hidden="true"/>
            <div className={styles.heroHeading}>
              <div><h1 id="match3-home-title">MATCH-3</h1><p>{data.match3.resume ? 'Your board is ready to resume' : `Continue Level ${data.match3.level}`}</p></div>
              <span>Earn Stars</span>
            </div>
            <Match3Preview paused={status === 'loading'}/>
            <PrimaryPlayButton level={data.match3.level} onClick={onMatch3} sfxOn={sfxOn}/>
            <div className={styles.secondaryModes}>
              <button type="button" className={styles.memoryLink} onClick={onMemory}>Prefer cards? Play Memory Match</button>
              <button type="button" className={styles.memoryLink} onClick={() => setMoreGamesOpen(true)}>Other game modes</button>
            </div>
          </section>

          <section className={styles.progressGroup} aria-label="Player progress and collection">
            {status === 'loading' ? <LoadingState label="Loading collection progress…"/> : <>
              <DailyRewardCard reward={data.dailyLogin} onClaim={claimDaily} pending={dailyPending}/>
              <CollectionPreviewCard collection={data.collection} onClick={onCollection}/>
              <FoilProgressCard foil={data.foil} onClick={onCollection}/>
              <SeasonProgressCard season={data.season} onClick={onSeason}/>
            </>}
          </section>

          <p className={styles.buildVersion}>Development Preview · v{APP_VERSION}</p>
        </div>
      </main>

      <BottomNavigation active="home" onNavigate={navigate}/>

      <Modal
        open={Boolean(dailyReceipt)}
        title="Daily Reward claimed"
        tone="success"
        onDismiss={() => setDailyReceipt(null)}
        actions={<button type="button" className={styles.modalPrimary} onClick={() => setDailyReceipt(null)}>Continue</button>}
      >
        <p><strong>{dailyReceipt?.reward?.amount ?? 0} Stars</strong> were added by the authoritative reward service.</p>
        <p>Day {dailyReceipt?.streak ?? data.dailyLogin?.nextStreak ?? 1} of the current streak.</p>
      </Modal>
      <Modal open={moreGamesOpen} title="Other game modes" onDismiss={() => setMoreGamesOpen(false)}>
        <div className={styles.modeList}>
          <button type="button" onClick={() => { setMoreGamesOpen(false); onKnockout?.() }}>Gauntlet <span>Challenge the opponent ladder</span></button>
          <button type="button" onClick={() => { setMoreGamesOpen(false); onOnline?.() }}>Online Match <span>Play Memory Match online</span></button>
          <button type="button" onClick={() => { setMoreGamesOpen(false); onLocalPlay?.() }}>Pass &amp; Play <span>Share one device locally</span></button>
          <button type="button" onClick={() => { setMoreGamesOpen(false); onReveal?.() }}>Reveal <span>A secondary card-memory mode</span></button>
        </div>
      </Modal>
    </div>
  )
}
