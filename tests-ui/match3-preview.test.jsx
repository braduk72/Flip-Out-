import { act, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Match3Preview from '../src/ui/Match3Preview.jsx'
import { advanceMatch3Demo, createMatch3Demo } from '../src/ui/match3Demo.js'
import { legalMoves } from '../src/match3/engine.js'

test('Match-3 demo advances deterministically using a legal engine move', () => {
  const first = createMatch3Demo(1234)
  const second = createMatch3Demo(1234)
  const nextA = advanceMatch3Demo(first)
  const nextB = advanceMatch3Demo(second)
  expect(nextA.lastMove).toEqual(nextB.lastMove)
  expect(nextA.game.board).toEqual(nextB.game.board)
  expect(legalMoves(first.game.board)).toContainEqual(nextA.lastMove)
})

test('Match-3 preview advances, pauses when hidden and cleans up timers', () => {
  vi.useFakeTimers()
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  const { unmount } = render(<Match3Preview seed={9876}/>)
  const preview = screen.getByRole('img', { name: /live match-3 preview/i })
  expect(preview).toHaveAttribute('data-demo-step', '0')
  act(() => vi.advanceTimersByTime(2820))
  expect(preview).toHaveAttribute('data-demo-step', '1')
  Object.defineProperty(document, 'hidden', { configurable: true, value: true })
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(preview).toHaveAttribute('data-demo-paused', 'true')
  act(() => vi.advanceTimersByTime(6000))
  expect(preview).toHaveAttribute('data-demo-step', '1')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
