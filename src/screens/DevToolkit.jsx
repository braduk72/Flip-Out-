import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { Badge, CardPanel, EmptyState, ErrorState, LoadingState } from '../ui/components.jsx'
import Icon from '../ui/Icon.jsx'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './DevToolkit.module.css'

const SECRET_KEY = 'fo_dev_toolkit_secret'
const PAGES = [
  ['player', 'Player'],
  ['match3', 'Match-3'],
  ['collection', 'Collection'],
  ['albums', 'Albums'],
  ['economy', 'Economy'],
  ['exchange', 'Exchange'],
  ['achievements', 'Achievements'],
  ['debug', 'Debug'],
]

function total(rows, id) {
  return Number(rows?.find(row => row.currency_id === id)?.balance ?? 0)
}

function capacityLabel(capacity = {}) {
  const used = capacity.cardCount ?? capacity.used ?? 0
  const max = capacity.cardCapacity ?? capacity.capacity ?? '—'
  const remaining = capacity.remainingCardSlots ?? (Number.isFinite(Number(max)) ? Number(max) - Number(used) : '—')
  return { used, max, remaining }
}

function JsonBlock({ value }) {
  return <pre className={styles.jsonBlock}>{JSON.stringify(value, null, 2)}</pre>
}

function ActionButton({ children, onClick, disabled, tone = 'primary' }) {
  return <button type="button" className={`${styles.actionButton} ${styles[`button_${tone}`] ?? ''}`} disabled={disabled} onClick={onClick}>{children}</button>
}

function Unsupported({ title, detail }) {
  return <CardPanel className={styles.unsupported}><EmptyState icon="info" title={title} detail={detail}/></CardPanel>
}

export default function DevToolkit({ onBack, navProps, onJumpMatch3 }) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? '')
  const [page, setPage] = useState('player')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [coinAmount, setCoinAmount] = useState(500)
  const [powerQuantity, setPowerQuantity] = useState(5)
  const [themeId, setThemeId] = useState('')
  const [collectorTier, setCollectorTier] = useState('all')
  const [levelId, setLevelId] = useState(1)
  const [selectedAchievement, setSelectedAchievement] = useState('')
  const [notice, setNotice] = useState('')

  const catalogue = payload?.catalogue
  const state = payload?.state
  const dev = payload?.dev ?? {}
  const itemOptions = useMemo(() => catalogue?.grantableItems?.slice(0, 1200) ?? [], [catalogue])
  const cardOptions = useMemo(() => itemOptions.filter(item => item.type === 'card' || item.type === 'card_variant'), [itemOptions])
  const powerOptions = useMemo(() => itemOptions.filter(item => item.type === 'powerup'), [itemOptions])
  const cap = capacityLabel(state?.inventoryCapacity)

  const rememberPayload = data => {
    setPayload(data)
    setSelectedItem(current => current || data.catalogue?.grantableItems?.[0]?.id || '')
    setThemeId(current => current || data.catalogue?.themes?.[0]?.id || '')
    setSelectedAchievement(current => current || data.catalogue?.achievements?.[0]?.id || '')
  }

  const load = async nextSecret => {
    if (!nextSecret) return
    setStatus('loading')
    setError('')
    try {
      const data = await playerGameApi.devToolsState(nextSecret)
      sessionStorage.setItem(SECRET_KEY, nextSecret)
      rememberPayload(data)
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
      .then(data => { if (active) { sessionStorage.setItem(SECRET_KEY, secret); rememberPayload(data); setStatus('ready') } })
      .catch(loadError => { if (active) { setError(loadError.message); setStatus('error') } })
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async body => {
    setNotice('')
    setError('')
    setStatus('saving')
    try {
      const data = await playerGameApi.devTools(body, secret)
      rememberPayload(data)
      setNotice(`Applied: ${body.action}`)
      setStatus('ready')
    } catch (actionError) {
      setError(actionError.message)
      setStatus('error')
    }
  }

  const pageProps = { state, dev, catalogue, itemOptions, cardOptions, powerOptions, selectedItem, setSelectedItem, quantity, setQuantity, coinAmount, setCoinAmount, powerQuantity, setPowerQuantity, themeId, setThemeId, collectorTier, setCollectorTier, levelId, setLevelId, selectedAchievement, setSelectedAchievement, status, run, onJumpMatch3 }

  return (
    <main className="fo-route-shell" data-concept-screen="dev-toolkit">
      <section className="fo-route-content">
        <header className={styles.header}>
          <button type="button" onClick={onBack}><Icon name="left" size={18}/> Back</button>
          <div>
            <Badge tone="epic">Preview only</Badge>
            <h1>Admin Toolkit</h1>
            <p>Authenticated Preview tools for testing Play, Collect, Trade and Achieve systems. Production is blocked server-side.</p>
          </div>
        </header>

        <CardPanel className={styles.secretPanel}>
          <label>
            Developer secret
            <input value={secret} onChange={event => setSecret(event.target.value)} type="password" autoComplete="off" placeholder="Paste Preview toolkit secret" />
          </label>
          <ActionButton onClick={() => load(secret)} disabled={!secret || status === 'loading'}>Unlock toolkit</ActionButton>
        </CardPanel>

        {status === 'loading' && <LoadingState label="Loading developer state..." />}
        {status === 'error' && <ErrorState message={error} onRetry={() => load(secret)} />}
        {notice && <p className={styles.notice} role="status">{notice}</p>}

        {state && <>
          <nav className={styles.pageTabs} aria-label="Admin toolkit pages">
            {PAGES.map(([id, label]) => <button key={id} type="button" aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}>{label}</button>)}
          </nav>
          {page === 'player' && <PlayerPage cap={cap} {...pageProps}/>}
          {page === 'match3' && <Match3Page {...pageProps}/>}
          {page === 'collection' && <CollectionPage {...pageProps}/>}
          {page === 'albums' && <AlbumsPage {...pageProps}/>}
          {page === 'economy' && <EconomyPage {...pageProps}/>}
          {page === 'exchange' && <ExchangePage {...pageProps}/>}
          {page === 'achievements' && <AchievementsPage {...pageProps}/>}
          {page === 'debug' && <DebugPage {...pageProps}/>}
        </>}
      </section>
      <BottomNav {...navProps} />
    </main>
  )
}

function PlayerPage({ state, dev, cap }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Player</h2><div className={styles.stats}><span><b>{state.profile?.display_name ?? 'No nickname'}</b> Nickname</span><span><b>{state.profile?.account_kind ?? 'guest'}</b> Account</span><span><b>{state.profile?.selected_avatar_id ?? 'none'}</b> Avatar</span><span><b>{state.profile?.player_id}</b> Player ID</span></div></CardPanel>
    <CardPanel><h2>Currencies</h2><div className={styles.stats}><span><b>{total(state.balances, 'stars').toLocaleString()}</b> Stars</span><span><b>{total(state.balances, 'coins').toLocaleString()}</b> Coins</span></div></CardPanel>
    <CardPanel><h2>Inventory capacity</h2><div className={styles.stats}><span><b>{cap.used}</b> Used</span><span><b>{cap.max}</b> Capacity</span><span><b>{cap.remaining}</b> Remaining</span><span><b>{state.inventory?.length ?? 0}</b> Rows</span></div></CardPanel>
    <CardPanel><h2>Progression</h2><div className={styles.stats}><span><b>{dev.match3?.highest_unlocked_level ?? 1}</b> Match-3 unlocked</span><span><b>{Object.keys(dev.match3?.completed_levels ?? {}).length}</b> Match-3 complete</span><span><b>{state.themeAlbums?.entries?.length ?? 0}</b> Theme slots</span><span><b>{state.personalAlbums?.albums?.length ?? 0}</b> Personal albums</span></div></CardPanel>
    <CardPanel className={styles.wide}><h2>Recent transactions</h2><Table rows={state.transactions ?? []} columns={['transaction_id', 'source', 'item_id', 'currency_id', 'amount']}/></CardPanel>
  </div>
}

function Match3Page({ dev, levelId, setLevelId, status, run, onJumpMatch3 }) {
  const theatre = dev.rewardTheatre ?? { available: false }
  return <div className={styles.grid}>
    <CardPanel><h2>Jump to level</h2><label>Level<input type="number" min="1" max="20" value={levelId} onChange={event => setLevelId(event.target.value)} /></label><ActionButton onClick={() => onJumpMatch3?.(Number(levelId))}>Open Match-3 level</ActionButton></CardPanel>
    <CardPanel><h2>Progress tools</h2><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'match3-mark-complete', levelId: Number(levelId) })}>Mark level complete</ActionButton><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'match3-unlock-all' })}>Unlock all levels</ActionButton><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'reset', scope: 'match3-progress' })}>Reset Match progression</ActionButton></CardPanel>
    <CardPanel><h2>Reward Theatre</h2><p>{theatre.available ? `Milestone ${theatre.milestone} is ready.` : 'Complete 5, 10, 15 or 20 Match-3 levels to unlock the next theatre reward.'}</p><ActionButton disabled={status === 'saving' || !theatre.available} onClick={() => run({ action: 'match3-reward-theatre', milestone: theatre.milestone })}>Trigger Reward Theatre</ActionButton></CardPanel>
    <Unsupported title="Daily Wheel trigger uses player UI" detail="Daily Wheel claims remain available through the Rewards service; direct toolkit forcing is postponed to avoid bypassing claim rules."/>
  </div>
}

function CollectionPage({ catalogue, cardOptions, selectedItem, setSelectedItem, quantity, setQuantity, themeId, setThemeId, collectorTier, setCollectorTier, status, run }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Grant any card</h2><label>Card<select value={selectedItem} onChange={event => setSelectedItem(event.target.value)}>{cardOptions.map(item => <option key={item.id} value={item.id}>{item.name} - {item.id}</option>)}</select></label><label>Quantity<input type="number" min="1" max="500" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-item', itemId: selectedItem, quantity: Number(quantity) })}>Grant card</ActionButton></CardPanel>
    <CardPanel><h2>Grant complete Theme</h2><ThemeSelect catalogue={catalogue} value={themeId} onChange={setThemeId}/><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-complete-theme', themeId })}>Grant Theme inventory</ActionButton></CardPanel>
    <CardPanel><h2>Grant complete collection</h2><p>Grants one Inventory copy of every Normal card in every active Theme.</p><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-complete-collection' })}>Grant complete collection</ActionButton></CardPanel>
    <CardPanel><h2>Grant Collector Cards</h2><ThemeSelect catalogue={catalogue} value={themeId} onChange={setThemeId} includeAll/><label>Tier<select value={collectorTier} onChange={event => setCollectorTier(event.target.value)}><option value="all">All tiers</option><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option></select></label><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-collector-cards', themeId, tier: collectorTier })}>Grant Collector Cards</ActionButton></CardPanel>
    <Unsupported title="Foil grant not live" detail={catalogue?.unsupported?.foilCards}/>
  </div>
}

function AlbumsPage({ catalogue, themeId, setThemeId, status, run }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Reset one Theme</h2><ThemeSelect catalogue={catalogue} value={themeId} onChange={setThemeId}/><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'reset', scope: 'theme-album', themeId })}>Reset Theme</ActionButton></CardPanel>
    <CardPanel><h2>Reset all Themes</h2><p>Preview-only immutable album reset for the authenticated player.</p><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'reset', scope: 'theme-albums' })}>Reset all Themes</ActionButton></CardPanel>
    <CardPanel><h2>Reset Personal Albums</h2><p>Deletes Personal Album folders and memberships; Inventory is unchanged.</p><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'reset', scope: 'personal-albums' })}>Reset Personal Albums</ActionButton></CardPanel>
  </div>
}

function EconomyPage({ state, dev, coinAmount, setCoinAmount, powerQuantity, setPowerQuantity, powerOptions, status, run }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Grant Coins</h2><p>Uses authorised promotional Coin ledger grant.</p><label>Coins<input type="number" min="1" max="100000" value={coinAmount} onChange={event => setCoinAmount(event.target.value)} /></label><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-coins', amount: Number(coinAmount) })}>Grant Coins</ActionButton></CardPanel>
    <CardPanel><h2>Grant power-ups</h2><p>{powerOptions.length} power-up definitions available.</p><label>Quantity each<input type="number" min="1" max="100" value={powerQuantity} onChange={event => setPowerQuantity(event.target.value)} /></label><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-power-ups', quantity: Number(powerQuantity) })}>Grant all power-ups</ActionButton></CardPanel>
    <CardPanel className={styles.wide}><h2>Coin ledger</h2><Table rows={dev.coinLedger ?? []} columns={['ledger_sequence', 'amount', 'transaction_type', 'source_reference_id', 'created_at']}/></CardPanel>
    <CardPanel className={styles.wide}><h2>Inventory items</h2><Table rows={state.inventory ?? []} columns={['item_id', 'quantity', 'bound_quantity']}/></CardPanel>
    <CardPanel><h2>Grant boosters</h2><p>Preview-only stackable booster inventory items. Purchases and opening remain disabled until the secure backend is approved.</p><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-item', itemId: 'booster:themed', quantity: 1 })}>Grant Themed Booster</ActionButton><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'grant-item', itemId: 'booster:random', quantity: 1 })}>Grant Random Booster</ActionButton></CardPanel>
  </div>
}

function ExchangePage({ dev, status, run }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Seed market</h2><p>Creates deterministic initial listings from the protected Preview market-maker account.</p><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'seed-initial-market' })}>Seed market</ActionButton></CardPanel>
    <CardPanel><h2>Expire listings</h2><p>Runs lazy expiry for the authenticated player and returns expired escrow.</p><ActionButton disabled={status === 'saving'} onClick={() => run({ action: 'exchange-expire' })}>Expire listings</ActionButton></CardPanel>
    <CardPanel><h2>Clear listings</h2><p>Returns active escrow and clears current-player listings. Include seed to clear market-maker listings too.</p><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'exchange-clear', includeSeed: true })}>Clear listings + seed</ActionButton></CardPanel>
    <CardPanel className={styles.wide}><h2>Exchange / escrow</h2><Table rows={dev.exchange ?? []} columns={['listing_id', 'status', 'item_id', 'quantity', 'price_coins', 'expires_at']}/></CardPanel>
  </div>
}

function AchievementsPage({ state, catalogue, selectedAchievement, setSelectedAchievement, status, run }) {
  const definitions = catalogue?.achievements ?? state.achievements?.definitions ?? []
  const selected = definitions.find(achievement => achievement.id === selectedAchievement) ?? definitions[0]
  const unlocked = state.achievements?.unlocked ?? []
  const progress = state.achievements?.progress ?? []
  return <div className={styles.grid}>
    <CardPanel><h2>Unlock / reset</h2><label>Achievement<select value={selected?.id ?? ''} onChange={event => setSelectedAchievement(event.target.value)}>{definitions.map(achievement => <option key={achievement.id} value={achievement.id}>{achievement.name}</option>)}</select></label>{selected && <p>{selected.description}</p>}<ActionButton disabled={status === 'saving' || !selected} onClick={() => run({ action: 'achievement-unlock', achievementId: selected.id })}>Unlock achievement</ActionButton><ActionButton tone="danger" disabled={status === 'saving' || !selected} onClick={() => run({ action: 'achievement-reset', achievementId: selected.id })}>Reset achievement</ActionButton><ActionButton tone="danger" disabled={status === 'saving'} onClick={() => run({ action: 'achievement-reset', achievementId: 'all' })}>Reset all achievements</ActionButton></CardPanel>
    <CardPanel><h2>Progress</h2><Table rows={progress} columns={['achievementId', 'current', 'target', 'complete', 'unlocked']}/></CardPanel>
    <CardPanel className={styles.wide}><h2>Unlocked</h2><Table rows={unlocked} columns={['achievement_id', 'transaction_id', 'unlocked_at']}/></CardPanel>
  </div>
}

function DebugPage({ state, dev }) {
  return <div className={styles.grid}>
    <CardPanel><h2>Debug toggles</h2><div className={styles.stats}><span><b>Prepared</b> Simulate first login</span><span><b>Prepared</b> Toggle premium</span><span><b>Prepared</b> Toggle ads</span><span><b>{dev.featureFlags?.length ?? 0}</b> Feature flags</span></div><p>These toggles need authoritative persistence before they can mutate player state safely.</p></CardPanel>
    <CardPanel className={styles.wide}><h2>Server player JSON</h2><JsonBlock value={{ state, dev }}/></CardPanel>
  </div>
}

function ThemeSelect({ catalogue, value, onChange, includeAll = false }) {
  return <label>Theme<select value={value} onChange={event => onChange(event.target.value)}>{includeAll && <option value="all">All Themes</option>}{catalogue?.themes?.map(theme => <option key={theme.id} value={theme.id}>{theme.name} - {theme.cardCount} cards</option>)}</select></label>
}

function Table({ rows = [], columns = [] }) {
  if (!rows.length) return <p className={styles.emptyTable}>No rows.</p>
  return <div className={styles.tableWrap}><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.transaction_id ?? row.listing_id ?? row.item_id ?? index}>{columns.map(column => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>
}
