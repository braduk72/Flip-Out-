import { useEffect, useMemo, useState } from 'react'
import { ITEM_BY_ID } from '../data/itemCatalog.js'
import { playerGameApi } from '../utils/gameApi.js'

export default function Marketplace({ onBack }) {
  const [listings, setListings] = useState([])
  const [inventory, setInventory] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [itemId, setItemId] = useState('')
  const [price, setPrice] = useState('')
  const tradable = useMemo(() => inventory.filter(row => ITEM_BY_ID.get(row.item_id)?.tradable && Number(row.quantity) > 0), [inventory])
  async function load() {
    setStatus('loading')
    try {
      const [market, state] = await Promise.all([playerGameApi.marketListings(), playerGameApi.state()])
      setListings(market.listings); setInventory(state.state.inventory); setStatus('ready')
    } catch (error) { setMessage(error.status === 403 ? 'Link a protected platform or recovery identity before using the marketplace.' : error.message); setStatus('error') }
  }
  useEffect(() => {
    let active = true
    Promise.all([playerGameApi.marketListings(), playerGameApi.state()]).then(([market, state]) => {
      if (active) { setListings(market.listings); setInventory(state.state.inventory); setStatus('ready') }
    }).catch(error => {
      if (active) { setMessage(error.status === 403 ? 'Link a protected platform or recovery identity before using the marketplace.' : error.message); setStatus('error') }
    })
    return () => { active = false }
  }, [])
  async function act(body) { setMessage(''); try { await playerGameApi.market(body); setMessage('Done.'); await load() } catch (error) { setMessage(error.message) } }
  return <main style={{ minHeight: '100vh', padding: 20, color: 'white', background: '#10152b' }}>
    <button onClick={onBack}>← Back</button><h1>Exchange</h1>
    <p>Fixed-price duplicate-item exchange. Flip-Out coins only; no cash-outs. The 10% fee is deducted from the seller proceeds.</p>
    {message && <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    {status === 'loading' && <p role="status">Loading listings…</p>}
    {status === 'ready' && <section><h2>Sell an eligible duplicate</h2>
      {tradable.length === 0 ? <p>No tradable duplicate items are available.</p> : <><select value={itemId} onChange={event => setItemId(event.target.value)}><option value="">Choose item</option>{tradable.map(row => <option key={row.item_id} value={row.item_id}>{ITEM_BY_ID.get(row.item_id)?.name ?? row.item_id} ×{row.quantity}</option>)}</select><input aria-label="Price in coins" inputMode="numeric" value={price} onChange={event => setPrice(event.target.value)} placeholder="Coin price"/><button onClick={() => act({ action: 'list', itemId, quantity: 1, priceCoins: Number(price) })}>List one</button></>}
      <h2>Active listings</h2>{listings.length === 0 ? <p>No active listings.</p> : <ul>{listings.map(row => <li key={row.listing_id}><strong>{ITEM_BY_ID.get(row.item_id)?.name ?? row.item_id}</strong> ×{row.quantity} — {row.price_coins} coins <button onClick={() => act({ action: 'buy', listingId: row.listing_id, requestId: `market-buy:${row.listing_id}` })}>Buy</button></li>)}</ul>}
    </section>}
  </main>
}
