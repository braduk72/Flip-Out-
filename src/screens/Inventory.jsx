import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { RARITIES } from '../data/itemCatalog.js'
import { Badge, CardPanel, EmptyState, ErrorState, LoadingState, Modal, ProgressBar } from '../ui/components.jsx'
import Icon from '../ui/Icon.jsx'
import { buildCollectionData, buildRecyclerModel, filterCollectionCards, readCollectionFavourites, writeCollectionFavourites } from '../ui/collectionData.js'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './Collection.module.css'

const VIEWS = [
  ['albums', 'Albums', 'Albums'],
  ['cards', 'Cards', 'Cards'],
  ['favourites', 'Saved', 'Favourite cards'],
  ['stats', 'Stats', 'Collection statistics'],
  ['recycler', 'Recycle', 'Duplicate card recycler'],
  ['items', 'Items', 'Items'],
]
const PAGE_SIZE = 30

function CollectionCard({ card, onOpen, onFavourite }) {
  const stateLabel = card.owned ? `${card.quantity} owned` : 'Missing'
  return <article className={`${styles.cardTile} ${card.owned ? styles.cardOwned : styles.cardMissing} ${card.isGold ? styles.cardGold : ''} ${card.isFoil ? styles.cardFoil : ''}`}>
    <button type="button" className={styles.cardOpen} onClick={() => onOpen(card)} aria-label={`${card.name}, ${card.setName}, ${card.rarity}, ${stateLabel}`}>
      <span className={styles.cardArt}>
        <img src={card.asset} alt="" loading="lazy" decoding="async" />
        {!card.owned && <span className={styles.missingVeil}><Icon name="collection" size={25}/><b>Missing</b></span>}
        {card.quantity > 1 && <span className={styles.quantity}>×{card.quantity}</span>}
      </span>
      <span className={styles.cardCopy}>
        <strong>{card.name}</strong>
        <span>{card.setName}</span>
        <Badge tone={card.isFoil ? 'foil' : card.rarity}>{card.isGold ? 'Gold Collector' : card.isFoil ? 'Foil' : card.rarity}</Badge>
      </span>
    </button>
    <button type="button" className={`${styles.favouriteButton} ${card.favourite ? styles.favouriteActive : ''}`} onClick={() => onFavourite(card.id)} aria-pressed={card.favourite} aria-label={`${card.favourite ? 'Remove' : 'Add'} ${card.name} ${card.favourite ? 'from' : 'to'} favourites`}>
      <Icon name="heart" size={20}/>
    </button>
  </article>
}

function CardGrid({ cards, total, onOpen, onFavourite, onMore }) {
  if (!total) return <CardPanel><EmptyState icon="cards" title="No cards match" detail="Change the search or filters to reveal more of the catalogue." /></CardPanel>
  return <>
    <p className={styles.resultCount} role="status">Showing {cards.length} of {total} cards</p>
    <div className={styles.cardGrid}>{cards.map(card => <CollectionCard key={card.id} card={card} onOpen={onOpen} onFavourite={onFavourite}/>)}</div>
    {cards.length < total && <button type="button" className={styles.loadMore} onClick={onMore}>Show more cards</button>}
  </>
}

function SetCard({ set, onOpen }) {
  return <button type="button" className={styles.setCard} onClick={() => onOpen(set.id)} aria-label={`Open ${set.name}, ${set.owned} of ${set.total} cards owned`} style={{ '--set-colour': set.colour }}>
    <span className={styles.setMosaic} aria-hidden="true">{set.coverAssets.map((asset, index) => <img key={asset} src={asset} alt="" loading="lazy" style={{ '--tile': index }}/>)}</span>
    <span className={styles.setCopy}>
      <span className={styles.setHeading}><strong>{set.name}</strong>{set.complete && <Badge tone="ready">Complete</Badge>}</span>
      <span>{set.owned} / {set.total} · {set.percent}%</span>
      <ProgressBar value={set.owned} max={set.total} label={`${set.name}: ${set.owned} of ${set.total}`} tone="cyan" compact/>
      <small>{set.missing ? `${set.missing} missing` : 'Full set collected'}{set.goldAvailable ? ` · Gold ${set.goldOwned ? 'owned' : 'missing'}` : ''}</small>
    </span>
    <Icon name="right" size={20}/>
  </button>
}

export default function Inventory({ onBack, navProps, dataLoader = playerGameApi.state, actionRunner = playerGameApi.action, storage = globalThis.localStorage }) {
  const [status, setStatus] = useState('loading')
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('albums')
  const [query, setQuery] = useState('')
  const [setId, setSetId] = useState('all')
  const [ownership, setOwnership] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [variant, setVariant] = useState('all')
  const [sort, setSort] = useState('set')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [favourites, setFavourites] = useState([])
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [opening, setOpening] = useState(false)
  const [notice, setNotice] = useState('')
  const [recyclerSelection, setRecyclerSelection] = useState({})
  const [recycling, setRecycling] = useState(false)
  const [recyclerNotice, setRecyclerNotice] = useState('')
  const [recyclerReceipt, setRecyclerReceipt] = useState(null)
  const pendingRecycle = useRef(null)
  const scrollRef = useRef(null)

  const applyPayload = useCallback(payload => {
    const next = payload.state
    setState(next)
    setFavourites(readCollectionFavourites(storage, next?.profile?.player_id ?? 'guest'))
    setStatus('ready')
    setError('')
  }, [storage])

  const load = useCallback(async () => {
    setStatus('loading')
    try { applyPayload(await dataLoader()) }
    catch (loadError) { setError(loadError.message); setStatus('error') }
  }, [applyPayload, dataLoader])

  useEffect(() => {
    let active = true
    dataLoader().then(payload => { if (active) applyPayload(payload) }).catch(loadError => { if (active) { setError(loadError.message); setStatus('error') } })
    return () => { active = false }
  }, [applyPayload, dataLoader])

  const collection = useMemo(() => buildCollectionData(state ?? {}, favourites), [state, favourites])
  const filteredCards = useMemo(() => filterCollectionCards(collection.cards, {
    query, setId, ownership, rarity, variant, favouritesOnly: view === 'favourites', sort,
  }), [collection.cards, ownership, query, rarity, setId, sort, variant, view])
  const visibleCards = filteredCards.slice(0, visibleCount)
  const selectedCard = collection.cards.find(card => card.id === selectedCardId) ?? null
  const recyclerRecipe = state?.recyclerRecipes?.[0] ?? null
  const recycler = useMemo(() => buildRecyclerModel(collection.cards, recyclerRecipe, recyclerSelection), [collection.cards, recyclerRecipe, recyclerSelection])

  const selectView = next => {
    setView(next)
    setVisibleCount(PAGE_SIZE)
    if (next === 'favourites') setOwnership('all')
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openSet = id => { setSetId(id); setView('cards'); setVisibleCount(PAGE_SIZE); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggleFavourite = id => {
    setFavourites(current => {
      const next = current.includes(id) ? current.filter(entry => entry !== id) : [...current, id]
      writeCollectionFavourites(storage, state?.profile?.player_id ?? 'guest', next)
      return next
    })
  }
  const changeFilter = (setter, value) => { setter(value); setVisibleCount(PAGE_SIZE) }
  const resetFilters = () => { setQuery(''); setSetId('all'); setOwnership('all'); setRarity('all'); setVariant('all'); setSort('set'); setVisibleCount(PAGE_SIZE) }

  const openLockbox = async () => {
    setOpening(true)
    setNotice('')
    try {
      const result = await actionRunner({ action: 'open-lockbox', openingId: `opening:${crypto.randomUUID()}` })
      setNotice(`Opened: ${result.reward.amount} ${result.reward.currencyId ?? result.reward.itemId}`)
      applyPayload(await dataLoader())
    } catch (openError) { setNotice(openError.message) }
    finally { setOpening(false) }
  }

  const changeRecycleQuantity = (card, change) => {
    pendingRecycle.current = null
    setRecyclerNotice('')
    setRecyclerSelection(current => {
      const quantity = Math.max(0, Math.min(card.recyclableQuantity, (Number(current[card.id]) || 0) + change))
      if (!quantity) {
        const next = { ...current }
        delete next[card.id]
        return next
      }
      return { ...current, [card.id]: quantity }
    })
  }

  const recycleCards = async () => {
    if (!recycler.complete || !recyclerRecipe) return
    const items = recycler.selectedItems.map(entry => ({ itemId: entry.card.id, quantity: entry.quantity }))
    const payloadKey = JSON.stringify({ recipeId: recyclerRecipe.recipeId, items })
    if (!pendingRecycle.current || pendingRecycle.current.payloadKey !== payloadKey) pendingRecycle.current = {
      payloadKey,
      transactionId: `recycle:${crypto.randomUUID()}`,
    }
    setRecycling(true)
    setRecyclerNotice('')
    try {
      const result = await actionRunner({ action: 'recycle-duplicates', transactionId: pendingRecycle.current.transactionId, recipeId: recyclerRecipe.recipeId, items })
      setRecyclerReceipt(result)
      pendingRecycle.current = null
      setRecyclerSelection({})
      applyPayload(await dataLoader())
    } catch (recycleError) {
      setRecyclerNotice(`${recycleError.message}. Your selection is unchanged; retrying will use the same transaction ID.`)
    } finally { setRecycling(false) }
  }

  const stats = collection.stats
  const selectedSetName = collection.sets.find(set => set.id === setId)?.name
  const activeFilterCount = [setId !== 'all', ownership !== 'all', rarity !== 'all', variant !== 'all', sort !== 'set'].filter(Boolean).length

  return <main className={`${styles.page} foTheme`} data-concept-screen="route" data-screen="collection">
    <header className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">‹</button>
      <div><span className={styles.eyebrow}>Collection</span><h1>My Collection</h1></div>
      <span className={styles.headerCount} aria-label={`${stats.uniqueOwned} unique collectibles owned`}>{stats.uniqueOwned}</span>
    </header>

    <nav className={styles.viewTabs} aria-label="Collection views">
      {VIEWS.map(([id, label, accessibleLabel]) => <button key={id} type="button" aria-label={accessibleLabel} aria-current={view === id ? 'page' : undefined} onClick={() => selectView(id)}>{label}</button>)}
    </nav>

    <div ref={scrollRef} className={styles.scroll}>
      {status === 'loading' && <LoadingState label="Opening your collection…" />}
      {status === 'error' && <ErrorState message={`Could not load collection: ${error}`} onRetry={load} />}

      {status === 'ready' && <>
        <CardPanel variant="elevated" className={styles.collectionHero}>
          <div className={styles.heroCopy}><span className={styles.eyebrow}>Overall completion</span><strong>{stats.completion}%</strong><p>{stats.baseOwned} of {stats.totalBase} cards collected across {stats.totalSets} sets.</p></div>
          <ProgressBar value={stats.baseOwned} max={stats.totalBase} label={`Collection: ${stats.baseOwned} of ${stats.totalBase}`} tone="foil"/>
          <div className={styles.heroStats}><span><b>{stats.completedSets}</b> Complete sets</span><span><b>{stats.goldOwned}/{stats.goldTotal}</b> Gold cards</span><span><b>{stats.duplicates}</b> Duplicates</span></div>
        </CardPanel>

        {view === 'albums' && <section className={styles.albumView} aria-labelledby="albums-title">
          {collection.recent.length > 0 && <div className={styles.recentSection}>
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Fresh finds</span><h2>Recently obtained</h2></div><button type="button" onClick={() => { setSort('newest'); selectView('cards') }}>See all</button></div>
            <div className={styles.recentRail}>{collection.recent.slice(0, 8).map(card => <button key={card.id} type="button" onClick={() => setSelectedCardId(card.id)} aria-label={`View ${card.name}`}><img src={card.asset} alt="" loading="lazy"/><span>{card.name}</span></button>)}</div>
          </div>}
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Browse the catalogue</span><h2 id="albums-title">Albums &amp; sets</h2></div><span>{collection.albums.length} albums · {collection.sets.length} sets</span></div>
          <div className={styles.albumList}>{collection.albums.map(album => <CardPanel as="article" key={album.id} className={styles.albumPanel}>
            <div className={styles.albumHeading}><div><h3>{album.name}</h3><p>{album.detail}</p></div><strong>{album.percent}%</strong></div>
            <ProgressBar value={album.owned} max={album.total} label={`${album.name}: ${album.owned} of ${album.total}`} tone="purple"/>
            <div className={styles.setList}>{album.sets.map(set => <SetCard key={set.id} set={set} onOpen={openSet}/>)}</div>
          </CardPanel>)}</div>
        </section>}

        {(view === 'cards' || view === 'favourites') && <section className={styles.cardsView} aria-labelledby="cards-title">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{view === 'favourites' ? 'Your personal showcase' : selectedSetName ?? 'Full catalogue'}</span><h2 id="cards-title">{view === 'favourites' ? 'Favourite cards' : 'Cards'}</h2></div>{setId !== 'all' && <button type="button" onClick={() => setSetId('all')}>All sets</button>}</div>
          <div className={styles.searchRow}>
            <label className={styles.searchBox}><Icon name="search" size={20}/><span className={styles.srOnly}>Search cards and sets</span><input type="search" value={query} onChange={event => changeFilter(setQuery, event.target.value)} placeholder="Search cards or sets" /></label>
            <button type="button" className={styles.filterButton} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}><Icon name="filter" size={20}/> Filters{activeFilterCount ? <b>{activeFilterCount}</b> : null}</button>
          </div>
          {filtersOpen && <CardPanel variant="inset" className={styles.filterPanel}>
            <label>Set<select value={setId} onChange={event => changeFilter(setSetId, event.target.value)}><option value="all">All sets</option>{collection.sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></label>
            <label>Ownership<select value={ownership} onChange={event => changeFilter(setOwnership, event.target.value)}><option value="all">Owned &amp; missing</option><option value="owned">Owned only</option><option value="missing">Missing only</option></select></label>
            <label>Rarity<select value={rarity} onChange={event => changeFilter(setRarity, event.target.value)}><option value="all">All rarities</option>{RARITIES.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Variant<select value={variant} onChange={event => changeFilter(setVariant, event.target.value)}><option value="all">All variants</option><option value="base">Base cards</option><option value="gold">Gold Collector</option><option value="foil">Foils</option></select></label>
            <label>Sort<select value={sort} onChange={event => changeFilter(setSort, event.target.value)}><option value="set">Set order</option><option value="name">Name</option><option value="rarity">Rarity</option><option value="newest">Recently obtained</option></select></label>
            <button type="button" className={styles.resetButton} onClick={resetFilters}>Reset filters</button>
          </CardPanel>}
          {variant === 'foil' && stats.foilTotal === 0 ? <CardPanel><EmptyState icon="foil" title="Foils are not issued yet" detail="The catalogue contains no authoritative Foil definitions or assets. Nothing is being hidden or simulated." /></CardPanel> : view === 'favourites' && !filteredCards.length ? <CardPanel><EmptyState icon="heart" title="No favourites yet" detail="Tap the heart on any owned or missing card to build your personal showcase." action={<button className={styles.inlineAction} type="button" onClick={() => selectView('cards')}>Browse cards</button>} /></CardPanel> : <CardGrid cards={visibleCards} total={filteredCards.length} onOpen={card => setSelectedCardId(card.id)} onFavourite={toggleFavourite} onMore={() => setVisibleCount(count => count + PAGE_SIZE)}/>}
        </section>}

        {view === 'stats' && <section className={styles.statsView} aria-labelledby="stats-title">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Collection record</span><h2 id="stats-title">Statistics</h2></div></div>
          <div className={styles.statGrid}>
            {[['Unique', stats.uniqueOwned, stats.totalCollectibles], ['Base cards', stats.baseOwned, stats.totalBase], ['Complete sets', stats.completedSets, stats.totalSets], ['Favourites', stats.favourites, null], ['Duplicates', stats.duplicates, null], ['Gold Collector', stats.goldOwned, stats.goldTotal]].map(([label, value, total]) => <CardPanel key={label} className={styles.statCard}><span>{label}</span><strong>{value}{total != null && <small> / {total}</small>}</strong></CardPanel>)}
          </div>
          <CardPanel className={styles.milestonePanel}>
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Long-term goals</span><h3>Reward milestones</h3></div><strong>{stats.nextMilestone.percent}%</strong></div>
            <p>Next milestone at {stats.nextMilestone.target} base cards. Reward contents are deliberately inactive until an authoritative reward catalogue is configured.</p>
            <div className={styles.milestoneTrack}>{stats.milestones.map(milestone => <div key={milestone.percent} className={milestone.complete ? styles.milestoneComplete : ''}><span><Icon name={milestone.complete ? 'check' : 'rewards'} size={18}/></span><b>{milestone.percent}%</b><small>{milestone.target} cards</small></div>)}</div>
          </CardPanel>
          <CardPanel className={styles.rarityPanel}>
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Catalogue breakdown</span><h3>Rarity</h3></div></div>
            <div className={styles.rarityRows}>{RARITIES.map(value => <div key={value}><Badge tone={value}>{value}</Badge><span>{stats.rarity[value].owned} / {stats.rarity[value].total}</span><ProgressBar value={stats.rarity[value].owned} max={stats.rarity[value].total || 1} label={`${value}: ${stats.rarity[value].owned} of ${stats.rarity[value].total}`} compact/></div>)}</div>
          </CardPanel>
          <CardPanel className={styles.foilPanel}><span className={styles.foilIcon}><Icon name="foil"/></span><div><h3>Foils</h3><p>{stats.foilTotal ? `${stats.foilOwned} of ${stats.foilTotal} Foil variants owned.` : 'No authoritative Foil cards or artwork exist in the catalogue yet.'}</p></div><strong>{stats.foilOwned}</strong></CardPanel>
        </section>}

        {view === 'recycler' && <section className={styles.recyclerView} aria-labelledby="recycler-title">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Duplicates retain value</span><h2 id="recycler-title">Card Recycler</h2></div><Badge tone="ready">Keep one guaranteed</Badge></div>
          {!recyclerRecipe ? <CardPanel><EmptyState icon="recycle" title="Recycler recipe unavailable" detail="The server has not supplied an active recycling recipe, so no cards can be destroyed." /></CardPanel> : <>
            <CardPanel variant="elevated" className={`${styles.recyclerMachine} ${recycling ? styles.recyclerRunning : ''}`} aria-busy={recycling || undefined}>
              <div className={styles.machineHeader}><span className={styles.machineIcon}><Icon name="recycle" size={34}/></span><div><span className={styles.eyebrow}>Recipe {recyclerRecipe.configVersion}</span><h3>{recyclerRecipe.batchSize} {recyclerRecipe.rarity} duplicates</h3><p>Every batch returns {recyclerRecipe.reward.amount} {recyclerRecipe.reward.currencyId ?? recyclerRecipe.reward.itemId}. Your final copy is locked away safely.</p></div></div>
              <div className={styles.machineWindow} aria-hidden="true"><span className={styles.gearLarge}><Icon name="recycle" size={58}/></span><span className={styles.gearSmall}><Icon name="recycle" size={35}/></span><span className={styles.machineSteam}/><span className={styles.machineTray}><Icon name={recyclerRecipe.reward.currencyId === 'stars' ? 'star' : 'rewards'} size={26}/></span></div>
              <div className={styles.recyclerMeter}>
                <div><span>Loaded</span><strong>{recycler.cardsSelected} / {recycler.targetCards}</strong></div>
                <ProgressBar value={recycler.cardsSelected} max={recycler.targetCards} label={`${recycler.cardsSelected} duplicate cards loaded`} tone="purple"/>
                <p>{recycler.complete ? `${recycler.batches} complete ${recycler.batches === 1 ? 'batch' : 'batches'} · ${recycler.reward.amount} ${recycler.reward.currencyId ?? recycler.reward.itemId} guaranteed` : `Select ${recycler.cardsNeeded} more duplicate ${recycler.cardsNeeded === 1 ? 'card' : 'cards'} for a complete batch.`}</p>
              </div>
              <button type="button" className={styles.recycleButton} disabled={!recycler.complete || recycling} onClick={recycleCards}><Icon name="recycle"/>{recycling ? 'Recycling securely…' : recyclerNotice ? 'Retry secure recycling' : `Recycle ${recycler.cardsSelected || recycler.batchSize} cards`}</button>
              {recyclerNotice && <p className={styles.recyclerError} role="alert">{recyclerNotice}</p>}
            </CardPanel>

            <div className={styles.recyclerRules}><Icon name="info" size={20}/><p>Only duplicates are selectable. Recycling is permanent and server-authoritative. Cards listed on the Exchange are already held outside this inventory and cannot be selected here.</p></div>

            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Available to recycle</span><h3>Choose duplicates</h3></div><span>{recycler.eligibleCards.reduce((sum, card) => sum + card.recyclableQuantity, 0)} available</span></div>
            {!recycler.eligibleCards.length ? <CardPanel><EmptyState icon="cards" title="No eligible duplicates" detail={`Collect extra ${recyclerRecipe.rarity} cards to fill the machine. Your first copy of every card is always protected.`}/></CardPanel> : <div className={styles.recyclerGrid}>{recycler.eligibleCards.map(card => {
              const selected = Number(recyclerSelection[card.id]) || 0
              return <CardPanel as="article" className={`${styles.recyclerCard} ${selected ? styles.recyclerCardSelected : ''}`} key={card.id}>
                <img src={card.asset} alt="" loading="lazy"/>
                <div><strong>{card.name}</strong><span>{card.quantity} owned · {card.recyclableQuantity} recyclable</span></div>
                <div className={styles.quantityPicker} aria-label={`${card.name} selected quantity`}>
                  <button type="button" onClick={() => changeRecycleQuantity(card, -1)} disabled={!selected} aria-label={`Remove one ${card.name}`}><Icon name="minus" size={18}/></button>
                  <output aria-live="polite">{selected}</output>
                  <button type="button" onClick={() => changeRecycleQuantity(card, 1)} disabled={selected >= card.recyclableQuantity} aria-label={`Add one ${card.name}`}><Icon name="plus" size={18}/></button>
                </div>
              </CardPanel>
            })}</div>}
          </>}
        </section>}

        {view === 'items' && <section className={styles.itemsView} aria-labelledby="items-title">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Usable inventory</span><h2 id="items-title">Items</h2></div></div>
          {!collection.nonCards.length ? <CardPanel><EmptyState title="No items owned" detail="Power-ups, keys and lockboxes will appear here when the authoritative inventory contains them." /></CardPanel> : <div className={styles.itemGrid}>{collection.nonCards.map(row => <CardPanel as="article" className={styles.itemCard} key={row.item_id}>{row.definition.asset && <img src={row.definition.asset} alt="" loading="lazy"/>}<div><strong>{row.definition.name}</strong><span>{row.definition.rarity} · {row.definition.type.replace('_', ' ')}</span></div><b>×{row.quantity}</b></CardPanel>)}</div>}
          <CardPanel className={styles.lockboxPanel}><div><span className={styles.eyebrow}>Lockboxes</span><h3>Open a standard lockbox</h3><p>A standard box and matching key are consumed atomically by the server.</p></div><button type="button" className={styles.primary} disabled={opening} onClick={openLockbox}>{opening ? 'Opening…' : 'Open lockbox'}</button>{notice && <p role="status" className={styles.notice}>{notice}</p>}</CardPanel>
        </section>}
      </>}
    </div>

    <BottomNav active="collection" {...navProps} />

    <Modal open={Boolean(selectedCard)} title={selectedCard?.name ?? 'Card'} onDismiss={() => setSelectedCardId(null)} actions={selectedCard && <button type="button" className={styles.modalFavourite} onClick={() => toggleFavourite(selectedCard.id)}><Icon name="heart" size={20}/>{selectedCard.favourite ? 'Remove favourite' : 'Add to favourites'}</button>}>
      {selectedCard && <div className={styles.cardDetail}>
        <div className={`${styles.detailArt} ${selectedCard.owned ? '' : styles.detailMissing}`}><img src={selectedCard.asset} alt={`${selectedCard.name} card artwork`}/>{!selectedCard.owned && <span>Missing</span>}</div>
        <div className={styles.detailFacts}><Badge tone={selectedCard.isFoil ? 'foil' : selectedCard.rarity}>{selectedCard.isGold ? 'Gold Collector' : selectedCard.isFoil ? 'Foil' : selectedCard.rarity}</Badge><p><b>Set</b><span>{selectedCard.setName}</span></p><p><b>Status</b><span>{selectedCard.owned ? `${selectedCard.quantity} owned` : 'Not collected'}</span></p>{selectedCard.obtainedAt && <p><b>Obtained</b><span>{new Date(selectedCard.obtainedAt).toLocaleDateString()}</span></p>}</div>
      </div>}
    </Modal>

    <Modal open={Boolean(recyclerReceipt)} title="Recycling complete" tone="reward" onDismiss={() => setRecyclerReceipt(null)} actions={<button type="button" className={styles.primary} onClick={() => setRecyclerReceipt(null)}>Collect reward</button>}>
      {recyclerReceipt && <div className={styles.recyclerResult}>
        <div className={styles.resultMachine} aria-hidden="true"><Icon name="recycle" size={46}/><span/><Icon name={recyclerReceipt.reward.currencyId === 'stars' ? 'star' : 'rewards'} size={52}/></div>
        <strong>+{recyclerReceipt.reward.amount} {recyclerReceipt.reward.currencyId ?? recyclerReceipt.reward.itemId}</strong>
        <p>{recyclerReceipt.cardsConsumed} duplicate cards were permanently recycled in one secure transaction.</p>
        <small>Receipt: {recyclerReceipt.transactionId}{recyclerReceipt.duplicate ? ' · Safe retry confirmed' : ''}</small>
      </div>}
    </Modal>
  </main>
}
