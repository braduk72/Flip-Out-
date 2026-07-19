import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useMotionMode, usePageVisibility } from './motion.js'
import { useUiAudio } from './audio.js'
import styles from './components.module.css'

export function CardPanel({ as: Element = 'section', variant = 'standard', className = '', children, ...props }) {
  return <Element className={`${styles.cardPanel} ${styles[`panel_${variant}`] ?? ''} ${className}`} {...props}>{children}</Element>
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`] ?? ''} ${className}`}>{children}</span>
}

export function ProgressBar({ value, max, label, tone = 'teal', compact = false, unavailable = false }) {
  const safeMax = Number(max) > 0 ? Number(max) : 1
  const safeValue = Math.max(0, Math.min(Number(value) || 0, safeMax))
  const percent = unavailable ? 0 : Math.round((safeValue / safeMax) * 100)
  return (
    <div className={`${styles.progressWrap} ${compact ? styles.progressCompact : ''}`}>
      {label && <span className={styles.srOnly}>{label}</span>}
      <div
        className={`${styles.progressTrack} ${unavailable ? styles.progressUnavailable : ''}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={unavailable ? undefined : 0}
        aria-valuemax={unavailable ? undefined : safeMax}
        aria-valuenow={unavailable ? undefined : safeValue}
        aria-valuetext={unavailable ? 'Progress unavailable' : `${safeValue} of ${safeMax}, ${percent}%`}
      >
        <span className={`${styles.progressFill} ${styles[`progress_${tone}`] ?? ''}`} style={{ '--fo-progress': `${percent}%` }} />
      </div>
    </div>
  )
}

export function IconButton({ icon, label, className = '', tone = 'neutral', ...props }) {
  return <button type="button" className={`${styles.iconButton} ${styles[`iconButton_${tone}`] ?? ''} ${className}`} aria-label={label} {...props}><Icon name={icon} /></button>
}

export function Modal({ open, title, children, onDismiss, actions, tone = 'neutral' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const dialog = dialogRef.current
    const focusable = () => [...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(node => !node.disabled)
    focusable()[0]?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onDismiss?.(); return }
      if (event.key !== 'Tab') return
      const nodes = focusable()
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); opener?.focus?.() }
  }, [open, onDismiss])
  if (!open) return null
  return (
    <div className={styles.modalScrim} onMouseDown={event => { if (event.target === event.currentTarget) onDismiss?.() }}>
      <section ref={dialogRef} className={`${styles.modal} ${styles[`modal_${tone}`] ?? ''}`} role="dialog" aria-modal="true" aria-labelledby="fo-modal-title">
        {onDismiss && <IconButton icon="close" label="Close dialog" className={styles.modalClose} onClick={onDismiss} />}
        <h2 id="fo-modal-title">{title}</h2>
        <div className={styles.modalBody}>{children}</div>
        {actions && <div className={styles.modalActions}>{actions}</div>}
      </section>
    </div>
  )
}

export function LoadingState({ label = 'Loading player data…', compact = false }) {
  return <div className={`${styles.systemState} ${compact ? styles.systemStateCompact : ''}`} role="status" aria-live="polite"><span className={styles.spinner} aria-hidden="true"/><span>{label}</span></div>
}

export function ErrorState({ message = 'Player data could not be loaded.', onRetry, compact = false }) {
  return <div className={`${styles.systemState} ${styles.systemError} ${compact ? styles.systemStateCompact : ''}`} role="alert"><Icon name="alert"/><span>{message}</span>{onRetry && <button type="button" onClick={onRetry}><Icon name="retry"/> Retry</button>}</div>
}

export function EmptyState({ icon = 'info', title, detail, action }) {
  return <div className={styles.emptyState}><Icon name={icon} size={32}/><div><strong>{title}</strong>{detail && <span>{detail}</span>}</div>{action}</div>
}

function useAnimatedNumber(amount, motion) {
  const [display, setDisplay] = useState(() => Number(amount) || 0)
  const prior = useRef(display)
  useEffect(() => {
    const next = Number(amount) || 0
    if (motion !== 'full' || prior.current === next) { prior.current = next; setDisplay(next); return undefined }
    const start = prior.current
    const started = performance.now()
    let frame
    const tick = now => {
      const t = Math.min(1, (now - started) / 360)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (next - start) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else prior.current = next
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [amount, motion])
  return display
}

export function CurrencyCounter({ type, amount, status = 'ready', className = '' }) {
  const motion = useMotionMode()
  const display = useAnimatedNumber(amount, motion)
  const label = type === 'coins' ? 'Coins' : 'Stars'
  const unavailable = status === 'error' || amount == null
  return (
    <div className={`${styles.currencyCounter} ${styles[`currency_${type}`]} ${className}`} aria-label={unavailable ? `${label} unavailable` : `${Number(amount).toLocaleString()} ${label}`}>
      <span className={styles.currencyIcon} aria-hidden="true"><Icon name={type === 'coins' ? 'coin' : 'star'} size={27}/></span>
      <span className={styles.currencyValue}>{status === 'loading' ? '…' : unavailable ? '—' : display.toLocaleString()}</span>
      <span className={styles.srOnly}>{label}</span>
    </div>
  )
}

export function CoinStoreButton({ onClick, sfxOn = true }) {
  const audio = useUiAudio(sfxOn)
  return <IconButton icon="cart" label="Open Coin Store" tone="coin" onClick={() => { audio.coinStoreOpen(); onClick?.() }} />
}

export function PlayerSummary({ player, loading = false, onClick }) {
  const Element = onClick ? 'button' : 'div'
  const xpAvailable = player?.xp != null && player?.xpTarget != null
  return (
    <Element type={onClick ? 'button' : undefined} className={styles.playerSummary} onClick={onClick} aria-label={onClick ? 'Open player profile' : undefined}>
      <span className={styles.avatar} aria-hidden="true"><img src="/ui/avatar-frame.svg" alt=""/></span>
      <span className={styles.playerText}>
        <strong>{loading ? 'Loading…' : player?.playerName || 'Guest Player'}</strong>
        <span>{player?.level ? `Level ${player.level}` : 'Level not set'}{player?.accountKind === 'guest' && <Badge tone="guest">Guest</Badge>}</span>
        <ProgressBar compact unavailable={!xpAvailable} value={player?.xp ?? 0} max={player?.xpTarget ?? 1} label={xpAvailable ? `XP ${player.xp} of ${player.xpTarget}` : 'XP data unavailable'} tone="gold" />
      </span>
    </Element>
  )
}

export function SafeAreaHeader({ player, currencies, status = 'ready', onPlayerClick, onCoinStore, sfxOn = true }) {
  return (
    <header className={styles.safeHeader} data-safe-area="runtime">
      <div className={styles.headerRow}>
        <PlayerSummary player={player} loading={status === 'loading'} onClick={onPlayerClick}/>
        <img className={styles.brandLogo} src="/ui/flipout-logo.svg" alt="Flip-Out!"/>
        <div className={styles.currencyGroup}>
          <CurrencyCounter type="stars" amount={currencies?.stars} status={status}/>
          <CurrencyCounter type="coins" amount={currencies?.coins} status={status}/>
          <CoinStoreButton onClick={onCoinStore} sfxOn={sfxOn}/>
        </div>
      </div>
    </header>
  )
}

export function PromoCarousel({ items, autoRotateMs = 6500, sfxOn = true }) {
  const [index, setIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const pointerStart = useRef(null)
  const motion = useMotionMode()
  const visible = usePageVisibility()
  const audio = useUiAudio(sfxOn)
  const count = items.length

  useEffect(() => {
    if (count < 2 || motion !== 'full' || userPaused || interactionPaused || !visible) return undefined
    const timer = window.setInterval(() => setIndex(current => (current + 1) % count), autoRotateMs)
    return () => window.clearInterval(timer)
  }, [autoRotateMs, count, interactionPaused, motion, userPaused, visible])

  if (!count) return <CardPanel variant="promo"><EmptyState title="No promotions right now" detail="Your next Match-3 level is ready."/></CardPanel>
  const safeIndex = index % count
  const item = items[safeIndex]
  const move = (direction, manual = true) => {
    if (manual) { setUserPaused(true); audio.carouselChange() }
    setIndex(current => (current + direction + count) % count)
  }
  const goTo = next => { setUserPaused(true); audio.carouselChange(); setIndex(next) }
  return (
    <section
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Flip-Out promotions"
      onPointerDown={event => { pointerStart.current = event.clientX; setInteractionPaused(true) }}
      onPointerUp={event => {
        const start = pointerStart.current
        pointerStart.current = null
        setInteractionPaused(false)
        if (start == null) return
        const delta = event.clientX - start
        if (Math.abs(delta) >= 40) move(delta < 0 ? 1 : -1)
      }}
      onPointerCancel={() => { pointerStart.current = null; setInteractionPaused(false) }}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false) }}
    >
      <article className={styles.promoSlide} aria-label={`${safeIndex + 1} of ${count}: ${item.title}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(5,8,20,.98) 0%, rgba(5,8,20,.88) 38%, rgba(5,8,20,.18) 72%), url(${item.image})` }}>
        <img className={styles.promoFrame} src="/ui/promo-frame.svg" alt="" aria-hidden="true"/>
        <div className={styles.promoCopy}>
          <Badge tone={item.tone ?? 'feature'}>{item.eyebrow}</Badge>
          <h2>{item.title}</h2>
          <p>{item.detail}</p>
          {item.progress && <ProgressBar value={item.progress.current} max={item.progress.target} label={`${item.title}: ${item.progress.current} of ${item.progress.target}`} tone={item.progress.tone ?? 'teal'}/>}
          {item.action && <button type="button" className={styles.promoAction} onClick={item.action.onClick}>{item.action.label} <Icon name="right" size={18}/></button>}
        </div>
      </article>
      {count > 1 && <>
        <IconButton icon="left" label="Previous promotion" className={`${styles.carouselArrow} ${styles.carouselPrev}`} onClick={() => move(-1)}/>
        <IconButton icon="right" label="Next promotion" className={`${styles.carouselArrow} ${styles.carouselNext}`} onClick={() => move(1)}/>
        <div className={styles.carouselControls}>
          <div className={styles.carouselDots} role="group" aria-label={`Promotion ${safeIndex + 1} of ${count}`}>
            {items.map((entry, dot) => <button key={entry.id} type="button" className={dot === safeIndex ? styles.carouselDotActive : ''} aria-label={`Show promotion ${dot + 1}: ${entry.title}`} aria-current={dot === safeIndex ? 'true' : undefined} onClick={() => goTo(dot)}/>) }
          </div>
          {motion === 'full' && <button type="button" className={styles.carouselPause} aria-label={userPaused ? 'Resume automatic promotion rotation' : 'Pause automatic promotion rotation'} onClick={() => setUserPaused(value => !value)}><Icon name={userPaused ? 'play' : 'pause'} size={17}/></button>}
        </div>
      </>}
    </section>
  )
}

export function PrimaryPlayButton({ level, onClick, sfxOn = true, disabled = false }) {
  const audio = useUiAudio(sfxOn)
  const accessibleLabel = `Play Match-3${level ? `, continue Level ${level}` : ''}`
  return (
    <button type="button" className={styles.playButton} aria-label={accessibleLabel} onClick={() => { audio.playActivation(); navigator.vibrate?.(20); onClick?.() }} disabled={disabled}>
      <img className={styles.playFrame} src="/ui/play-frame.svg" alt="" aria-hidden="true"/>
      <span className={styles.playShine} aria-hidden="true"/>
      <span className={styles.playText}><strong>PLAY</strong><span>MATCH-3</span>{level && <small>Continue Level {level}</small>}</span>
      <span className={styles.playSparkles} aria-hidden="true"/>
    </button>
  )
}

export function ProgressCard({ icon, title, detail, value, max, tone = 'teal', badge, onClick, thumbnail, unavailable = false, className = '' }) {
  const Element = onClick ? 'button' : 'article'
  return (
    <Element type={onClick ? 'button' : undefined} className={`${styles.progressCard} ${className}`} onClick={onClick}>
      <span className={styles.progressIcon} aria-hidden="true">{thumbnail ? <img src={thumbnail} alt=""/> : <Icon name={icon} size={30}/>}</span>
      <span className={styles.progressContent}>
        <span className={styles.progressHeading}><strong>{title}</strong>{badge && <Badge tone={badge.tone}>{badge.label}</Badge>}</span>
        <span className={styles.progressDetail}>{detail}</span>
        {max != null && <ProgressBar value={value} max={max} label={`${title}: ${value} of ${max}`} tone={tone} unavailable={unavailable}/>}
      </span>
      {onClick && <Icon name="right" className={styles.progressChevron}/>}
    </Element>
  )
}

export function CollectionPreviewCard({ collection, onClick }) {
  const newest = collection?.newest
  return <ProgressCard icon="cards" thumbnail={newest?.asset} title={newest ? `Newest: ${newest.name}` : 'Build your collection'} detail={newest ? `${collection.owned} of ${collection.total} cards owned` : 'Your first collectible card is waiting'} value={collection?.owned ?? 0} max={collection?.total ?? 1} tone="cyan" badge={newest ? { label: newest.rarity, tone: newest.rarity } : null} onClick={onClick}/>
}

export function FoilProgressCard({ foil, onClick }) {
  return <ProgressCard icon="foil" title="Foil collection" detail={foil?.available ? `${foil.owned} Foil variants owned` : 'No authoritative Foil items are available yet'} value={foil?.owned ?? 0} max={foil?.target ?? 10} tone="foil" unavailable={!foil?.available} badge={{ label: 'Foil', tone: 'foil' }} onClick={onClick}/>
}

export function SeasonProgressCard({ season, onClick }) {
  return <ProgressCard icon="season" title={season?.label ?? 'Season'} detail={`Stage progress ${season?.current ?? 0} of ${season?.total ?? 32}`} value={season?.current ?? 0} max={season?.total ?? 32} tone="purple" onClick={onClick}/>
}

export function DailyRewardCard({ reward, onClaim, pending = false }) {
  if (!reward?.available) return null
  return <ProgressCard icon="rewards" title="Claim Daily Reward" detail={`${reward.nextReward?.amount ?? 0} Stars · Day ${reward.nextStreak ?? 1}`} badge={{ label: 'Ready', tone: 'ready' }} onClick={pending ? undefined : onClaim} className={styles.dailyReady}/>
}

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'collection', label: 'Collection', icon: 'collection' },
  { id: 'rewards', label: 'Rewards', icon: 'rewards' },
  { id: 'more', label: 'More', icon: 'more' },
]

export function BottomNavigation({ active = 'home', onNavigate }) {
  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = [...event.currentTarget.parentElement.querySelectorAll('[data-nav-item]')]
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }
  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {navItems.map((item, index) => <button key={item.id} type="button" data-nav-item className={item.id === active ? styles.navActive : ''} aria-current={item.id === active ? 'page' : undefined} onKeyDown={event => onKeyDown(event, index)} onClick={() => onNavigate?.(item.id)}><Icon name={item.icon} size={27}/><span>{item.label}</span></button>)}
    </nav>
  )
}
