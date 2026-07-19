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
const objectiveLabel = objective => objective.type === 'score'
  ? `Score ${objective.target}`
  : objective.type === 'collect'
    ? `Collect ${objective.target} ${TOKEN.get(objective.token)?.label}`
    : objective.type === 'blockers' ? `Clear ${objective.target} blocker layers` : `Drop ${objective.target} objects`

export default function Match3({ onBack }) {
  const [view, setView] = useState('map')
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [session, setSession] = useState(null)
  const [progress, setProgress] = useState(loadMatch3Progress)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stars, setStars] = useState(0)
  const [presentation, setPresentation] = useState(null)
  const presentationTimer = useRef(null)
  const motionMode = useMotionMode()

  useEffect(() => {
    let live = true
    playerGameApi.match3State().then(data => {
      if (!live) return
      const saved = { highestUnlockedLevel: Number(data.progress?.highest_unlocked_level ?? 1), completedLevels: data.progress?.completed_levels ?? {} }
      setProgress(saved)
      saveMatch3Progress(saved)
      if (data.resume) {
        setSession(data.resume)
        setSelectedLevel(data.resume.levelId)
        setView('game')
      }
    }).catch(() => {
      const resume = loadMatch3Resume()
      if (resume) {
        setSession(resume)
        setSelectedLevel(resume.levelId)
        setView('game')
      }
    })
    return () => {
      live = false
      clearTimeout(presentationTimer.current)
    }
  }, [])

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
      setStars(response.totalStars)
      const saved = {
        highestUnlockedLevel: Math.min(20, Math.max(progress.highestUnlockedLevel, selectedLevel + 1)),
        completedLevels: { ...progress.completedLevels, [selectedLevel]: { stars: 30, score: completedSession.state.score } },
      }
      setProgress(saved)
      saveMatch3Progress(saved)
      saveMatch3Resume(null)
      recordMatch3Event('level-completion', { levelId: selectedLevel, movesUsed: getMatch3Level(selectedLevel).moves - completedSession.state.movesRemaining, starsGranted: 30 })
      setView('win')
    } catch {
      // The action handler exposes the server error in the game UI.
    }
  }

  if (view === 'map') return <LevelMap progress={progress} onBack={onBack} onSelect={id => { setSelectedLevel(id); setView('brief') }} onReset={() => { if (confirm('Reset Match-3 development progress?')) { resetMatch3Development(); setProgress({ highestUnlockedLevel: 1, completedLevels: {} }) } }} />
  if (view === 'brief') return <Brief level={getMatch3Level(selectedLevel)} busy={busy} error={error} onBack={() => setView('map')} onStart={start} />
  if (view === 'win') return <Result stars={stars} level={selectedLevel} movesUsed={session.state.level.moves - session.state.movesRemaining} error={error} onDouble={async () => { try { const advert = await playerGameApi.verifyAdvert({ provider: 'configured-provider', receipt: uid('receipt'), placement: 'match3-double', matchId: session.sessionId }); const response = await action({ action: 'double', advertCompletionId: advert.completionId }); setStars(response.totalStars); recordMatch3Event('stars-granted', { stars: 30, reason: 'advert-double' }) } catch { return null } }} onMap={() => { clearTimeout(presentationTimer.current); setPresentation(null); setView('map') }} onNext={() => { clearTimeout(presentationTimer.current); setPresentation(null); setSelectedLevel(Math.min(20, selectedLevel + 1)); setView('brief') }} />
  return <><GameBoard session={session} busy={busy} error={error} presentation={presentation} onMove={(from, to) => action({ action: 'move', actionId: uid('move'), from, to })} onPower={(powerUp, target) => action({ action: 'power-up', actionId: uid('power'), powerUp, target }).then(() => recordMatch3Event('power-up-used', { powerUp }))} onRestart={() => { clearTimeout(presentationTimer.current); setPresentation(null); action({ action: 'restart', actionId: uid('restart') }) }} onQuit={() => { clearTimeout(presentationTimer.current); setPresentation(null); if (confirm('Quit this level? Your current board will remain available to resume.')) setView('map') }} />{import.meta.env.DEV && <Match3FeedbackPanel level={selectedLevel} result={session.state.status === 'won' ? 'won' : session.state.status === 'lost' ? 'lost' : 'quit'} movesUsed={session.state.level.moves - session.state.movesRemaining} />}</>
}

function LevelMap({ progress, onBack, onSelect, onReset }) {
  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="match3-journey">
    <header className={styles.header}><button className={styles.backBtn} onClick={onBack} aria-label="Back to Home"><span aria-hidden="true">‹</span></button><h1>Match-3 Journey</h1></header>
    <div className={styles.journeyContent}>
      <CardPanel className={styles.journeyIntro}><span className={styles.eyebrow}>Earned progression</span><h2>Keep your journey moving</h2><p>Complete objectives, earn Stars and unlock the next challenge.</p></CardPanel>
      <div className={styles.levels}>{MATCH3_LEVELS.map(level => { const unlocked = level.id <= progress.highestUnlockedLevel || import.meta.env.DEV; const complete = progress.completedLevels?.[level.id]; return <button key={level.id} disabled={!unlocked} className={complete ? styles.complete : ''} onClick={() => onSelect(level.id)} aria-label={`${level.name}, ${unlocked ? 'unlocked' : 'locked'}`}><span className={styles.levelNumber}>Level {level.id}</span><strong>{level.name}</strong><span className={styles.levelObjective}>{complete ? `Complete · ${complete.stars ?? 0} Stars` : unlocked ? objectiveLabel(level.objectives[0]) : 'Locked'}</span></button> })}</div>
      {import.meta.env.DEV && <button className={styles.dev} onClick={onReset}>Reset development progress</button>}
    </div>
  </main>
}

function Brief({ level, busy, error, onBack, onStart }) {
  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="match3-brief"><header className={styles.header}><button className={styles.backBtn} onClick={onBack} aria-label="Back to level journey"><span aria-hidden="true">‹</span></button><h1>{level.name}</h1></header><div className={styles.briefContent}>{level.teaching && <CardPanel className={styles.teach}><span className={styles.eyebrow}>Level lesson</span><p>{level.teaching}</p></CardPanel>}<CardPanel className={styles.card}><span className={styles.eyebrow}>Level {level.id}</span><h2>Objectives</h2><ul>{level.objectives.map((objective, index) => <li key={index}>{objectiveLabel(objective)}</li>)}</ul><p className={styles.moveBudget}>{level.moves} moves</p></CardPanel><button className={styles.primary} disabled={busy} onClick={onStart}>{busy ? 'Preparing…' : 'Play Match-3'}</button><p role="alert">{error}</p></div></main>
}

function Result({ stars, level, movesUsed, error, onDouble, onMap, onNext }) {
  return <main className={`${styles.result} foTheme`} data-concept-screen="route" data-screen="match3-result"><div aria-hidden="true" className={styles.resultIcon}>★</div><h1>Level complete!</h1><p className={styles.starAward}>+{stars} Stars</p><p role="alert">{error}</p>{stars === 30 && <button onClick={onDouble}>Watch verified advert to double</button>}<button className={styles.primary} onClick={onNext}>Next level</button><button onClick={onMap}>Level journey</button>{import.meta.env.DEV && <Match3FeedbackPanel level={level} result="won" movesUsed={movesUsed} />}</main>
}

export function GameBoard({ session, busy, error, presentation, onMove, onPower, onRestart, onQuit }) {
  const state = session.state
  const motionMode = useMotionMode()
  const [selected, setSelected] = useState(null)
  const [power, setPower] = useState(null)
  const [paused, setPaused] = useState(false)
  const [slowAnimations, setSlowAnimations] = useState(false)
  const drag = useRef(null)
  const moveInFlight = useRef(false)
  const level = state.level
  const locked = isMatch3BoardInputLocked({ status: state.status, paused, busy, presentation })
  const lockReason = busy ? 'server request' : paused ? 'paused' : state.status !== 'active' ? state.status : presentation?.durationMs > 0 ? presentation.phase : 'unlocked'
  const rows = state.board.length
  const columns = state.board[0].length
  const summary = useMemo(() => `Level ${level.id}. ${state.movesRemaining} moves left. Score ${state.score}.`, [level.id, state.movesRemaining, state.score])

  function choose(row, column) {
    if (locked || moveInFlight.current) return
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

  function dragEnd(event, row, column) {
    const start = drag.current
    drag.current = null
    if (!start || locked) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 18) {
      const to = Math.abs(deltaX) > Math.abs(deltaY) ? { r: row, c: column + Math.sign(deltaX) } : { r: row + Math.sign(deltaY), c: column }
      if (to.r >= 0 && to.r < rows && to.c >= 0 && to.c < columns) {
        if (moveInFlight.current) return
        moveInFlight.current = true
        onMove({ r: row, c: column }, to).catch(() => {}).finally(() => { moveInFlight.current = false })
        return
      }
    }
    choose(row, column)
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
        {state.board.map((row, rowIndex) => row.map((cell, columnIndex) => <Tile key={`${rowIndex}:${columnIndex}`} cell={cell} row={rowIndex} column={columnIndex} columns={columns} selected={selected?.r === rowIndex && selected?.c === columnIndex} presentation={presentation} onChoose={choose} onKeyDown={keyDown} onPointerDown={event => { event.currentTarget.setPointerCapture?.(event.pointerId); drag.current = { x: event.clientX, y: event.clientY } }} onPointerUp={event => dragEnd(event, rowIndex, columnIndex)} onPointerCancel={() => { drag.current = null }} />))}
      </div>
      <BoardEffects presentation={presentation} rows={rows} columns={columns} />
    </div>
    <div className={styles.powers}>{['hammer', 'shuffle', 'line-blast', 'color-clear', 'extra-moves'].map(current => <button key={current} disabled={locked} className={power === current ? styles.active : ''} onClick={() => { if (current === 'shuffle' || current === 'extra-moves') onPower(current, null).catch(() => {}); else setPower(power === current ? null : current) }}>{current.replaceAll('-', ' ')}</button>)}</div>
    {busy && <p className={styles.resolvingText} aria-live="polite">Resolving…</p>}
    <p role="alert">{error}</p>
    {state.status === 'lost' && <div className={styles.modal}><div><h2>Out of moves</h2><p>Use Extra Moves if available, or retry the level.</p><button onClick={() => { recordMatch3Event('continue-used', { method: 'extra-moves' }); onPower('extra-moves', null).catch(() => {}) }}>Continue with Extra Moves</button><button onClick={onRestart}>Retry</button><button onClick={onQuit}>Level map</button></div></div>}
    {paused && <div className={styles.modal}><div><h2>Paused</h2><button onClick={() => setPaused(false)}>Resume</button><button onClick={onRestart}>Restart</button><button onClick={onQuit}>Quit</button></div></div>}
    {import.meta.env.DEV && <aside className={styles.diagnostics} aria-label="Match-3 diagnostics"><strong>DEV DIAGNOSTICS</strong><span>Phase: {presentation?.phase ?? 'idle'}</span><span>Lock: {locked ? lockReason : 'none'}</span><span>Selected: {selected ? `${selected.r}:${selected.c}` : 'none'}</span><span>Duration: {presentation?.durationMs ?? 0}ms</span><span>Motion: {motionMode}</span><span>Revision: {state.revision ?? state.movesRemaining}</span><button onClick={() => setSlowAnimations(value => !value)}>{slowAnimations ? 'Normal speed' : 'Slow to 25%'}</button></aside>}
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

function Tile({ cell, row, column, columns, selected, presentation, onChoose, onKeyDown, ...events }) {
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
  ].filter(Boolean).join(' ')
  const swap = presentation?.swapped?.find(position => position.r === row && position.c === column)
  const other = swap ? presentation.swapped.find(position => position.r !== row || position.c !== column) : null
  const style = { '--tile-index': (row * columns) + column }
  if (other) {
    style['--swap-x'] = `${(other.c - column) * 100}%`
    style['--swap-y'] = `${(other.r - row) * 100}%`
  }
  return <button type="button" data-cell={`${row}:${column}`} role="gridcell" aria-selected={selected} aria-label={`Row ${row + 1}, column ${column + 1}: ${parts.join(', ')}`} className={classes} style={style} onClick={() => onChoose(row, column)} onKeyDown={event => onKeyDown(event, row, column)} {...events}>
    <Match3TokenImage tokenId={cell.token} className={styles.tokenImage} decorative />
    {cell.drop && <span className={styles.dropObject}>⬇</span>}
    {special && <span className={styles.special} aria-hidden="true">{special === 'row' ? '↔' : special === 'col' ? '↕' : special === 'color' ? '◉' : '✹'}</span>}
    {cell.crate > 0 && <span className={styles.blocker}>◇{cell.crate}</span>}
    {cell.ice > 0 && <span className={styles.ice}>❄</span>}
    {cell.chain > 0 && <span className={styles.chain}>⌁</span>}
  </button>
}
