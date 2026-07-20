import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    balances: [{ currency_id: 'stars', balance: 120 }, { currency_id: 'coins', balance: 50 }],
    inventory: [{ item_id: 'card:cats:1', quantity: 1 }],
    inventoryCapacity: { used: 1, capacity: 500 },
  },
  catalogue: {
    themes: [{ id: 'cats', name: 'Cats', cardCount: 70, coverAsset: '/images/cards/cats/back.webp' }],
    grantableItems: [{ id: 'card:cats:1', name: 'Cat Card 1', type: 'card', rarity: 'common', asset: '/images/cards/cats/1.webp' }],
    unsupported: {
      foilCards: 'Prepared only: no authoritative Foil item definitions exist yet.',
      achievements: 'Prepared only: no achievement persistence tables exist yet.',
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
    expect(await screen.findByText('120')).toBeInTheDocument()
    expect(screen.getByText('Foils and achievements are not live yet')).toBeInTheDocument()
  })

  test('submits item grants through the Preview toolkit API', async () => {
    sessionStorage.setItem('fo_dev_toolkit_secret', 'preview-secret')
    render(<DevToolkit onBack={() => {}} navProps={{ active: 'more', onHome: () => {}, onCollection: () => {}, onRewards: () => {}, onMore: () => {} }} />)
    expect(await screen.findByText('Grant Item')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Grant item' }))
    await waitFor(() => expect(mockApi.devTools).toHaveBeenCalledWith({ action: 'grant-item', itemId: 'card:cats:1', quantity: 1 }, 'preview-secret'))
    expect(screen.getByRole('status')).toHaveTextContent('Preview toolkit action applied')
  })
})
