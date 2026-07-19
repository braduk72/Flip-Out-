import { useEffect, useMemo, useRef, useState } from 'react'
import { useMotionMode } from '../ui/motion.js'
import { BOOSTER_ANIMATION_FRAMES, CARD_FAN_POSES, FOIL_REVEAL_PROFILES, PACK_OPENING_TIMELINE, allPackCardsRevealed, createPackOpeningPresentation, packPhaseFrame } from '../ui/packOpeningFlow.js'
import styles from './BoosterPackOpening.module.css'

function preloadFrames() {
  if (typeof Image === 'undefined') return Promise.resolve()
  return Promise.all(BOOSTER_ANIMATION_FRAMES.map(src => new Promise(resolve => {
    const image = new Image()
    image.onload = resolve
    image.onerror = resolve
    image.src = src
  })))
}

function durationFor(step, motion) {
  return motion === 'off' ? 0 : motion === 'reduced' ? Math.max(70, Math.round(step.duration * 0.28)) : step.duration
}

export default function BoosterPackOpening({ packId, cards, interruption = null, onCelebration, onComplete, onClose, onFeedback }) {
  const presentation = useMemo(() => createPackOpeningPresentation({ packId, cards, interruption }), [cards, interruption, packId])
  const motion = useMotionMode()
  const [phase, setPhase] = useState('idle')
  const [preloaded, setPreloaded] = useState(false)
  const [revealed, setRevealed] = useState(() => presentation.cards)
  const [foilEffect, setFoilEffect] = useState(null)
  const timers = useRef(new Set())
  const revealQueue = useRef(false)
  const revealedRef = useRef(presentation.cards)

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => { timers.current.delete(timer); callback() }, delay)
    timers.current.add(timer)
    return timer
  }

  useEffect(() => {
    let active = true
    const timerSet = timers.current
    preloadFrames().then(() => { if (active) setPreloaded(true) })
    return () => {
      active = false
      timerSet.forEach(window.clearTimeout)
      timerSet.clear()
    }
  }, [])

  const commitRevealed = nextCards => {
    revealedRef.current = nextCards
    setRevealed(nextCards)
  }

  const finish = nextCards => {
    if (!allPackCardsRevealed(nextCards)) return
    if (presentation.interruption) {
      setPhase('celebration-paused')
      onCelebration?.({ interruption: presentation.interruption, resume: () => { setPhase('complete'); onComplete?.(nextCards) } })
      return
    }
    setPhase('complete')
    onComplete?.(nextCards)
  }

  const showFoilEffect = card => {
    if (!card.foil) return
    const profile = FOIL_REVEAL_PROFILES[card.foilTier] ?? FOIL_REVEAL_PROFILES.standard
    setFoilEffect({ cardId: card.id, profile })
    navigator.vibrate?.(profile.hapticMs)
    onFeedback?.({ type: 'foil-reveal', card, profile })
    schedule(() => setFoilEffect(null), motion === 'full' ? 820 : 260)
  }

  const revealCard = index => {
    if (!['fan-ready', 'revealing'].includes(phase)) return
    const current = revealedRef.current
    if (current[index]?.revealed) return
    const nextCards = current.map((card, cardIndex) => cardIndex === index ? { ...card, revealed: true } : card)
    commitRevealed(nextCards)
    setPhase('revealing')
    showFoilEffect(nextCards[index])
    schedule(() => finish(nextCards), motion === 'full' ? 440 : 120)
  }

  const revealAll = () => {
    if (revealQueue.current || !['fan-ready', 'revealing'].includes(phase)) return
    revealQueue.current = true
    const revealNext = () => {
      const current = revealedRef.current
      const nextIndex = current.findIndex(card => !card.revealed)
      if (nextIndex < 0) return
      const next = current.map((card, index) => index === nextIndex ? { ...card, revealed: true } : card)
      commitRevealed(next)
      showFoilEffect(next[nextIndex])
      if (allPackCardsRevealed(next)) schedule(() => { revealQueue.current = false; finish(next) }, motion === 'full' ? 440 : 120)
      else schedule(revealNext, motion === 'full' ? 210 : 75)
    }
    setPhase('revealing')
    revealNext()
  }

  const start = () => {
    if (!preloaded || phase !== 'idle') return
    let stepIndex = 0
    const advance = () => {
      const step = PACK_OPENING_TIMELINE[stepIndex]
      if (!step) return
      setPhase(step.phase)
      stepIndex += 1
      if (stepIndex < PACK_OPENING_TIMELINE.length) schedule(advance, durationFor(step, motion))
    }
    advance()
  }

  const currentFrame = packPhaseFrame(phase)
  const canReveal = phase === 'fan-ready' || phase === 'revealing'
  const wrapperVisible = !['fan-ready', 'revealing', 'celebration-paused', 'complete'].includes(phase)

  return (
    <section className={styles.overlay} aria-label="Booster pack opening" data-phase={phase} data-motion={motion}>
      <div className={styles.stage}>
        <div className={styles.lightBloom} aria-hidden="true"/>
        <p className={styles.status} aria-live="polite">{phase === 'idle' ? 'Your five-card pack is ready.' : phase === 'fan-ready' ? 'Tap a card to reveal it, or reveal all.' : phase === 'celebration-paused' ? 'A collection celebration is ready.' : 'Opening your pack…'}</p>
        <div className={`${styles.packScene} ${styles[`phase_${phase}`] ?? ''}`}>
          <div className={styles.cards} data-fanned={canReveal || undefined}>
            {revealed.map((card, index) => {
              const pose = CARD_FAN_POSES[index]
              const isFoil = foilEffect?.cardId === card.id
              return <button key={card.id} type="button" className={`${styles.card} ${card.revealed ? styles.cardRevealed : ''} ${isFoil ? styles.cardFoil : ''}`} style={{ '--fan-x': `${pose.x}px`, '--fan-y': `${pose.y}px`, '--fan-rotate': `${pose.rotate}deg`, '--fan-delay': `${pose.delay}ms` }} aria-label={card.revealed ? `${card.name} revealed` : `Reveal card ${index + 1}`} disabled={!canReveal || card.revealed} onClick={() => revealCard(index)}>
                <span className={styles.cardInner}>
                  <span className={`${styles.cardFace} ${styles.cardBack}`}><img src="/images/back.webp" alt=""/></span>
                  <span className={`${styles.cardFace} ${styles.cardFront}`}><img src={card.asset} alt={card.revealed ? card.name : ''}/>{card.foil && <span className={styles.foilBadge} aria-hidden="true">FOIL</span>}</span>
                </span>
              </button>
            })}
          </div>
          {wrapperVisible && <img className={styles.packKeyframe} src={BOOSTER_ANIMATION_FRAMES[currentFrame - 1]} alt="" aria-hidden="true" draggable="false"/>}
          {foilEffect && <div className={`${styles.foilEffects} ${styles[`smoke_${foilEffect.profile.smoke}`] ?? ''} ${styles[`glow_${foilEffect.profile.glow}`] ?? ''}`} aria-hidden="true"><span/><span/><span/><i/><i/><i/></div>}
        </div>
        <div className={styles.actions}>
          {phase === 'idle' && <button type="button" className={styles.openButton} disabled={!preloaded} onClick={start}>{preloaded ? 'Open Pack' : 'Preparing pack…'}</button>}
          {canReveal && <button type="button" className={styles.revealAllButton} onClick={revealAll} disabled={revealed.every(card => card.revealed)}>Reveal All</button>}
          {(phase === 'complete' || phase === 'celebration-paused') && <button type="button" className={styles.closeButton} onClick={onClose}>Close preview</button>}
        </div>
      </div>
    </section>
  )
}
