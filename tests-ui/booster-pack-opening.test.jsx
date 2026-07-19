import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BoosterPackOpening from '../src/components/BoosterPackOpening.jsx'
import { BOOSTER_ANIMATION_FRAMES, PACK_OPENING_TIMELINE, createPackOpeningPresentation, packOpeningDuration } from '../src/ui/packOpeningFlow.js'

const cards = [
  { id: 'one', name: 'Card one', asset: '/images/cards/babyAnimals/1.webp' },
  { id: 'two', name: 'Card two', asset: '/images/cards/babyAnimals/2.webp', foil: true },
  { id: 'three', name: 'Card three', asset: '/images/cards/babyAnimals/3.webp' },
  { id: 'four', name: 'Card four', asset: '/images/cards/babyAnimals/4.webp' },
  { id: 'five', name: 'Card five', asset: '/images/cards/babyAnimals/5.webp', foil: true, foilTier: 'rare' },
]

const OriginalImage = globalThis.Image
beforeEach(() => {
  vi.useFakeTimers()
  globalThis.Image = class {
    set src(_value) { queueMicrotask(() => this.onload?.()) }
  }
})
afterEach(() => { globalThis.Image = OriginalImage })

test('keyframe timeline is procedural, complete and motion-aware', () => {
  expect(BOOSTER_ANIMATION_FRAMES).toHaveLength(10)
  expect(PACK_OPENING_TIMELINE.map(step => step.phase)).toEqual(['appearing', 'enlarging', 'lifting', 'turning', 'settling', 'tearing', 'opening', 'dealing', 'uncovering', 'fan-ready'])
  expect(packOpeningDuration('off')).toBe(0)
  expect(packOpeningDuration('reduced')).toBeLessThan(packOpeningDuration('full'))
  expect(() => createPackOpeningPresentation({ packId: 'bad', cards: cards.slice(0, 4) })).toThrow(/exactly five/)
})

test('players can reveal any individual card or reveal all after the procedural fan', async () => {
  const complete = vi.fn()
  render(<BoosterPackOpening packId="preview" cards={cards} onComplete={complete}/>)
  await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })
  expect(screen.getByRole('button', { name: 'Open Pack' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Open Pack' }))
  act(() => { vi.advanceTimersByTime(packOpeningDuration('full') + 60) })
  expect(screen.getByRole('button', { name: 'Reveal card 3' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Reveal card 3' }))
  expect(screen.getByRole('button', { name: 'Card three revealed' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Reveal All' }))
  act(() => { vi.runAllTimers() })
  expect(screen.getByRole('button', { name: 'Close preview' })).toBeInTheDocument()
  expect(complete).toHaveBeenCalledOnce()
})

test('a completion interruption pauses the presentation until its celebration resumes', async () => {
  const complete = vi.fn()
  const celebration = vi.fn()
  render(<BoosterPackOpening packId="preview" cards={cards} interruption={{ type: 'collection-complete', cardId: 'gold-collector' }} onCelebration={celebration} onComplete={complete}/>)
  await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })
  fireEvent.click(screen.getByRole('button', { name: 'Open Pack' }))
  act(() => { vi.advanceTimersByTime(packOpeningDuration('full') + 60) })
  fireEvent.click(screen.getByRole('button', { name: 'Reveal All' }))
  act(() => { vi.runAllTimers() })
  expect(celebration).toHaveBeenCalledOnce()
  expect(complete).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Booster pack opening')).toHaveAttribute('data-phase', 'celebration-paused')
  act(() => celebration.mock.calls[0][0].resume())
  expect(complete).toHaveBeenCalledOnce()
})
