import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RewardTheatrePanel, RewardTheatrePresentation } from '../src/screens/Match3.jsx'

const committedClaim = {
  claimId: 'reward-theatre:test-player:match3:5',
  milestone: 5,
  duplicate: false,
  reward: { currencyId: 'coins', amount: 25, milestone: 5, tableId: 'reward-theatre-v1' },
  presentation: {
    type: 'lucky-prize-wheel',
    label: '25 Coins',
    reward: { currencyId: 'coins', amount: 25, milestone: 5, tableId: 'reward-theatre-v1' },
    wheel: {
      segmentCount: 24,
      targetIndex: 3,
      segmentAngleDeg: 15,
      targetAngleDeg: 52.5,
      finalRotationDeg: 2467.5,
      segments: Array.from({ length: 24 }, (_, index) => ({
        id: index === 3 ? 'coins-25' : `decoy-${index}`,
        kind: index % 3 === 0 ? 'coins' : index % 3 === 1 ? 'booster' : 'powerup',
        color: index % 2 === 0 ? '#ffd84d' : '#9b6cff',
        label: index === 3 ? '25 Coins' : 'Decoy',
        reward: index === 3 ? { currencyId: 'coins', amount: 25 } : { itemId: 'powerup:match3-hammer', amount: 1 },
        winning: index === 3,
      })),
    },
  },
}

describe('Lucky Prize Wheel Reward Theatre', () => {
  it('renders the committed reward as a wheel presentation', () => {
    const { container } = render(<RewardTheatrePresentation claim={committedClaim} />)

    const theatre = container.querySelector('[data-theatre-type="lucky-prize-wheel"]')
    const wheel = container.querySelector('[style*="--wheel-final-rotation"]')
    expect(theatre).toBeTruthy()
    expect(wheel).toBeTruthy()
    expect(screen.getByText('Prize won')).toBeInTheDocument()
    expect(screen.getByText('25 Coins')).toBeInTheDocument()
    expect(screen.getByText('Reward committed before the wheel spun.')).toBeInTheDocument()
  })

  it('keeps the spin button visible and prevents duplicate clicks while busy', () => {
    const onClaim = vi.fn()
    const { rerender } = render(<RewardTheatrePanel rewardTheatre={{ available: true, milestone: 5 }} busy={false} onClaim={onClaim} />)

    const readyButton = screen.getByRole('button', { name: 'Spin Prize Wheel' })
    expect(readyButton).toBeVisible()
    fireEvent.click(readyButton)
    expect(onClaim).toHaveBeenCalledTimes(1)

    rerender(<RewardTheatrePanel rewardTheatre={{ available: true, milestone: 5 }} busy onClaim={onClaim} />)
    expect(screen.getByRole('button', { name: 'Preparing wheel…' })).toBeDisabled()
  })

  it('falls back to a wheel if an older claim lacks presentation metadata', () => {
    const { container } = render(<RewardTheatrePresentation claim={{ reward: { itemId: 'booster:random', amount: 1 } }} />)

    expect(container.querySelector('[data-theatre-type="lucky-prize-wheel"]')).toBeTruthy()
    expect(screen.getByText('Random Booster')).toBeInTheDocument()
  })
})
