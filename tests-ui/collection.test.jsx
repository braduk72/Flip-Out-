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
  },
}

function renderCollection() {
  const loader = vi.fn().mockResolvedValue(payload)
  render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={vi.fn()} storage={localStorage}/>)
  return loader
}

describe('Collection 2.0', () => {
  it('presents real album/set progress and opens a set without losing catalogue context', async () => {
    const user = userEvent.setup()
    renderCollection()
    expect(await screen.findByRole('heading', { name: 'Albums & sets' })).toBeInTheDocument()
    expect(screen.getByText(/1 of 653 cards collected/)).toBeInTheDocument()
    const superCars = screen.getByRole('button', { name: /Open Super Cars, 1 of 70 cards owned/ })
    await user.click(superCars)
    expect(screen.getByRole('heading', { name: 'Cards' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All sets' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search cards and sets' })).toBeInTheDocument()
  })

  it('searches, favourites and reuses the account-scoped favourite in the showcase', async () => {
    const user = userEvent.setup()
    renderCollection()
    await screen.findByRole('heading', { name: 'Albums & sets' })
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
    await screen.findByRole('heading', { name: 'Albums & sets' })
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
    await screen.findByRole('heading', { name: 'Albums & sets' })
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
        recyclerRecipes: [{ recipeId: 'common-stars-v1', rarity: 'common', batchSize: 5, reward: { currencyId: 'stars', amount: 5 }, configVersion: 1 }],
      },
    }
    const loader = vi.fn().mockResolvedValue(recyclerPayload)
    const action = vi.fn().mockResolvedValue({ duplicate: false, transactionId: 'recycle:test', cardsConsumed: 5, batches: 1, reward: { currencyId: 'stars', amount: 5 }, items: [{ itemId: 'card:sportscars:1', quantity: 5 }] })
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={action} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Albums & sets' })
    await user.click(screen.getByRole('button', { name: 'Duplicate card recycler' }))
    const add = screen.getByRole('button', { name: 'Add one Ferrari 488 GTB' })
    for (let count = 0; count < 5; count += 1) await user.click(add)
    await user.click(screen.getByRole('button', { name: 'Recycle 5 cards' }))
    expect(await screen.findByRole('dialog', { name: 'Recycling complete' })).toBeInTheDocument()
    expect(screen.getByText('+5 stars')).toBeInTheDocument()
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ action: 'recycle-duplicates', recipeId: 'common-stars-v1', items: [{ itemId: 'card:sportscars:1', quantity: 5 }] }))
  })

  it('reuses the transaction ID after an interrupted recycler response', async () => {
    const user = userEvent.setup()
    const recyclerPayload = {
      state: {
        ...payload.state,
        inventory: [{ item_id: 'card:sportscars:1', quantity: 6, bound_quantity: 0 }],
        recyclerRecipes: [{ recipeId: 'common-stars-v1', rarity: 'common', batchSize: 5, reward: { currencyId: 'stars', amount: 5 }, configVersion: 1 }],
      },
    }
    const loader = vi.fn().mockResolvedValue(recyclerPayload)
    const action = vi.fn().mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValue({ duplicate: true, transactionId: 'recycle:retry', cardsConsumed: 5, batches: 1, reward: { currencyId: 'stars', amount: 5 }, items: [{ itemId: 'card:sportscars:1', quantity: 5 }] })
    render(<Inventory onBack={() => {}} navProps={{}} dataLoader={loader} actionRunner={action} storage={localStorage}/>)
    await screen.findByRole('heading', { name: 'Albums & sets' })
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
})
