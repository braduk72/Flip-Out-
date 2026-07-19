import { fireEvent, render, screen } from '@testing-library/react'
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
  fireEvent.pointerDown(pointerFrom, { clientX: 10, clientY: 10 })
  fireEvent.pointerUp(pointerFrom, { clientX: 10 + (move.to.c - move.from.c) * 40, clientY: 10 + (move.to.r - move.from.r) * 40 })
  expect(pointerMove).toHaveBeenCalled()
  pointerRender.unmount()
})
