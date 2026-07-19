import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import {
  BottomNavigation,
  CurrencyCounter,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PrimaryPlayButton,
  PromoCarousel,
  SafeAreaHeader,
} from '../src/ui/components.jsx'

const promotions = [
  { id: 'one', eyebrow: 'First', title: 'Coin Store', detail: 'Verified purchases.', image: '/ui/promo/coin-store.webp' },
  { id: 'two', eyebrow: 'Second', title: 'Collection', detail: 'Open the album.', image: '/ui/promo/collection.webp' },
]

describe('Flip-Out design-system components', () => {
  test('safe-area header exposes player, exact currency values and Coin Store access', () => {
    const { container } = render(<SafeAreaHeader player={{ playerName: 'Guest Player', avatarId: 'starter-1', accountKind: 'guest', level: null }} currencies={{ stars: 1275, coins: 6540 }} onCoinStore={() => {}}/>)
    expect(screen.getByRole('banner')).toHaveAttribute('data-safe-area', 'runtime')
    expect(screen.getByAltText('Flip-Out!')).toBeInTheDocument()
    expect(screen.getByText('Guest Player')).toBeInTheDocument()
    expect(screen.getByLabelText('1,275 Stars')).toBeInTheDocument()
    expect(screen.getByLabelText('6,540 Coins')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Coin Store' })).toBeInTheDocument()
    expect(container.querySelector('[data-avatar-id="starter-1"] img[src="/images/a1.webp"]')).toBeInTheDocument()
  })

  test('currency counter has deliberate loading and unavailable states', () => {
    const { rerender } = render(<CurrencyCounter type="coins" amount={null} status="loading"/>)
    expect(screen.getByText('…')).toBeInTheDocument()
    rerender(<CurrencyCounter type="coins" amount={null} status="error"/>)
    expect(screen.getByLabelText('Coins unavailable')).toHaveTextContent('—')
  })

  test('carousel rotates, pauses and tracks native momentum scrolling', () => {
    vi.useFakeTimers()
    render(<PromoCarousel items={promotions} autoRotateMs={1000} sfxOn={false}/>)
    const first = screen.getByRole('article', { name: '1 of 2: Coin Store' })
    const second = screen.getAllByRole('article', { hidden: true })[1]
    expect(first).toHaveAttribute('aria-current', 'true')
    act(() => vi.advanceTimersByTime(1000))
    expect(second).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Pause automatic promotion rotation' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(second).toHaveAttribute('aria-current', 'true')
    const viewport = screen.getByRole('group', { name: 'Promotion slides' })
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 320 })
    Object.defineProperty(viewport, 'scrollLeft', { configurable: true, writable: true, value: 0 })
    fireEvent.scroll(viewport)
    act(() => vi.advanceTimersByTime(250))
    expect(first).toHaveAttribute('aria-current', 'true')
  })

  test('reduced motion prevents automatic carousel rotation', () => {
    localStorage.setItem('fo_motion', 'reduced')
    vi.useFakeTimers()
    render(<PromoCarousel items={promotions} autoRotateMs={500} sfxOn={false}/>)
    act(() => vi.advanceTimersByTime(2500))
    expect(screen.getByRole('article', { name: '1 of 2: Coin Store' })).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByRole('button', { name: /automatic promotion rotation/i })).not.toBeInTheDocument()
  })

  test('signature Play invokes real navigation callback', async () => {
    const onPlay = vi.fn()
    render(<PrimaryPlayButton level={8} onClick={onPlay} sfxOn={false}/>)
    await userEvent.click(screen.getByRole('button', { name: /play match-3,? continue level 8/i }))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  test('bottom navigation supports activation and arrow-key focus', async () => {
    const onNavigate = vi.fn()
    render(<BottomNavigation active="home" onNavigate={onNavigate}/>)
    const home = screen.getByRole('button', { name: 'Home' })
    const collection = screen.getByRole('button', { name: 'Collection' })
    home.focus()
    fireEvent.keyDown(home, { key: 'ArrowRight' })
    expect(collection).toHaveFocus()
    await userEvent.click(collection)
    expect(onNavigate).toHaveBeenCalledWith('collection')
    expect(home).toHaveAttribute('aria-current', 'page')
  })

  test('loading, error and empty states remain explicit', () => {
    render(<><LoadingState/><ErrorState message="Offline"/><EmptyState title="No cards yet" detail="Play to earn one."/></>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading player data')
    expect(screen.getByRole('alert')).toHaveTextContent('Offline')
    expect(screen.getByText('No cards yet')).toBeInTheDocument()
  })

  test('modal traps the task and closes with Escape', () => {
    const dismiss = vi.fn()
    render(<Modal open title="Confirm" onDismiss={dismiss} actions={<button type="button">Continue</button>}>Details</Modal>)
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(dismiss).toHaveBeenCalledOnce()
  })
})
