import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { ITEM_BY_ID } from '../data/itemCatalog.js'
import { CardPanel, EmptyState, ErrorState, LoadingState } from '../ui/components.jsx'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './CollectionExchange.module.css'

const GROUPS = ['all', 'card', 'card_variant', 'deck', 'powerup', 'lockbox', 'key']

export default function Inventory({ onBack, navProps }) {
  const [status, setStatus] = useState('loading')
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [group, setGroup] = useState('all')
  const [opening, setOpening] = useState(false)
  const [notice, setNotice] = useState('')

  async function load() {
    const data = await playerGameApi.state()
    setState(data.state)
    setStatus('ready')
  }

  useEffect(() => {
    let active = true
    playerGameApi.state().then(data => {
      if (active) { setState(data.state); setStatus('ready') }
    }).catch(loadError => {
      if (active) { setError(loadError.message); setStatus('error') }
    })
    return () => { active = false }
  }, [])

  const items = useMemo(() => (state?.inventory ?? [])
    .map(row => ({ ...row, definition: ITEM_BY_ID.get(row.item_id) }))
    .filter(row => group === 'all' || row.definition?.type === group), [state, group])

  const openLockbox = async () => {
    setOpening(true)
    setNotice('')
    try {
      const result = await playerGameApi.action({ action: 'open-lockbox', openingId: `opening:${crypto.randomUUID()}` })
      setNotice(`Opened: ${result.reward.amount} ${result.reward.currencyId ?? result.reward.itemId}`)
      await load()
    } catch (openError) {
      setNotice(openError.message)
    } finally {
      setOpening(false)
    }
  }

  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="collection">
    <header className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Back to shop">‹</button>
      <div><span className={styles.eyebrow}>Collection</span><h1>My Collection</h1></div>
      <span aria-hidden="true" />
    </header>
    <div className={styles.scroll}>
      <nav className={styles.filters} aria-label="Collection categories">
        {GROUPS.map(value => <button key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{value.replace('_', ' ')}</button>)}
      </nav>

      {status === 'loading' && <LoadingState label="Loading your collection…" />}
      {status === 'error' && <ErrorState message={`Could not load collection: ${error}`} onRetry={load} />}
      {status === 'ready' && items.length === 0 && <CardPanel><EmptyState title="Nothing here yet" detail="Owned items in this category will appear here." /></CardPanel>}
      {items.length > 0 && <section className={styles.itemGrid} aria-label="Owned items">
        {items.map(row => <CardPanel as="article" className={styles.itemCard} key={row.item_id}>
          {row.definition?.asset && <img src={row.definition.asset} alt="" />}
          <div><strong>{row.definition?.name ?? row.item_id}</strong><span>{row.definition?.rarity ?? row.definition?.type ?? 'Item'}</span></div>
          <b>×{row.quantity}</b>
          {Number(row.bound_quantity) > 0 && <small>{row.bound_quantity} account-bound</small>}
        </CardPanel>)}
      </section>}

      <CardPanel className={styles.actionPanel}>
        <div><span className={styles.eyebrow}>Lockboxes</span><h2>Open an owned lockbox</h2><p>A standard box and matching key are consumed atomically.</p></div>
        <button className={styles.primary} disabled={opening} onClick={openLockbox}>{opening ? 'Opening…' : 'Open standard lockbox'}</button>
        {notice && <p role="status" className={styles.notice}>{notice}</p>}
      </CardPanel>

      <CardPanel className={styles.history}>
        <span className={styles.eyebrow}>Audited ownership</span><h2>Transaction history</h2>
        {status === 'ready' && !(state?.transactions?.length) && <EmptyState title="No transactions yet" detail="Rewards, purchases and item changes will be recorded here." />}
        {(state?.transactions?.length ?? 0) > 0 && <ol>{state.transactions.map(row => <li key={row.transaction_id}><span>{row.source}</span><strong>{row.amount > 0 ? '+' : ''}{row.amount} {row.currency_id ?? row.item_id}</strong></li>)}</ol>}
      </CardPanel>
      <p className={styles.footnote}>Foil variants and sticker albums remain unavailable until authoritative assets and metadata exist.</p>
    </div>
    <BottomNav active="collection" {...navProps} />
  </main>
}
