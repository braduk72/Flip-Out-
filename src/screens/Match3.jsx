import { useEffect, useMemo, useRef, useState } from 'react'
import Match3FeedbackPanel from '../components/Match3FeedbackPanel.jsx'
import { objectiveProgress } from '../match3/engine.js'
import { MATCH3_LEVELS, MATCH3_TOKENS, getMatch3Level } from '../match3/levels.js'
import { cellIsInPresentation, createMatch3Presentation, isMatch3BoardInputLocked } from '../match3/presentation.js'
import Match3TokenImage from '../match3/Match3TokenImage.jsx'
import { CardPanel } from '../ui/components.jsx'
import { useMotionMode } from '../ui/motion.js'
import { playerGameApi } from '../utils/gameApi.js'
import { haptic, recordMatch3Event } from '../utils/match3Analytics.js'
import { loadMatch3Progress, loadMatch3Resume, resetMatch3Development, saveMatch3Progress, saveMatch3Resume } from '../utils/match3Storage.js'
import styles from './Match3.module.css'

const uid = prefix => `${prefix}:${crypto.randomUUID()}`
const TOKEN = new Map(MATCH3_TOKENS.map(token => [token.id, token]))
const REVIVE_TIERS = Object.freeze([
  { attempt: 1, label: 'Revive One', costCoins: 25, oddsPercent: 75 },
  { attempt: 2, label: 'Revive Two', costCoins: 50, oddsPercent: 50 },
  { attempt: 3, label: 'Revive Three', costCoins: 100, oddsPercent: 25 },
])
const objectiveLabel = objective => objective.type === 'score'
  ? `Score ${objective.target}`
  : objective.type === 'collect'
    ? `Collect ${objective.target} ${TOKEN.get(objective.token)?.label}`
    : objective.type === 'blockers' ? `Clear ${objective.target} blocker layers` : `Drop ${objective.target} objects`

export default function Match3({ onBack, initialLevel = null }) {
  const requestedInitialLevel = useMemo(() => {
    const requested = Number(initialLevel)
    return MATCH3_LEVELS.some(level => level.id === requested) ? requested : null
  }, [initialLevel])
  const [view, setView] = useState(() => requestedInitialLevel ? 'brief' : 'map')
  const [selectedLevel, setSelectedLevel] = useState(() => requestedInitialLevel ?? 1)
  const [session, setSession] = useState(null)
  const [progress, setProgress] = useState(loadMatch3Progress)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [coins, setCoins] = useState(0)
  const [rewardTheatre, setRewardTheatre] = useState(null)
  const [theatreClaim, setTheatreClaim] = useState(null)
  const [theatreBusy, setTheatreBusy] = useState(false)
  const [presentation, setPresentation] = useState(null)
  const presentationTimer = useRef(null)
  const motionMode = useMotionMode()

  useEffect(() => {
    let live = true
    playerGameApi.match3State().then(data => {
      if (!live) return
      const saved = { highestUnlockedLevel: Number(data.progress?.highest_unlocked_level ?? 1), completedLevels: data.progress?.completed_levels ?? {} }
      setProgress(saved)
      setRewardTheatre(data.rewardTheatre?.available ? data.rewardTheatre : null)
      saveMatch3Progress(saved)
      if (requestedInitialLevel) {
        saveMatch3Resume(null)
        return
      }
      if (data.resume) {
        setSession(data.resume)
        setSelectedLevel(data.resume.levelId)
        setView('game')
      }
    }).catch(() => {
      const resume = loadMatch3Resume()
      if (resume && !requestedInitialLevel) {
        setSession(resume)
        setSelectedLevel(resume.levelId)
        setView('game')
      }
    })
    return () => {
      live = false
      clearTimeout(presentationTimer.current)
    }
  }, [requestedInitialLevel])

  useEffect(() => {
    const settle = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(presentationTimer.current)
        setPresentation(null)
      }
    }
    document.addEventListener('visibilitychange', settle)
    return () => document.removeEventListener('visibilitychange', settle)
  }, [])

  async function start() {
    setBusy(true)
    setError('')
    clearTimeout(presentationTimer.current)
    setPresentation(null)
    try {
      const response = await playerGameApi.match3({ action: 'start', levelId: selectedLevel, requestId: uid('match3') })
      setSession(response.session)
      saveMatch3Resume(response.session)
      setView('game')
      recordMatch3Event('level-start', { levelId: selectedLevel })
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function action(body) {
    const previousState = session?.state
    clearTimeout(presentationTimer.current)
    if (body.action === 'move') setPresentation({ swapped: [body.from, body.to], cleared: [], triggered: [], created: [], cascades: [], cascadeCount: 0, durationMs: 0, phase: 'swap' })
    setBusy(true)
    setError('')
    try {
      const response = await playerGameApi.match3({ ...body, sessionId: session.sessionId })
      if (response.session) {
        const nextPresentation = createMatch3Presentation(previousState, response.session.state, body, motionMode)
        setSession(response.session)
        saveMatch3Resume(response.session)
        setPresentation(nextPresentation.durationMs > 0 ? nextPresentation : null)
        if (nextPresentation.cascadeCount) {
          haptic(nextPresentation.comboType ? 'special' : nextPresentation.cascadeCount > 1 ? 'cascade' : 'medium')
          recordMatch3Event('move-resolution', {
            levelId: selectedLevel,
            cascades: nextPresentation.cascadeCount,
            comboType: nextPresentation.comboType,
            scoreGained: nextPresentation.scoreGained,
          })
        }
        if (nextPresentation.durationMs > 0) presentationTimer.current = setTimeout(() => setPresentation(null), nextPresentation.durationMs)
        if (response.session.state.status === 'lost' && previousState?.status !== 'lost') recordMatch3Event('level-failure', { levelId: selectedLevel })
        if (response.session.state.status === 'won' && body.action !== 'complete') queueMicrotask(() => finish(response.session))
      }
      return response
    } catch (caught) {
      setPresentation(null)
      setError(caught.message)
      throw caught
    } finally {
      setBusy(false)
    }
  }

  async function finish(completedSession = session) {
    try {
      const response = await action({ action: 'complete' })
      setCoins(response.totalCoins)
      setRewardTheatre(response.rewardTheatre?.available ? response.rewardTheatre : null)
      setTheatreClaim(null)
      const saved = {
        highestUnlockedLevel: Math.min(20, Math.max(progress.highestUnlockedLevel, selectedLevel + 1)),
        completedLevels: { ...progress.completedLevels, [selectedLevel]: { coins: 10, score: completedSession.state.score } },
      }
      setProgress(saved)
      saveMatch3Progress(saved)
      saveMatch3Resume(null)
      recordMatch3Event('level-completion', { levelId: selectedLevel, movesUsed: getMatch3Level(selectedLevel).moves - completedSession.state.movesRemaining, coinsGranted: 10 })
      setView('win')
    } catch {
      // The action handler exposes the server error in the game UI.
    }
  }

  if (view === 'map') return <LevelMap progress={progress} onBack={onBack} onSelect={id => { setSelectedLevel(id); setView('brief') }} onReset={() => { if (confirm('Reset Match-3 development progress?')) { resetMatch3Development(); setProgress({ highestUnlockedLevel: 1, completedLevels: {} }) } }} />
  if (view === 'brief') return <Brief level={getMatch3Level(selectedLevel)} busy={busy} error={error} onBack={() => setView('map')} onStart={start} />
  async function claimTheatre() {
    if (!rewardTheatre?.available || theatreBusy) return
    setTheatreBusy(true)
    setError('')
    try {
      const claim = await playerGameApi.match3({ action: 'reward-theatre', milestone: rewardTheatre.milestone })
      setTheatreClaim(claim)
      setRewardTheatre(null)
      recordMatch3Event('reward-theatre', { milestone: claim.milestone, reward: claim.reward })
    } catch (caught) {
      setError(caught.message)
    } finally {
      setTheatreBusy(false)
    }
  }

  if (view === 'win') return <Result coins={coins} level={selectedLevel} movesUsed={session.state.level.moves - session.state.movesRemaining} error={error} rewardTheatre={rewardTheatre} theatreClaim={theatreClaim} theatreBusy={theatreBusy} onClaimTheatre={claimTheatre} onDouble={async () => { try { const advert = await playerGameApi.verifyAdvert({ provider: 'configured-provider', receipt: uid('receipt'), placement: 'match3-double', matchId: session.sessionId }); const response = await action({ action: 'double', advertCompletionId: advert.completionId }); setCoins(response.totalCoins); recordMatch3Event('coins-granted', { coins: 10, reason: 'advert-double' }) } catch { return null } }} onMap={() => { clearTimeout(presentationTimer.current); setPresentation(null); setView('map') }} onNext={() => { clearTimeout(presentationTimer.current); setPresentation(null); setSelectedLevel(Math.min(20, selectedLevel + 1)); setView('brief') }} />
  return <><GameBoard session={session} busy={busy} error={error} presentation={presentation} onMove={(from, to) => action({ action: 'move', actionId: uid('move'), from, to })} onPower={(powerUp, target) => action({ action: 'power-up', actionId: uid('power'), powerUp, target }).then(() => recordMatch3Event('power-up-used', { powerUp }))} onRevive={() => action({ action: 'revive', actionId: uid('revive') })} onRestart={() => { clearTimeout(presentationTimer.current); setPresentation(null); action({ action: 'restart', actionId: uid('restart') }) }} onQuit={() => { clearTimeout(presentationTimer.current); setPresentation(null); if (confirm('Quit this level? Your current board will remain available to resume.')) setView('map') }} />{import.meta.env.DEV && <Match3FeedbackPanel level={selectedLevel} result={session.state.status === 'won' ? 'won' : session.state.status === 'lost' ? 'lost' : 'quit'} movesUsed={session.state.level.moves - session.state.movesRemaining} />}</>
}

function LevelMap({ progress, onBack, onSelect, onReset }) {
  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="match3-journey">
    <header className={styles.header}><button className={styles.backBtn} onClick={onBack} aria-label="Back to Home"><span aria-hidden="true">‹</span></button><h1>Match-3 Journey</h1></header>
    <div className={styles.journeyContent}>
      <CardPanel className={styles.journeyIntro}><span className={styles.eyebrow}>Earned progression</span><h2>Keep your journey moving</h2><p>Complete objectives, earn Coins and unlock the next challenge.</p></CardPanel>
      <div className={styles.levels}>{MATCH3_LEVELS.map(level => { const unlocked = level.id <= progress.highestUnlockedLevel || import.meta.env.DEV; const complete = progress.completedLevels?.[level.id]; return <button key={level.id} disabled={!unlocked} className={complete ? styles.complete : ''} onClick={() => onSelect(level.id)} aria-label={`${level.name}, ${unlocked ? 'unlocked' : 'locked'}`}><span className={styles.levelNumber}>Level {level.id}</span><strong>{level.name}</strong><span className={styles.levelObjective}>{complete ? `Complete · ${complete.coins ?? 10} Coins` : unlocked ? objectiveLabel(level.objectives[0]) : 'Locked'}</span></button> })}</div>
      {import.meta.env.DEV && <button className={styles.dev} onClick={onReset}>Reset development progress</button>}
    </div>
  </main>
}

function Brief({ level, busy, error, onBack, onStart }) {
  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="match3-brief"><header className={styles.header}><button className={styles.backBtn} onClick={onBack} aria-label="Back to level journey"><span aria-hidden="true">‹</span></button><h1>{level.name}</h1></header><div className={styles.briefContent}>{level.teaching && <CardPanel className={styles.teach}><span className={styles.eyebrow}>Level lesson</span><p>{level.teaching}</p></CardPanel>}<CardPanel className={styles.card}><span className={styles.eyebrow}>Level {level.id}</span><h2>Objectives</h2><ul>{level.objectives.map((objective, index) => <li key={index}>{objectiveLabel(objective)}</li>)}</ul><p className={styles.moveBudget}>{level.moves} moves</p></CardPanel><button className={styles.primary} disabled={busy} onClick={onStart}>{busy ? 'Preparing…' : 'Play Match-3'}</button><p role="alert">{error}</p></div></main>
}

function Result({ coins, level, movesUsed, error, rewardTheatre, theatreClaim, theatreBusy, onClaimTheatre, onDouble, onMap, onNext }) {
  return <main className={`${styles.result} foTheme`} data-concept-screen="route" data-screen="match3-result"><div aria-hidden="true" className={styles.resultIcon}>●</div><h1>Level complete!</h1><p className={styles.starAward}>+{coins} Coins</p><p role="alert">{error}</p>{rewardTheatre?.available && <RewardTheatrePanel rewardTheatre={rewardTheatre} busy={theatreBusy} onClaim={onClaimTheatre}/>} {theatreClaim && <RewardTheatreReels claim={theatreClaim}/>} {coins === 10 && <button onClick={onDouble}>Watch verified advert to double to 20 Coins</button>}<button className={styles.primary} onClick={onNext}>Next level</button><button onClick={onMap}>Level journey</button>{import.meta.env.DEV && <Match3FeedbackPanel level={level} result="won" movesUsed={movesUsed} />}</main>
}

function RewardTheatrePanel({ rewardTheatre, busy, onClaim }) {
  return <section className={styles.theatrePanel} aria-labelledby="reward-theatre-title">
    <span className={styles.eyebrow}>Every 5 levels</span>
    <h2 id="reward-theatre-title">Reward Theatre unlocked!</h2>
    <p>Milestone {rewardTheatre.milestone}: spin the reels for a committed server reward.</p>
    <button className={styles.theatreButton} type="button" disabled={busy} onClick={onClaim}>{busy ? 'Preparing reels…' : 'Spin Reward Theatre'}</button>
  </section>
}

function RewardTheatreReels({ claim }) {
  const presentation = claim.presentation
  const label = presentation?.label ?? rewardText(claim.reward)
  return <section className={styles.theatreStage} aria-live="polite" aria-label={`Reward Theatre prize: ${label}`}>
    <div className={styles.reels} aria-hidden="true">
      {presentation?.reels?.map(reel => <div key={reel.reel} className={styles.reel} style={{ '--reel-delay': `${(reel.reel - 1) * 180}ms` }}>
        {reel.symbols.map((symbol, index) => <span key={`${symbol.id}:${index}`} className={`${styles.reelSymbol} ${styles[`symbol_${symbol.kind}`] ?? ''}`}>{symbolIcon(symbol.kind)}<small>{symbol.label}</small></span>)}
      </div>)}
    </div>
    <div className={styles.theatrePrize}><span>Prize</span><strong>{label}</strong></div>
  </section>
}

function rewardText(reward = {}) {
  if (reward.currencyId) return `${reward.amount} ${reward.currencyId === 'coins' ? 'Coins' : reward.currencyId}`
  if (reward.itemId?.includes('random')) return 'Random Booster'
  if (reward.itemId?.includes('themed')) return 'Themed Booster'
  return reward.itemId?.split(':').at(-1)?.replaceAll('-', ' ') ?? 'Reward'
}

function symbolIcon(kind) {
  if (kind === 'coins') return '●'
  if (kind === 'booster') return '▣'
  return '✦'
}

export function GameBoard({ session, busy, error, presentation, onMove, onPower, onRevive, onRestart, onQuit }) {
  const state = session.state
  const motionMode = useMotionMode()
  const [selected, setSelected] = useState(null)
  const [power, setPower] = useState(null)
  const [paused, setPaused] = useState(false)
  const [slowAnimations, setSlowAnimations] = useState(false)
  const [dragState, setDragState] = useState(null)
  const [reviveOutcome, setReviveOutcome] = useState(null)
  const drag = useRef(null)
  const dragReturnTimer = useRef(null)
  const suppressClick = useRef(false)
  const moveInFlight = useRef(false)
  const level = state.level
  const locked = isMatch3BoardInputLocked({ status: state.status, paused, busy, presentation })
  const lockReason = busy ? 'server request' : paused ? 'paused' : state.status !== 'active' ? state.status : presentation?.durationMs > 0 ? presentation.phase : 'unlocked'
  const rows = state.board.length
  const columns = state.board[0].length
  const summary = useMemo(() => `Level ${level.id}. ${state.movesRemaining} moves left. Score ${state.score}.`, [level.id, state.movesRemaining, state.score])
  const diagnosticsEnabled = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname !== 'flipout.app' && new URLSearchParams(window.location.search).has('match3Diagnostics'))
  const nextRevive = REVIVE_TIERS[state.revives?.length ?? 0] ?? null

  useEffect(() => () => clearTimeout(dragReturnTimer.current), [])

  function choose(row, column) {
    if (locked || moveInFlight.current || suppressClick.current) return
    if (power) {
      onPower(power, { r: row, c: column }).then(() => setPower(null)).catch(() => {})
      return
    }
    const next = { r: row, c: column }
    if (selected && Math.abs(selected.r - row) + Math.abs(selected.c - column) === 1) {
      moveInFlight.current = true
      onMove(selected, next).catch(() => {}).finally(() => { moveInFlight.current = false })
      setSelected(null)
    } else {
      setSelected(next)
      haptic('light')
    }
  }

  function intendedDestination(source, deltaX, deltaY) {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) <= 18) return null
    const destination = Math.abs(deltaX) > Math.abs(deltaY)
      ? { r: source.r, c: source.c + Math.sign(deltaX) }
      : { r: source.r + Math.sign(deltaY), c: source.c }
    return destination.r >= 0 && destination.r < rows && destination.c >= 0 && destination.c < columns ? destination : null
  }

  function beginDrag(event, row, column, tokenId) {
    if (locked || moveInFlight.current) return
    event.preventDefault()
    let capture = false
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      capture = event.currentTarget.hasPointerCapture?.(event.pointerId) ?? false
    } catch {
      // Pointer capture can be unavailable in older embedded webviews. The
      // board-level touch-action rule still prevents the page from scrolling.
    }
    const source = { r: row, c: column }
    const next = {
      pointerId: event.pointerId,
      pointerType: event.pointerType || 'mouse',
      source,
      tokenId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      destination: null,
      thresholdPassed: false,
      capture,
      phase: 'dragging',
    }
    drag.current = next
    setDragState(next)
    setSelected(source)
  }

  function moveDrag(event) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId || locked) return
    event.preventDefault()
    const deltaX = event.clientX - current.startX
    const deltaY = event.clientY - current.startY
    const destination = intendedDestination(current.source, deltaX, deltaY)
    const next = {
      ...current,
      currentX: event.clientX,
      currentY: event.clientY,
      deltaX,
      deltaY,
      destination,
      thresholdPassed: Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 18,
      capture: event.currentTarget.hasPointerCapture?.(event.pointerId) ?? current.capture,
    }
    drag.current = next
    setDragState(next)
  }

  function clearDrag() {
    clearTimeout(dragReturnTimer.current)
    dragReturnTimer.current = null
    drag.current = null
    setDragState(null)
  }

  function returnDraggedToken(current) {
    const returning = { ...current, deltaX: 0, deltaY: 0, destination: null, phase: 'returning' }
    drag.current = returning
    setDragState(returning)
    clearTimeout(dragReturnTimer.current)
    dragReturnTimer.current = window.setTimeout(clearDrag, motionMode === 'full' ? 180 : 40)
  }

  function keyDown(event, row, column) {
    let next
    if (event.key === 'ArrowLeft') next = { r: row, c: Math.max(0, column - 1) }
    if (event.key === 'ArrowRight') next = { r: row, c: Math.min(columns - 1, column + 1) }
    if (event.key === 'ArrowUp') next = { r: Math.max(0, row - 1), c: column }
    if (event.key === 'ArrowDown') next = { r: Math.min(rows - 1, row + 1), c: column }
    if (next) {
      event.preventDefault()
      event.currentTarget.parentElement?.querySelector(`[data-cell="${next.r}:${next.c}"]`)?.focus()
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(row, column)
    }
  }

  async function endDrag(event) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    event.preventDefault()
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (!current.thresholdPassed || !current.destination || locked || moveInFlight.current) {
      if (current.thresholdPassed) suppressClick.current = true
      returnDraggedToken(current)
      window.setTimeout(() => { suppressClick.current = false }, 0)
      return
    }
    suppressClick.current = true
    moveInFlight.current = true
    const cell = event.currentTarget.getBoundingClientRect()
    const committed = {
      ...current,
      deltaX: (current.destination.c - current.source.c) * cell.width,
      deltaY: (current.destination.r - current.source.r) * cell.height,
      phase: 'committed',
    }
    drag.current = committed
    setDragState(committed)
    try {
      await onMove(current.source, current.destination)
      clearDrag()
      setSelected(null)
    } catch {
      returnDraggedToken(committed)
    } finally {
      moveInFlight.current = false
      window.setTimeout(() => { suppressClick.current = false }, 0)
    }
  }

  async function tryRevive() {
    if (!nextRevive || busy || !onRevive) return
    setReviveOutcome({ spinning: true, ...nextRevive })
    try {
      const response = await onRevive()
      setReviveOutcome({ spinning: false, ...(response.revive ?? nextRevive) })
      window.setTimeout(() => setReviveOutcome(null), 1800)
    } catch (caught) {
      setReviveOutcome({ spinning: false, success: false, error: caught.message, ...nextRevive })
    }
  }

  const boardClass = [styles.board, presentation?.phase === 'swap' ? styles.swapping : '', presentation?.invalidSwap ? styles.invalidSwap : '', presentation?.phase === 'shuffle' ? styles.shuffling : '', presentation?.cascadeCount ? styles.resolving : '', presentation?.comboType ? styles.specialResolution : ''].filter(Boolean).join(' ')
  return <main className={`${styles.game} foTheme`} data-concept-screen="gameplay" data-screen="match3-game">
    <div className={styles.gameTop}><button onClick={onQuit}>Quit</button><strong>Level {level.id}</strong><button onClick={() => setPaused(true)}>Pause</button></div>
    <div className={styles.stats}><span>Score <strong>{state.score.toLocaleString()}</strong></span><span>Moves <strong>{state.movesRemaining}</strong></span></div>
    <div className={styles.objectives}>{level.objectives.map((objective, index) => <span key={index}>{objectiveLabel(objective)}: {objectiveProgress(state, objective)}/{objective.target}</span>)}</div>
    <p className={styles.sr} aria-live="polite">{summary}{selected ? ` Selected row ${selected.r + 1}, column ${selected.c + 1}.` : ''}{presentation?.label ? ` ${presentation.label} Plus ${presentation.scoreGained} points.` : ''}</p>
    <div className={styles.boardShell} style={{ '--board-rows': rows, '--board-columns': columns, '--animation-scale': slowAnimations ? 4 : 1 }}>
      {presentation?.invalidSwap && <div className={styles.invalidBanner} aria-live="polite">Try another swap</div>}
      {presentation?.label && <div className={styles.comboBanner} aria-hidden="true"><strong>{presentation.label}</strong>{presentation.cascadeCount > 1 && <span>×{presentation.cascadeCount} cascade</span>}</div>}
      {presentation?.scoreGained > 0 && <div className={styles.scoreBurst} aria-hidden="true">+{presentation.scoreGained.toLocaleString()}</div>}
      <div className={boardClass} role="grid" aria-label={summary} aria-busy={locked} data-input-locked={locked ? 'true' : 'false'}>
        {state.board.map((row, rowIndex) => row.map((cell, columnIndex) => <Tile key={`${rowIndex}:${columnIndex}`} cell={cell} row={rowIndex} column={columnIndex} columns={columns} selected={selected?.r === rowIndex && selected?.c === columnIndex} presentation={presentation} dragState={dragState} onChoose={choose} onKeyDown={keyDown} onPointerDown={event => beginDrag(event, rowIndex, columnIndex, cell.token)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => { if (drag.current) returnDraggedToken(drag.current) }} />))}
      </div>
      <BoardEffects presentation={presentation} rows={rows} columns={columns} />
    </div>
    <div className={styles.powers}>{['hammer', 'shuffle', 'line-blast', 'color-clear', 'extra-moves'].map(current => <button key={current} disabled={locked} className={power === current ? styles.active : ''} onClick={() => { if (current === 'shuffle' || current === 'extra-moves') onPower(current, null).catch(() => {}); else setPower(power === current ? null : current) }}>{current.replaceAll('-', ' ')}</button>)}</div>
    {busy && <p className={styles.resolvingText} aria-live="polite">Resolving…</p>}
    <p role="alert">{error}</p>
    {reviveOutcome && state.status !== 'lost' && <div className={`${styles.reviveToast} ${reviveOutcome.success ? styles.reviveSuccess : styles.reviveFail}`} role="status">{reviveOutcome.success ? 'Revived! 5 moves added.' : 'Revive missed.'}</div>}
    {state.status === 'lost' && <div className={styles.modal}><div><h2>Out of moves</h2>{nextRevive ? <><p>{nextRevive.label}: spend {nextRevive.costCoins} Coins for a {nextRevive.oddsPercent}% revive chance.</p><div className={`${styles.reviveSpinner} ${reviveOutcome?.spinning ? styles.reviveSpinning : ''}`} aria-hidden="true"><span /></div>{reviveOutcome && !reviveOutcome.spinning && <p className={reviveOutcome.success ? styles.reviveSuccessText : styles.reviveFailText}>{reviveOutcome.error ?? (reviveOutcome.success ? 'Success! The board is coming back with 5 moves.' : 'No luck this time. You can try the next revive or retry the level.')}</p>}<button onClick={() => { recordMatch3Event('continue-used', { method: 'revive', attempt: nextRevive.attempt }); tryRevive() }} disabled={busy || reviveOutcome?.spinning}>{reviveOutcome?.spinning ? 'Spinning…' : `${nextRevive.label} - ${nextRevive.costCoins} Coins`}</button></> : <p>No revives remaining for this level.</p>}<button onClick={onRestart}>Retry</button><button onClick={onQuit}>Level map</button></div></div>}
    {paused && <div className={styles.modal}><div><h2>Paused</h2><button onClick={() => setPaused(false)}>Resume</button><button onClick={onRestart}>Restart</button><button onClick={onQuit}>Quit</button></div></div>}
    {diagnosticsEnabled && <aside className={styles.diagnostics} aria-label="Match-3 drag diagnostics"><strong>DEV DRAG DIAGNOSTICS</strong><span>Phase: {dragState?.phase ?? presentation?.phase ?? 'idle'}</span><span>Lock: {locked ? lockReason : 'none'}</span><span>Pointer down: {dragState ? `${Math.round(dragState.startX)}, ${Math.round(dragState.startY)}` : 'none'}</span><span>Pointer now: {dragState ? `${Math.round(dragState.currentX)}, ${Math.round(dragState.currentY)}` : 'none'}</span><span>Delta: {dragState ? `${Math.round(dragState.deltaX)}, ${Math.round(dragState.deltaY)}` : '0, 0'}</span><span>Token: {dragState?.tokenId ?? 'none'}</span><span>Source: {dragState ? `${dragState.source.r}:${dragState.source.c}` : 'none'}</span><span>Destination: {dragState?.destination ? `${dragState.destination.r}:${dragState.destination.c}` : 'none'}</span><span>Capture: {dragState?.capture ? 'yes' : 'no'}</span><span>Threshold: {dragState?.thresholdPassed ? 'passed' : 'waiting'}</span><span>Transform: {dragState ? `translate3d(${Math.round(dragState.deltaX)}px, ${Math.round(dragState.deltaY)}px, 0)` : 'none'}</span><span>Motion: {motionMode}</span><span>Revision: {state.revision ?? state.movesRemaining}</span><button onClick={() => setSlowAnimations(value => !value)}>{slowAnimations ? 'Normal speed' : 'Slow to 25%'}</button></aside>}
  </main>
}

function BoardEffects({ presentation, rows, columns }) {
  if (!presentation?.cascadeCount) return null
  return <div className={styles.effects} aria-hidden="true">
    {presentation.cleared.slice(0, 32).map((position, index) => <span key={`${position.r}:${position.c}`} className={styles.particleBurst} style={{ '--effect-x': `${((position.c + 0.5) / columns) * 100}%`, '--effect-y': `${((position.r + 0.5) / rows) * 100}%`, '--effect-delay': `${(index % 6) * 24}ms` }}>{Array.from({ length: 4 }, (_, particle) => <i key={particle} style={{ '--particle-angle': `${particle * 90 + (index % 3) * 15}deg` }} />)}</span>)}
    {presentation.comboType?.includes('line') && <><span className={`${styles.blastBeam} ${styles.horizontalBeam}`} /><span className={`${styles.blastBeam} ${styles.verticalBeam}`} /></>}
    {presentation.comboType?.includes('wrapped') && <span className={styles.explosionRing} />}
    {presentation.comboType?.includes('color') && <span className={styles.rainbowWash} />}
  </div>
}

function Tile({ cell, row, column, columns, selected, presentation, dragState, onChoose, onKeyDown, ...events }) {
  if (cell.hole) return <span className={`${styles.tile} ${styles.hole}`} role="gridcell" aria-label={`Row ${row + 1}, column ${column + 1}, unusable`} />
  const token = TOKEN.get(cell.token)
  const special = cell.special === 'bomb' ? 'wrapped' : cell.special
  const parts = [token?.label ?? 'empty']
  if (cell.drop) parts.push('drop object')
  if (special) parts.push(`${special} special`)
  if (cell.crate) parts.push(`${cell.crate} layer crate`)
  if (cell.ice) parts.push('ice')
  if (cell.chain) parts.push('chained')
  const classes = [
    styles.tile,
    selected ? styles.selected : '',
    special ? styles[`special_${special}`] : '',
    cellIsInPresentation(presentation, 'swapped', row, column) ? styles.swapTile : '',
    cellIsInPresentation(presentation, 'cleared', row, column) ? styles.clearedTile : '',
    cellIsInPresentation(presentation, 'triggered', row, column) ? styles.triggeredTile : '',
    cellIsInPresentation(presentation, 'created', row, column) ? styles.createdTile : '',
    dragState?.source.r === row && dragState?.source.c === column ? styles.draggingTile : '',
    dragState?.destination?.r === row && dragState?.destination?.c === column ? styles.dragPreviewTile : '',
  ].filter(Boolean).join(' ')
  const swap = presentation?.swapped?.find(position => position.r === row && position.c === column)
  const other = swap ? presentation.swapped.find(position => position.r !== row || position.c !== column) : null
  const style = { '--tile-index': (row * columns) + column }
  if (other) {
    style['--swap-x'] = `${(other.c - column) * 100}%`
    style['--swap-y'] = `${(other.r - row) * 100}%`
  }
  if (dragState?.source.r === row && dragState?.source.c === column) {
    style['--drag-x'] = `${dragState.deltaX}px`
    style['--drag-y'] = `${dragState.deltaY}px`
  }
  if (dragState?.destination?.r === row && dragState?.destination?.c === column) {
    const previewFactor = dragState.phase === 'committed' ? 1 : 0.22
    style['--preview-x'] = `${-dragState.deltaX * previewFactor}px`
    style['--preview-y'] = `${-dragState.deltaY * previewFactor}px`
  }
  return <button type="button" data-cell={`${row}:${column}`} data-drag-phase={dragState?.source.r === row && dragState?.source.c === column ? dragState.phase : undefined} role="gridcell" aria-selected={selected} aria-label={`Row ${row + 1}, column ${column + 1}: ${parts.join(', ')}`} className={classes} style={style} onClick={() => onChoose(row, column)} onKeyDown={event => onKeyDown(event, row, column)} {...events}>
    <Match3TokenImage tokenId={cell.token} className={styles.tokenImage} decorative />
    {cell.drop && <span className={styles.dropObject}>⬇</span>}
    {special && <span className={`${styles.special} ${styles[`specialGraphic_${special}`]}`} aria-hidden="true">{special === 'row' || special === 'col' ? <img src="/images/cards/special/rocket.webp" alt="" /> : <span className={styles.sunGraphic} />}</span>}
    {cell.crate > 0 && <span className={styles.blocker}>◇{cell.crate}</span>}
    {cell.ice > 0 && <span className={styles.ice}>❄</span>}
    {cell.chain > 0 && <span className={styles.chain}>⌁</span>}
  </button>
}
