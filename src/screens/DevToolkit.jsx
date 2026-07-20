import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { Badge, CardPanel, EmptyState, ErrorState, LoadingState } from '../ui/components.jsx'
import Icon from '../ui/Icon.jsx'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './DevToolkit.module.css'

const SECRET_KEY = 'fo_dev_toolkit_secret'
const RESET_SCOPES = [
  ['inventory', 'Reset Inventory'],
  ['theme-albums', 'Reset Theme Albums'],
  ['exchange', 'Reset Exchange'],
]

function total(rows, id) {
  return Number(rows?.find(row => row.currency_id === id)?.balance ?? 0)
}

export default function DevToolkit({ onBack, navProps }) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [coinAmount, setCoinAmount] = useState(500)
  const [themeId, setThemeId] = useState('')
  const [notice, setNotice] = useState('')

  const catalogue = payload?.catalogue
  const state = payload?.state
  const itemOptions = useMemo(() => catalogue?.grantableItems?.slice(0, 1000) ?? [], [catalogue])

  const load = async nextSecret => {
    if (!nextSecret) return
    setStatus('loading')
    setError('')
    try {
      const data = await playerGameApi.devToolsState(nextSecret)
      sessionStorage.setItem(SECRET_KEY, nextSecret)
      setPayload(data)
      setSelectedItem(current => current || data.catalogue.grantableItems[0]?.id || '')
      setThemeId(current => current || data.catalogue.themes[0]?.id || '')
      setStatus('ready')
    } catch (loadError) {
      setError(loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!secret) return undefined
    let active = true
    playerGameApi.devToolsState(secret)
      .then(data => {
        if (!active) return
        sessionStorage.setItem(SECRET_KEY, secret)
        setPayload(data)
        setSelectedItem(data.catalogue.grantableItems[0]?.id || '')
        setThemeId(data.catalogue.themes[0]?.id || '')
        setStatus('ready')
      })
      .catch(loadError => {
        if (!active) return
        setError(loadError.message)
        setStatus('error')
      })
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async body => {
    setNotice('')
    setStatus('saving')
    try {
      const data = await playerGameApi.devTools(body, secret)
      setPayload(data)
      setNotice('Preview toolkit action applied. Player state refreshed.')
      setStatus('ready')
    } catch (actionError) {
      setError(actionError.message)
      setStatus('error')
    }
  }

  return (
    <main className="fo-route-shell" data-concept-screen="dev-toolkit">
      <section className="fo-route-content">
        <header className={styles.header}>
          <button type="button" onClick={onBack}><Icon name="left" size={18}/> Back</button>
          <div>
            <Badge tone="epic">Preview only</Badge>
            <h1>Developer Toolkit</h1>
            <p>Seed and inspect the authenticated Preview player without touching Production.</p>
          </div>
        </header>

        <CardPanel className={styles.secretPanel}>
          <label>
            Developer secret
            <input value={secret} onChange={event => setSecret(event.target.value)} type="password" autoComplete="off" placeholder="Paste Preview toolkit secret" />
          </label>
          <button type="button" onClick={() => load(secret)} disabled={!secret || status === 'loading'}>Unlock toolkit</button>
        </CardPanel>

        {status === 'loading' && <LoadingState label="Loading developer state..." />}
        {status === 'error' && <ErrorState message={error} onRetry={() => load(secret)} />}
        {notice && <p className={styles.notice} role="status">{notice}</p>}

        {state && <div className={styles.grid}>
          <CardPanel>
            <h2>Authoritative State</h2>
            <div className={styles.stats}>
              <span><b>{total(state.balances, 'stars').toLocaleString()}</b> Stars</span>
              <span><b>{total(state.balances, 'coins').toLocaleString()}</b> Coins</span>
              <span><b>{state.inventory?.length ?? 0}</b> inventory rows</span>
              <span><b>{state.inventoryCapacity?.used ?? 0}/{state.inventoryCapacity?.capacity ?? '...'}</b> capacity</span>
            </div>
          </CardPanel>

          <CardPanel>
            <h2>Grant Item</h2>
            <label>Item<select value={selectedItem} onChange={event => setSelectedItem(event.target.value)}>
              {itemOptions.map(item => <option key={item.id} value={item.id}>{item.name} - {item.id}</option>)}
            </select></label>
            <label>Quantity<input type="number" min="1" max="500" value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
            <button type="button" onClick={() => run({ action: 'grant-item', itemId: selectedItem, quantity: Number(quantity) })} disabled={status === 'saving' || !selectedItem}>Grant item</button>
          </CardPanel>

          <CardPanel>
            <h2>Grant Coins</h2>
            <p>Coins are granted through the authorised promotional Coin ledger path.</p>
            <label>Coins<input type="number" min="1" max="100000" value={coinAmount} onChange={event => setCoinAmount(event.target.value)} /></label>
            <button type="button" onClick={() => run({ action: 'grant-coins', amount: Number(coinAmount) })} disabled={status === 'saving'}>Grant Coins</button>
          </CardPanel>

          <CardPanel>
            <h2>Grant Complete Theme</h2>
            <p>Adds one Inventory copy of every Normal card in the selected theme. The player can then use Stick in Album manually.</p>
            <label>Theme<select value={themeId} onChange={event => setThemeId(event.target.value)}>
              {catalogue.themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name} - {theme.cardCount} cards</option>)}
            </select></label>
            <button type="button" onClick={() => run({ action: 'grant-complete-theme', themeId })} disabled={status === 'saving' || !themeId}>Grant theme inventory</button>
          </CardPanel>

          <CardPanel>
            <h2>Reset Tools</h2>
            <div className={styles.resetList}>
              {RESET_SCOPES.map(([scope, label]) => <button key={scope} type="button" onClick={() => run({ action: 'reset', scope })} disabled={status === 'saving'}>{label}</button>)}
            </div>
          </CardPanel>

          <CardPanel>
            <h2>Prepared But Not Active</h2>
            <EmptyState icon="info" title="Foils and achievements are not live yet" detail={`${catalogue.unsupported.foilCards} ${catalogue.unsupported.achievements}`} />
          </CardPanel>
        </div>}
      </section>
      <BottomNav {...navProps} />
    </main>
  )
}
