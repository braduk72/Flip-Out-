import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { expect, test, vi } from 'vitest'
import Home from '../src/screens/Home.jsx'

const homeData = {
  profile: { accountKind: 'guest', displayName: 'GuestPlayer', avatarId: 'starter-1', playerName: 'GuestPlayer', level: null, xp: null, xpTarget: null },
  currencies: { stars: 1200, coins: 75 },
  match3: { level: 8, completed: 7, resume: null },
  collection: { owned: 12, total: 100, newest: { name: 'Aurora Crown', asset: '/images/cards/babyAnimals/1.webp', rarity: 'rare' } },
  foil: { owned: 0, target: 10, available: false },
  season: { current: 6, total: 32, label: 'Season 1' },
  dailyLogin: { available: false },
  community: null,
}

test('Home renders the approved hierarchy and navigates to Match-3', async () => {
  const onMatch3 = vi.fn()
  const loader = vi.fn().mockResolvedValue(homeData)
  render(<Home dataLoader={loader} onMatch3={onMatch3} onMemory={() => {}} onShop={() => {}} onCollection={() => {}} onRewards={() => {}} onMore={() => {}} onSeason={() => {}} sfxOn={false}/>)
  expect(screen.getByText('Loading featured content…')).toBeInTheDocument()
  await screen.findByText('Premium Coins. Safely yours.')
  expect(screen.getByRole('heading', { name: 'MATCH-3' })).toBeInTheDocument()
  expect(screen.queryByText('NEXT STEP')).not.toBeInTheDocument()
  expect(screen.queryByText('YOUR PROGRESS')).not.toBeInTheDocument()
  expect(screen.queryByText(/next in/i)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /play match-3,? continue level 8/i }))
  expect(onMatch3).toHaveBeenCalledOnce()
})

test('Home shows error and retry without blocking Match-3', async () => {
  const loader = vi.fn().mockRejectedValueOnce(new Error('Preview unavailable')).mockResolvedValueOnce(homeData)
  render(<Home dataLoader={loader} onMatch3={() => {}} onMemory={() => {}} sfxOn={false}/>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Preview unavailable')
  expect(screen.getByRole('button', { name: /play match-3/i })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: /retry/i }))
  await screen.findByText('Premium Coins. Safely yours.')
  expect(loader).toHaveBeenCalledTimes(2)
})

test('Daily Reward appears only while claimable and returns an authoritative receipt', async () => {
  const loader = vi.fn()
    .mockResolvedValueOnce({ ...homeData, dailyLogin: { available: true, nextStreak: 2, nextReward: { currencyId: 'stars', amount: 100 } } })
    .mockResolvedValueOnce(homeData)
  const dailyClaimer = vi.fn().mockResolvedValue({ streak: 2, reward: { currencyId: 'stars', amount: 100 } })
  render(<Home dataLoader={loader} dailyClaimer={dailyClaimer} onMatch3={() => {}} onMemory={() => {}} sfxOn={false}/>)
  await userEvent.click(await screen.findByRole('button', { name: /claim daily reward/i }))
  expect(await screen.findByRole('dialog', { name: 'Daily Reward claimed' })).toHaveTextContent('100 Stars')
  expect(dailyClaimer).toHaveBeenCalledOnce()
})

test('Daily Reward keeps a stable mobile button and rejects rapid duplicate taps', async () => {
  let releaseClaim
  const pendingClaim = new Promise(resolve => { releaseClaim = resolve })
  const loader = vi.fn()
    .mockResolvedValueOnce({ ...homeData, dailyLogin: { available: true, nextStreak: 3, nextReward: { currencyId: 'stars', amount: 150 } } })
    .mockResolvedValueOnce({ ...homeData, currencies: { ...homeData.currencies, stars: 1350 }, dailyLogin: { available: false } })
  const dailyClaimer = vi.fn(() => pendingClaim)
  render(<Home dataLoader={loader} dailyClaimer={dailyClaimer} onMatch3={() => {}} onMemory={() => {}} sfxOn={false}/>)
  const claim = await screen.findByRole('button', { name: /claim daily reward/i })
  fireEvent.click(claim)
  fireEvent.click(claim)
  expect(dailyClaimer).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: /collecting daily reward/i })).toBeDisabled()
  releaseClaim({ streak: 3, reward: { currencyId: 'stars', amount: 150 } })
  expect(await screen.findByRole('dialog', { name: 'Daily Reward claimed' })).toHaveTextContent('150 Stars')
  await waitFor(() => expect(screen.getByLabelText('1,350 Stars')).toBeInTheDocument())
})

test('Home has no automated accessibility violations detectable in jsdom', async () => {
  const loader = vi.fn().mockResolvedValue(homeData)
  const { container } = render(<Home dataLoader={loader} onMatch3={() => {}} onMemory={() => {}} onShop={() => {}} onCollection={() => {}} onRewards={() => {}} onMore={() => {}} onSeason={() => {}} sfxOn={false}/>)
  await waitFor(() => expect(screen.getByText('Premium Coins. Safely yours.')).toBeInTheDocument())
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  expect(result.violations.map(item => item.id)).toEqual([])
})
