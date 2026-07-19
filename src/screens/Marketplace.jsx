import { useEffect, useMemo, useState } from 'react'
import { ITEM_BY_ID } from '../data/itemCatalog.js'
import BottomNav from '../components/BottomNav.jsx'
import { CardPanel, EmptyState, ErrorState, LoadingState } from '../ui/components.jsx'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './CollectionExchange.module.css'

export default function Marketplace({ onBack, navProps }) {
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
      setListings(market.listings)
      setInventory(state.state.inventory)
      setStatus('ready')
    } catch (loadError) {
      setMessage(loadError.status === 403 ? 'Link a protected platform or recovery identity before using the Exchange.' : loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([playerGameApi.marketListings(), playerGameApi.state()]).then(([market, state]) => {
      if (active) { setListings(market.listings); setInventory(state.state.inventory); setStatus('ready') }
    }).catch(loadError => {
      if (active) {
        setMessage(loadError.status === 403 ? 'Link a protected platform or recovery identity before using the Exchange.' : loadError.message)
        setStatus('error')
      }
    })
    return () => { active = false }
  }, [])

  async function act(body) {
    setMessage('')
    try { await playerGameApi.market(body); setMessage('Transaction complete.'); await load() }
    catch (actionError) { setMessage(actionError.message) }
  }

  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="exchange">
    <header className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Back to shop">‹</button>
      <div><span className={styles.eyebrow}>Coin-only marketplace</span><h1>Exchange</h1></div>
      <span aria-hidden="true" />
    </header>
    <div className={styles.scroll}>
      <CardPanel className={styles.exchangeIntro}>
        <h2>Trade eligible duplicate items</h2>
        <p>Every listing uses Coins, audited ownership and a complete transaction history. Sellers receive 90%; the Exchange fee is 10%.</p>
      </CardPanel>
      {message && status !== 'error' && <p className={styles.notice} role="status">{message}</p>}
      {status === 'loading' && <LoadingState label="Loading Exchange listings…" />}
      {status === 'error' && <ErrorState message={message} onRetry={load} />}
      {status === 'ready' && <>
        <CardPanel className={styles.sellPanel}>
          <span className={styles.eyebrow}>Sell</span><h2>List an eligible duplicate</h2>
          {tradable.length === 0 ? <EmptyState title="No tradable duplicates" detail="Eligible duplicate items will appear here." /> : <div className={styles.sellForm}>
            <label>Item<select value={itemId} onChange={event => setItemId(event.target.value)}><option value="">Choose item</option>{tradable.map(row => <option key={row.item_id} value={row.item_id}>{ITEM_BY_ID.get(row.item_id)?.name ?? row.item_id} ×{row.quantity}</option>)}</select></label>
            <label>Price in Coins<input inputMode="numeric" value={price} onChange={event => setPrice(event.target.value)} placeholder="Coin price" /></label>
            <button className={styles.primary} disabled={!itemId || !Number(price)} onClick={() => act({ action: 'list', itemId, quantity: 1, priceCoins: Number(price) })}>List one item</button>
          </div>}
        </CardPanel>
        <section className={styles.listings} aria-labelledby="active-listings"><span className={styles.eyebrow}>Buy</span><h2 id="active-listings">Active listings</h2>
          {listings.length === 0 ? <CardPanel><EmptyState title="No active listings" detail="Player listings will appear here when available." /></CardPanel> : listings.map(row => <CardPanel as="article" className={styles.listing} key={row.listing_id}>
            <div><strong>{ITEM_BY_ID.get(row.item_id)?.name ?? row.item_id}</strong><span>Quantity {row.quantity}</span></div>
            <b>{row.price_coins} Coins</b>
            <button className={styles.primary} onClick={() => act({ action: 'buy', listingId: row.listing_id, requestId: `market-buy:${row.listing_id}` })}>Buy</button>
          </CardPanel>)}
        </section>
      </>}
    </div>
    <BottomNav active="more" {...navProps} />
  </main>
}
