import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Inventory from '../src/screens/Inventory.jsx'

const payload = {
  state: {
    profile: { player_id: 'ui-collector', account_kind: 'guest' },
    balances: [],
    inventory: [
      { item_id: 'card:sportscars:1', quantity: 2, bound_quantity: 0 },
      { item_id: 'card:sportscars:gold', quantity: 1, bound_quantity: 0 },
      { item_id: 'inventory:lockbox:standard', quantity: 1, bound_quantity: 0 },
      { item_id: 'inventory:key:standard', quantity: 1, bound_quantity: 0 },
    ],
    transactions: [{ item_id: 'card:sportscars:1', amount: 1, created_at: '2026-07-19T10:00:00Z' }],
    themeAlbums: { entries: [], collectors: [] },
    personalAlbums: { albums: [{ album_id: '11111111-1111-4111-8111-111111111111', name: 'Favourites' }], cards: [], limit: 10, createCostCoins: 500 },
    inventoryCapacity: { cardCapacity: 1000, cardCount: 3, remainingCardSlots: 997 },
  },
}

function renderCollection() {
  const loader = vi.fn().mockResolvedValue(payload)
  render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={vi.fn()} storage={localStorage}/>)
  return loader
}

describe('Collection 2.0', () => {
  it('presents Official Theme Album covers with variable totals and collector status', async () => {
    const user = userEvent.setup()
    renderCollection()
    expect(await screen.findByRole('heading', { name: 'Official Theme Albums' })).toBeInTheDocument()
    expect(screen.getByText(/0 of 653 Normal cards stuck/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Super Cars Official Theme Album, 0 of 70 Normal cards stuck, 0 of 70 Foil cards stuck/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Kings & Queens Official Theme Album, 0 of 19 Normal cards stuck, 0 of 19 Foil cards stuck/ })).toBeInTheDocument()
    expect(screen.getByText('Personal Albums')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Open Super Cars Official Theme Album/ }))
    expect(screen.getByRole('heading', { name: 'Super Cars' })).toBeInTheDocument()
  })

  it('opens a Theme Album with collector pyramid, numbered paired slots and rarity labels', async () => {
    const user = userEvent.setup()
    renderCollection()
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    const superCars = screen.getByRole('button', { name: /Open Super Cars Official Theme Album/ })
    await user.click(superCars)
    expect(screen.getByLabelText('Super Cars Collector Cards')).toBeInTheDocument()
    expect(screen.getByText('Gold Collector Card')).toBeInTheDocument()
    expect(screen.getByText('Bronze Collector Card')).toBeInTheDocument()
    expect(screen.getByText('Silver Collector Card')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    const ferrari = screen.getByLabelText(/Ferrari 488 GTB, ★☆☆☆☆ common/)
    expect(within(ferrari).getAllByText('#1')).toHaveLength(2)
    expect(within(ferrari).getByLabelText(/Normal slot/)).toHaveTextContent('Normal')
    expect(within(ferrari).getByLabelText(/Foil slot/)).toHaveTextContent('Foil')
    expect(within(ferrari).getByRole('heading', { name: 'Ferrari 488 GTB' })).toBeInTheDocument()
  })

  it('displays earned Collector Cards as permanent account-bound album trophies', async () => {
    const user = userEvent.setup()
    const earnedPayload = {
      state: {
        ...payload.state,
        themeAlbums: {
          entries: [],
          collectors: [
            { theme_id: 'sportscars', collector_tier: 'bronze' },
            { theme_id: 'sportscars', collector_tier: 'silver' },
            { theme_id: 'sportscars', collector_tier: 'gold' },
          ],
        },
      },
    }
    const loader = vi.fn().mockResolvedValue(earnedPayload)
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={vi.fn()} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: /Open Super Cars Official Theme Album/ }))
    expect(screen.getAllByText('Earned and permanently account-bound')).toHaveLength(3)
    expect(screen.getByText('Gold Collector Card')).toBeInTheDocument()
    expect(screen.getByText('Bronze Collector Card')).toBeInTheDocument()
    expect(screen.getByText('Silver Collector Card')).toBeInTheDocument()
  })

  it('searches, favourites and reuses the account-scoped favourite in the showcase', async () => {
    const user = userEvent.setup()
    renderCollection()
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: 'Cards' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), 'Ferrari 488 GTB')
    expect(screen.getByText('Showing 1 of 1 cards')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Ferrari 488 GTB to favourites' }))
    await user.click(screen.getByRole('button', { name: 'Favourite cards' }))
    expect(screen.getByText('Ferrari 488 GTB')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('fo_collection_favourites:ui-collector'))).toEqual(['card:sportscars:1'])
  })

  it('exposes complete filters and states clearly that Foils are not yet authoritative', async () => {
    const user = userEvent.setup()
    renderCollection()
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: 'Cards' }))
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const filterRegion = screen.getByText('Variant').closest('section')
    await user.selectOptions(within(filterRegion).getByLabelText('Variant'), 'foil')
    expect(screen.getByText('Foils are not issued yet')).toBeInTheDocument()
    expect(screen.getByText(/no authoritative Foil definitions or assets/i)).toBeInTheDocument()
  })

  it('keeps existing non-card inventory and lockbox actions accessible', async () => {
    const user = userEvent.setup()
    renderCollection()
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: 'Items' }))
    expect(screen.getByText('Standard Lockbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open lockbox' })).toBeInTheDocument()
  })

  it('recycles a complete duplicate batch and displays the authoritative receipt', async () => {
    const user = userEvent.setup()
    const recyclerPayload = {
      state: {
        ...payload.state,
        inventory: [{ item_id: 'card:sportscars:1', quantity: 6, bound_quantity: 0 }],
        recyclerRecipes: [{ recipeId: 'common-stars-v1', rarity: 'common', batchSize: 5, reward: { currencyId: 'stars', amount: 1 }, configVersion: 2 }],
      },
    }
    const loader = vi.fn().mockResolvedValue(recyclerPayload)
    const action = vi.fn().mockResolvedValue({ duplicate: false, transactionId: 'recycle:test', cardsConsumed: 5, batches: 1, reward: { currencyId: 'stars', amount: 1 }, items: [{ itemId: 'card:sportscars:1', quantity: 5 }] })
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={action} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: 'Duplicate card recycler' }))
    const add = screen.getByRole('button', { name: 'Add one Ferrari 488 GTB' })
    for (let count = 0; count < 5; count += 1) await user.click(add)
    await user.click(screen.getByRole('button', { name: 'Recycle 5 cards' }))
    expect(await screen.findByRole('dialog', { name: 'Recycling complete' })).toBeInTheDocument()
    expect(screen.getByText('+1 Star')).toBeInTheDocument()
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ action: 'recycle-duplicates', recipeId: 'common-stars-v1', items: [{ itemId: 'card:sportscars:1', quantity: 5 }] }))
  })

  it('reuses the transaction ID after an interrupted recycler response', async () => {
    const user = userEvent.setup()
    const recyclerPayload = {
      state: {
        ...payload.state,
        inventory: [{ item_id: 'card:sportscars:1', quantity: 6, bound_quantity: 0 }],
        recyclerRecipes: [{ recipeId: 'common-stars-v1', rarity: 'common', batchSize: 5, reward: { currencyId: 'stars', amount: 1 }, configVersion: 2 }],
      },
    }
    const loader = vi.fn().mockResolvedValue(recyclerPayload)
    const action = vi.fn().mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValue({ duplicate: true, transactionId: 'recycle:retry', cardsConsumed: 5, batches: 1, reward: { currencyId: 'stars', amount: 1 }, items: [{ itemId: 'card:sportscars:1', quantity: 5 }] })
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={action} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: 'Duplicate card recycler' }))
    const add = screen.getByRole('button', { name: 'Add one Ferrari 488 GTB' })
    for (let count = 0; count < 5; count += 1) await user.click(add)
    await user.click(screen.getByRole('button', { name: 'Recycle 5 cards' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('same transaction ID')
    const firstId = action.mock.calls[0][0].transactionId
    await user.click(screen.getByRole('button', { name: 'Retry secure recycling' }))
    expect(action.mock.calls[1][0].transactionId).toBe(firstId)
    expect(await screen.findByText(/Safe retry confirmed/)).toBeInTheDocument()
  })

  it('confirms Stick in Album, calls the authoritative action and refreshes album state', async () => {
    const user = userEvent.setup()
    const afterStick = {
      state: {
        ...payload.state,
        inventory: [
          { item_id: 'card:sportscars:1', quantity: 1, bound_quantity: 0 },
          { item_id: 'card:sportscars:gold', quantity: 1, bound_quantity: 0 },
        ],
        themeAlbums: { entries: [{ card_item_id: 'card:sportscars:1', theme_id: 'sportscars', variant: 'normal' }], collectors: [] },
        inventoryCapacity: { cardCapacity: 1000, cardCount: 2, remainingCardSlots: 998 },
      },
    }
    const loader = vi.fn().mockResolvedValueOnce(payload).mockResolvedValue(afterStick)
    const action = vi.fn().mockResolvedValue({ duplicate: false, transactionId: 'album-stick:test', itemId: 'card:sportscars:1', themeId: 'sportscars', variant: 'normal', completion: { normalCount: 1, foilCount: 0, total: 70 }, collectorCardsAwarded: [] })
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={action} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Official Theme Albums' })
    await user.click(screen.getByRole('button', { name: /Open Super Cars Official Theme Album/ }))
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await user.click(screen.getByRole('button', { name: 'Stick Ferrari 488 GTB in Album' }))
    expect(screen.getByRole('dialog', { name: 'Stick in Album' })).toHaveTextContent('It cannot later be removed')
    await user.click(screen.getByRole('button', { name: 'Stick in Album' }))
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ action: 'stick-in-album', itemId: 'card:sportscars:1', variant: 'normal' }))
    expect(await screen.findByText(/Ferrari 488 GTB was permanently stuck/)).toBeInTheDocument()
  })
})
