import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DevToolkit from '../src/screens/DevToolkit.jsx'

const mockApi = vi.hoisted(() => ({
  devToolsState: vi.fn(),
  devTools: vi.fn(),
}))

vi.mock('../src/utils/gameApi.js', () => ({
  playerGameApi: mockApi,
}))

const payload = {
  state: {
    profile: { player_id: 'player-one', display_name: 'BradSC', account_kind: 'guest', selected_avatar_id: 'star' },
    balances: [{ currency_id: 'stars', balance: 120 }, { currency_id: 'coins', balance: 50 }],
    inventory: [{ item_id: 'card:cats:1', quantity: 1 }],
    inventoryCapacity: { used: 1, capacity: 500 },
    transactions: [],
    themeAlbums: { entries: [] },
    personalAlbums: { albums: [] },
    achievements: {
      definitions: [],
      unlocked: [],
      progress: [{ achievementId: 'unicorn-poop', current: 0, target: 1, complete: false, unlocked: false }],
    },
  },
  dev: {
    match3: { highest_unlocked_level: 1, completed_levels: {} },
    rewardTheatre: { available: true, milestone: 5, claimId: 'reward-theatre:player-one:match3:5' },
    coinLedger: [],
    exchange: [],
    featureFlags: [],
  },
  catalogue: {
    themes: [{ id: 'cats', name: 'Cats', cardCount: 70, coverAsset: '/images/cards/cats/back.webp' }],
    grantableItems: [
      { id: 'card:cats:1', name: 'Cat Card 1', type: 'card', rarity: 'common', asset: '/images/cards/cats/1.webp' },
      { id: 'booster:themed', name: 'Themed Booster Pack', type: 'booster', rarity: 'rare', asset: '/ui/shop/booster-packs.webp' },
      { id: 'booster:random', name: 'Random Booster Pack', type: 'booster', rarity: 'epic', asset: '/ui/shop/booster-packs.webp' },
    ],
    achievements: [
      { id: 'unicorn-poop', name: 'Unicorn Poop', description: 'Discover your first Rare Foil card.' },
      { id: 'raider-of-the-lost-arc-hive', name: 'Raider of the Lost Arc-hive', description: 'Open boosters from five different Themes.' },
    ],
    unsupported: {
      foilCards: 'Prepared only: no authoritative Foil item definitions exist yet.',
      boosters: 'Booster inventory items can now be granted as stackable Preview rewards; secure purchase/opening is still postponed.',
    },
  },
}

describe('Preview developer toolkit screen', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockApi.devToolsState.mockReset()
    mockApi.devTools.mockReset()
    mockApi.devToolsState.mockResolvedValue(payload)
    mockApi.devTools.mockResolvedValue(payload)
  })

  test('loads authoritative state after developer secret is supplied', async () => {
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    fireEvent.change(screen.getByLabelText('Developer secret'), { target: { value: 'preview-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock toolkit' }))
    await waitFor(() => expect(mockApi.devToolsState).toHaveBeenCalledWith('preview-secret'))
    expect(await screen.findByText('BradSC')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Match-3' })).toBeInTheDocument()
  })

  test('submits item grants through the Preview toolkit API', async () => {
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    await screen.findByText('BradSC')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Collection' }))
    expect(await screen.findByText('Grant any card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Grant card' }))
    await waitFor(() => expect(mockApi.devTools).toHaveBeenCalledWith({ action: 'grant-item', itemId: 'card:cats:1', quantity: 1 }, 'preview-secret'))
    expect(screen.getByRole('status')).toHaveTextContent('Applied: grant-item')
  })

  test('opens a selected Match-3 level through the route callback', async () => {
    const onJumpMatch3 = vi.fn()
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} onJumpMatch3={onJumpMatch3} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    await screen.findByText('BradSC')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Match-3' }))
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Open Match-3 level' }))
    expect(onJumpMatch3).toHaveBeenCalledWith(8)
  })

  test('triggers Reward Theatre through the Preview toolkit when a milestone is pending', async () => {
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    await screen.findByText('BradSC')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Match-3' }))
    expect(await screen.findByText('Reward Theatre')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Reward Theatre' }))
    await waitFor(() => expect(mockApi.devTools).toHaveBeenCalledWith({ action: 'match3-reward-theatre', milestone: 5 }, 'preview-secret'))
  })

  test('exposes exchange clearing without using the destructive reset endpoint', async () => {
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    await screen.findByText('BradSC')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Exchange' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear listings + seed' }))
    await waitFor(() => expect(mockApi.devTools).toHaveBeenCalledWith({ action: 'exchange-clear', includeSeed: true }, 'preview-secret'))
  })

  test('submits achievement unlocks through the Preview toolkit API', async () => {
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    await screen.findByText('BradSC')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Admin toolkit pages' })).getByRole('button', { name: 'Achievements' }))
    expect(await screen.findByText('Unicorn Poop')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unlock achievement' }))
    await waitFor(() => expect(mockApi.devTools).toHaveBeenCalledWith({ action: 'achievement-unlock', achievementId: 'unicorn-poop' }, 'preview-secret'))
  })
})
