import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { ITEM_BY_ID } from '../data/itemCatalog.js'
import { playerGameApi } from '../utils/gameApi.js'

const GROUPS = ['all', 'card', 'card_variant', 'deck', 'powerup', 'lockbox', 'key']

export default function Inventory({ onBack, navProps }) {
  const [status, setStatus] = useState('loading')
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [group, setGroup] = useState('all')
  const [opening, setOpening] = useState(false)
  const [notice, setNotice] = useState('')
  async function load() { const data = await playerGameApi.state(); setState(data.state); setStatus('ready') }
  useEffect(() => { let active = true; playerGameApi.state().then(data => { if (active) { setState(data.state); setStatus('ready') } }).catch(err => { if (active) { setError(err.message); setStatus('error') } }); return () => { active = false } }, [])
  const items = useMemo(() => (state?.inventory ?? []).map(row => ({ ...row, definition: ITEM_BY_ID.get(row.item_id) })).filter(row => group === 'all' || row.definition?.type === group), [state, group])
  return <main style={{ minHeight: '100vh', padding: '20px', color: 'white', background: '#10152b' }}>
    <button onClick={onBack} aria-label="Back to shop">← Back</button>
    <h1>My Collection</h1>
    <nav aria-label="Collection categories" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{GROUPS.map(value => <button key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{value.replace('_', ' ')}</button>)}</nav>
    {status === 'loading' && <p role="status">Loading your collection…</p>}
    {status === 'error' && <p role="alert">Could not load collection: {error}</p>}
    {status === 'ready' && items.length === 0 && <p>No owned items in this category yet.</p>}
    {items.length > 0 && <ul>{items.map(row => <li key={row.item_id} style={{ margin: '12px 0' }}><strong>{row.definition?.name ?? row.item_id}</strong> ×{row.quantity}{Number(row.bound_quantity) > 0 ? ` (${row.bound_quantity} account-bound)` : ''}</li>)}</ul>}
    <button disabled={opening} onClick={async () => { setOpening(true); setNotice(''); try { const result = await playerGameApi.action({ action: 'open-lockbox', openingId: `opening:${crypto.randomUUID()}` }); setNotice(`Opened: ${result.reward.amount} ${result.reward.currencyId ?? result.reward.itemId}`); await load() } catch (err) { setNotice(err.message) } finally { setOpening(false) } }}>Open one standard lockbox</button>
    {notice && <p role="status">{notice}</p>}
    <h2>Transaction history</h2>
    {status === 'ready' && !(state?.transactions?.length) && <p>No transactions yet.</p>}
    <ol>{(state?.transactions ?? []).map(row => <li key={row.transaction_id}>{row.source}: {row.amount > 0 ? '+' : ''}{row.amount} {row.currency_id ?? row.item_id}</li>)}</ol>
    <p>Foil variants and sticker albums will appear here when authoritative assets and metadata exist.</p>
    <BottomNav active="shop" {...navProps} />
  </main>
}
