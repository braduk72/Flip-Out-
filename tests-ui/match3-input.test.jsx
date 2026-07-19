import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
