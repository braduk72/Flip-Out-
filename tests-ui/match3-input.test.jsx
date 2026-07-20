import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { createGame, legalMoves } from '../src/match3/engine.js'
import { MATCH3_LEVELS } from '../src/match3/levels.js'
import { GameBoard } from '../src/screens/Match3.jsx'

const props = {
  busy: false,
  error: '',
  presentation: null,
  onMove: vi.fn(() => Promise.resolve()),
  onPower: vi.fn(() => Promise.resolve()),
  onRevive: vi.fn(() => Promise.resolve({ revive: { attempt: 1, label: 'Revive One', costCoins: 25, oddsPercent: 75, success: false } })),
  onRestart: vi.fn(),
  onQuit: vi.fn(),
}

test('every development level exposes an interactive board and selects a legal first token', () => {
  for (const level of MATCH3_LEVELS) {
    const game = createGame(level, 20260719 + level.id)
    const move = legalMoves(game.board)[0]
    const { unmount } = render(<GameBoard {...props} session={{ state: game }}/>)
    const board = screen.getByRole('grid')
    expect(board).toHaveAttribute('data-input-locked', 'false')
    fireEvent.click(screen.getByRole('gridcell', { name: new RegExp(`Row ${move.from.r + 1}, column ${move.from.c + 1}:`) }))
    expect(screen.getByRole('gridcell', { name: new RegExp(`Row ${move.from.r + 1}, column ${move.from.c + 1}:`) })).toHaveAttribute('aria-selected', 'true')
    unmount()
  }
}, 20000)

test('mouse, keyboard and pointer swipe paths reach the same legal move handler', async () => {
  const game = createGame(MATCH3_LEVELS[0], 42)
  const move = legalMoves(game.board)[0]
  const onMove = vi.fn(() => Promise.resolve())
  const { unmount } = render(<GameBoard {...props} onMove={onMove} session={{ state: game }}/>)
  const from = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.from.r + 1}, column ${move.from.c + 1}:`) })
  const to = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.to.r + 1}, column ${move.to.c + 1}:`) })
  fireEvent.click(from)
  fireEvent.keyDown(to, { key: 'Enter' })
  expect(onMove).toHaveBeenCalled()
  unmount()
  const pointerMove = vi.fn(() => Promise.resolve())
  const pointerRender = render(<GameBoard {...props} onMove={pointerMove} session={{ state: game }}/> )
  const pointerFrom = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.from.r + 1}, column ${move.from.c + 1}:`) })
  const pointerTo = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.to.r + 1}, column ${move.to.c + 1}:`) })
  vi.spyOn(pointerFrom, 'getBoundingClientRect').mockReturnValue({ width: 40, height: 40, x: 10, y: 10, top: 10, left: 10, right: 50, bottom: 50, toJSON: () => ({}) })
  fireEvent.pointerDown(pointerFrom, { clientX: 10, clientY: 10 })
  fireEvent.pointerMove(pointerFrom, { clientX: 10 + (move.to.c - move.from.c) * 22, clientY: 10 + (move.to.r - move.from.r) * 22 })
  expect(pointerFrom.className).toContain('draggingTile')
  expect(pointerFrom.style.getPropertyValue('--drag-x')).not.toBe('0px')
  expect(pointerTo.className).toContain('dragPreviewTile')
  fireEvent.pointerUp(pointerFrom, { clientX: 10 + (move.to.c - move.from.c) * 40, clientY: 10 + (move.to.r - move.from.r) * 40 })
  expect(pointerMove).toHaveBeenCalled()
  pointerRender.unmount()
})

test('held drag visibly moves both cells and an invalid release returns safely', async () => {
  const game = createGame(MATCH3_LEVELS[0], 1104)
  const move = legalMoves(game.board)[0]
  let finishMove
  const onMove = vi.fn(() => new Promise(resolve => { finishMove = resolve }))
  const dragProps = { busy: false, error: '', presentation: null, onMove, onPower: vi.fn(() => Promise.resolve()), onRestart: vi.fn(), onQuit: vi.fn() }
  const view = render(<GameBoard {...dragProps} session={{ state: game }}/>)
  const source = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.from.r + 1}, column ${move.from.c + 1}:`) })
  const destination = screen.getByRole('gridcell', { name: new RegExp(`Row ${move.to.r + 1}, column ${move.to.c + 1}:`) })
  vi.spyOn(source, 'getBoundingClientRect').mockReturnValue({ width: 40, height: 40, x: 10, y: 10, top: 10, left: 10, right: 50, bottom: 50, toJSON: () => ({}) })
  const deltaX = (move.to.c - move.from.c) * 40
  const deltaY = (move.to.r - move.from.r) * 40

  fireEvent.pointerDown(source, { pointerId: 7, clientX: 10, clientY: 10 })
  fireEvent.pointerMove(source, { pointerId: 7, clientX: 10 + deltaX / 2, clientY: 10 + deltaY / 2 })
  expect(source.style.getPropertyValue('--drag-x')).toBe(`${deltaX / 2}px`)
  expect(source.style.getPropertyValue('--drag-y')).toBe(`${deltaY / 2}px`)
  expect(destination.className).toContain('dragPreviewTile')

  fireEvent.pointerUp(source, { pointerId: 7, clientX: 10 + deltaX, clientY: 10 + deltaY })
  expect(source.dataset.dragPhase).toBe('committed')
  expect(source.style.getPropertyValue('--drag-x')).toBe(`${deltaX}px`)
  expect(source.style.getPropertyValue('--drag-y')).toBe(`${deltaY}px`)
  expect(destination.style.getPropertyValue('--preview-x')).toBe(`${-deltaX}px`)
  expect(destination.style.getPropertyValue('--preview-y')).toBe(`${-deltaY}px`)
  finishMove({})
  await waitFor(() => expect(source.className).not.toContain('draggingTile'))
  view.unmount()

  const invalidMove = vi.fn(() => Promise.resolve())
  render(<GameBoard {...dragProps} onMove={invalidMove} session={{ state: game }}/>)
  const corner = screen.getByRole('gridcell', { name: /Row 1, column 1:/ })
  fireEvent.pointerDown(corner, { pointerId: 8, clientX: 20, clientY: 20 })
  fireEvent.pointerMove(corner, { pointerId: 8, clientX: -20, clientY: 20 })
  fireEvent.pointerUp(corner, { pointerId: 8, clientX: -20, clientY: 20 })
  expect(invalidMove).not.toHaveBeenCalled()
  expect(corner.dataset.dragPhase).toBe('returning')
  expect(corner.style.getPropertyValue('--drag-x')).toBe('0px')
})

test('lost Match-3 board offers Coin-only revive spinner and no advert revive', async () => {
  const game = createGame(MATCH3_LEVELS[0], 20260720)
  game.status = 'lost'
  game.movesRemaining = 0
  game.revives = []
  const onRevive = vi.fn(() => Promise.resolve({ revive: { attempt: 1, label: 'Revive One', costCoins: 25, oddsPercent: 75, success: false } }))
  render(<GameBoard {...props} onRevive={onRevive} session={{ state: game }}/>)
  expect(screen.getByText('Revive One: spend 25 Coins for a 75% revive chance.')).toBeInTheDocument()
  expect(screen.queryByText(/advert/i)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Revive One - 25 Coins' }))
  await waitFor(() => expect(onRevive).toHaveBeenCalledTimes(1))
  expect(await screen.findByText('No luck this time. You can try the next revive or retry the level.')).toBeInTheDocument()
})

test('Match-3 presentation renders multiplier, announcer and special effect layers', () => {
  const game = createGame(MATCH3_LEVELS[0], 77)
  const presentation = {
    swapped: [],
    cleared: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
    triggered: [{ r: 0, c: 0 }],
    created: [{ r: 1, c: 1 }],
    cascades: [],
    cascadeCount: 4,
    scoreGained: 1200,
    label: 'OUTSTANDING!',
    comboType: 'line+wrapped',
    phase: 'resolve',
    durationMs: 900,
    effectPlan: {
      boardShake: 6,
      intensity: 6,
      particleIntensity: 6,
      particleCount: 24,
      announcer: 'OUTSTANDING!',
      multiplierDisplay: { value: 2.5, cascadeCount: 4, cascadeMatches: 3, scoreGained: 1200 },
      stages: [
        {
          createdSpecials: [{ at: { r: 1, c: 1 }, type: 'wrapped', animation: 't-formation' }],
          triggeredSpecials: [{ at: { r: 0, c: 0 }, type: 'row' }],
        },
      ],
    },
  }
  const { container } = render(<GameBoard {...props} presentation={presentation} session={{ state: game }}/>)
  expect(screen.getByText('Cascade chain')).toBeInTheDocument()
  expect(screen.getAllByText('OUTSTANDING!').length).toBeGreaterThanOrEqual(1)
  expect(container.querySelector('[class*="creationShockwave"]')).toBeInTheDocument()
  expect(container.querySelector('[class*="specialImpact"]')).toBeInTheDocument()
})

test('idle Match-3 board creates one hint timer, reveals one move hint and resets on interaction', async () => {
  vi.useFakeTimers()
  const timeoutSpy = vi.spyOn(window, 'setTimeout')
  const clearSpy = vi.spyOn(window, 'clearTimeout')
  try {
    localStorage.removeItem('fo_move_hints')
    const game = createGame(MATCH3_LEVELS[0], 88)
    const { rerender, unmount } = render(<GameBoard {...props} hintDelayMs={250} session={{ state: game }}/>)
    expect(timeoutSpy).toHaveBeenCalledTimes(1)
    rerender(<GameBoard {...props} hintDelayMs={250} session={{ state: game }}/>)
    expect(timeoutSpy).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(260) })
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(2)
    fireEvent.click(document.querySelector('[class*="hintedTile"]'))
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(0)
    expect(timeoutSpy).toHaveBeenCalledTimes(2)
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  } finally {
    timeoutSpy.mockRestore()
    clearSpy.mockRestore()
    vi.useRealTimers()
  }
})

test('disabled Match-3 move hints never highlight a settled board', async () => {
  vi.useFakeTimers()
  try {
    localStorage.setItem('fo_move_hints', 'false')
    const game = createGame(MATCH3_LEVELS[0], 89)
    render(<GameBoard {...props} hintDelayMs={20} session={{ state: game }}/>)
    await vi.advanceTimersByTimeAsync(50)
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(0)
  } finally {
    localStorage.removeItem('fo_move_hints')
    vi.useRealTimers()
  }
})

test('Match-3 hint timer is cancelled while the browser tab is hidden', async () => {
  vi.useFakeTimers()
  const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')
  try {
    localStorage.removeItem('fo_move_hints')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    const game = createGame(MATCH3_LEVELS[0], 91)
    render(<GameBoard {...props} hintDelayMs={250} session={{ state: game }}/>)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(0)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await vi.advanceTimersByTimeAsync(260) })
    expect(document.querySelectorAll('[class*="hintedTile"]').length).toBe(2)
  } finally {
    delete document.visibilityState
    if (originalVisibility) Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
    vi.useRealTimers()
  }
})

test('dead-board shuffle presentation displays no-moves message and shuffle class', () => {
  const game = createGame(MATCH3_LEVELS[0], 90)
  const presentation = { phase: 'shuffle', shuffle: true, deadBoardShuffle: true, shuffleLabel: 'No more moves', durationMs: 820, cascades: [], cascadeCount: 0, effectPlan: {} }
  const { container } = render(<GameBoard {...props} presentation={presentation} session={{ state: game }}/>)
  expect(screen.getByText('No more moves')).toBeInTheDocument()
  expect(container.querySelector('[class*="shuffling"]')).toBeInTheDocument()
})
