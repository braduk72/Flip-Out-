import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { RARITIES } from '../data/itemCatalog.js'
import { Badge, CardPanel, EmptyState, ErrorState, LoadingState, Modal, ProgressBar } from '../ui/components.jsx'
import Icon from '../ui/Icon.jsx'
import { buildCollectionData, buildRecyclerModel, filterCollectionCards, formatRecyclerReward, readCollectionFavourites, writeCollectionFavourites } from '../ui/collectionData.js'
import { playerGameApi } from '../utils/gameApi.js'
import styles from './Collection.module.css'

const VIEWS = [
  ['albums', 'Official Albums', 'Official Theme Albums'],
  ['cards', 'Cards', 'Cards'],
  ['favourites', 'Saved', 'Favourite cards'],
  ['stats', 'Stats', 'Collection statistics'],
  ['recycler', 'Shred', 'Card Shredder'],
  ['items', 'Items', 'Items'],
]
const PAGE_SIZE = 30
const ALBUM_PAGE_SIZE = 6
function rarityLabel(card) {
  const count = card.rarityStars ?? 1
  return `${'★'.repeat(count)}${'☆'.repeat(5 - count)} ${card.rarity}`
}

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

function CollectorPyramid({ theme }) {
  return <div className={styles.collectorPyramid} role="list" aria-label={`${theme.name} Collector Cards`}>
    {(theme.collectorCards ?? []).map(card => {
      const earned = Boolean(card.earned)
      return <article key={card.tier} role="listitem" className={`${styles.collectorSlot} ${styles[`collector${card.tier}`]} ${earned ? styles.collectorEarned : ''}`}>
        <span>{card.tier}</span>
        <div className={styles.collectorCardArt} aria-hidden="true">
          {earned && card.asset ? <img src={card.asset} alt="" loading="lazy" decoding="async"/> : <b>{card.tier[0].toUpperCase()}</b>}
        </div>
        <strong>{card.label}</strong>
        <small>{earned ? 'Earned and permanently account-bound' : card.requirement}</small>
      </article>
    })}
  </div>
}

function ThemeAlbumCover({ theme, onOpen }) {
  const style = { '--album-accent': theme.presentation.accent, '--album-bg': theme.presentation.background }
  return <button type="button" className={styles.themeAlbumCover} style={style} onClick={() => onOpen(theme.id)} aria-label={`Open ${theme.name} Official Theme Album, ${theme.normalStuck} of ${theme.normalTotal} Normal cards stuck, ${theme.foilStuck} of ${theme.foilTotal} Foil cards stuck`}>
    <span className={styles.albumCoverArt} aria-hidden="true">
      <img src={theme.coverAsset} alt="" loading="lazy" decoding="async"/>
    </span>
    <span className={styles.albumCoverCopy}>
      <span className={styles.eyebrow}>Official Theme Album</span>
      <strong>{theme.name}</strong>
      <small>{theme.total} unique cards · {theme.presentation.mood}</small>
    </span>
    <span className={styles.albumProgressGrid}>
      <span><b>{theme.normalStuck}/{theme.normalTotal}</b> Normal</span>
      <span><b>{theme.foilStuck}/{theme.foilTotal}</b> Foil</span>
      <span><b>{theme.overallPercent}%</b> Overall</span>
    </span>
    <span className={styles.collectorBadges} aria-label={`Collector status: Bronze ${theme.collectors.bronze ? 'earned' : 'locked'}, Silver ${theme.collectors.silver ? 'earned' : 'locked'}, Gold ${theme.collectors.gold ? 'earned' : 'locked'}`}>
      {['bronze', 'silver', 'gold'].map(tier => <i key={tier} className={theme.collectors[tier] ? styles.collectorBadgeEarned : ''}>{tier[0].toUpperCase()}</i>)}
    </span>
  </button>
}

function AlbumSlot({ card, variant, justStuck, onStick }) {
  const isFoil = variant === 'foil'
  const filled = isFoil ? card.foilStuckInThemeAlbum : card.normalStuckInThemeAlbum
  const eligible = !isFoil && card.eligibleForThemeAlbum
  const label = `${card.name} card ${card.number}, ${isFoil ? 'Foil' : 'Normal'} slot, ${filled ? 'stuck in album' : eligible ? 'empty with eligible Inventory copy' : 'empty'}`
  return <div className={`${styles.albumSlot} ${isFoil ? styles.foilSlot : styles.normalSlot} ${filled ? styles.slotFilled : ''} ${justStuck ? styles.slotJustStuck : ''}`} aria-label={label}>
    {filled ? <img src={card.asset} alt="" loading="lazy" decoding="async"/> : <>
      <b>#{card.number}</b>
      <span>{isFoil ? 'Foil' : 'Normal'}</span>
      {eligible && <button type="button" className={styles.stickInline} onClick={() => onStick(card)} aria-label={`Stick ${card.name} in Album`}>Stick in Album</button>}
    </>}
  </div>
}

function ThemeAlbumPage({ theme, page, onPage, onBack, onStick, justStuck }) {
  const totalCardPages = Math.max(1, Math.ceil(theme.cards.length / ALBUM_PAGE_SIZE))
  const maxPage = totalCardPages
  const safePage = Math.max(0, Math.min(page, maxPage))
  const cards = safePage === 0 ? [] : theme.cards.slice((safePage - 1) * ALBUM_PAGE_SIZE, safePage * ALBUM_PAGE_SIZE)
  const style = { '--album-accent': theme.presentation.accent, '--album-bg': theme.presentation.background }
  return <section className={styles.officialAlbumPage} style={style} aria-label={`${theme.name} Official Theme Album`}>
    <div className={styles.albumToolbar}>
      <button type="button" onClick={onBack}>Return to Theme Albums</button>
      <button type="button" onClick={() => onPage(0)} disabled={safePage === 0}>Collector Cards</button>
      <span aria-live="polite">Page {safePage + 1} of {maxPage + 1}</span>
    </div>
    <CardPanel className={styles.albumBook}>
      <header className={styles.albumBookHeader}>
        <div><span className={styles.eyebrow}>Official Theme Album</span><h2>{theme.name}</h2><p>{theme.presentation.texture} · {theme.presentation.motif} · {theme.presentation.plaque}</p></div>
        <div className={styles.albumBookProgress}><b>{theme.overallPercent}%</b><span>{theme.overallFilled}/{theme.overallTotal} slots</span></div>
      </header>
      {safePage === 0 ? <CollectorPyramid theme={theme}/> : <div className={styles.albumEntryGrid}>
        {cards.map(card => <article key={card.id} className={styles.albumEntry} aria-label={`${card.name}, ${rarityLabel(card)}`}>
          <div className={styles.rarityLine} aria-label={`Rarity ${card.rarity}, ${card.rarityStars} of 5 stars`}><span aria-hidden="true">{'★'.repeat(card.rarityStars)}{'☆'.repeat(5 - card.rarityStars)}</span><b>{card.rarity}</b></div>
          <div className={styles.slotPair}>
            <AlbumSlot card={card} variant="normal" justStuck={justStuck === `${card.id}:normal`} onStick={onStick}/>
            <AlbumSlot card={card} variant="foil" justStuck={justStuck === `${card.id}:foil`} onStick={onStick}/>
          </div>
          <h3 className={styles.titlePlaque}>{card.name}</h3>
        </article>)}
      </div>}
    </CardPanel>
    <nav className={styles.albumPager} aria-label="Album page navigation">
      <button type="button" onClick={() => onPage(safePage - 1)} disabled={safePage === 0}>Previous page</button>
      <span>{safePage === 0 ? 'Collector Card page' : `Cards ${cards[0]?.number ?? 1}-${cards.at(-1)?.number ?? cards[0]?.number ?? 1}`}</span>
      <button type="button" onClick={() => onPage(safePage + 1)} disabled={safePage >= maxPage}>Next page</button>
    </nav>
  </section>
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
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [albumPages, setAlbumPages] = useState({})
  const [pendingStick, setPendingStick] = useState(null)
  const [sticking, setSticking] = useState(false)
  const [stickNotice, setStickNotice] = useState('')
  const [justStuck, setJustStuck] = useState('')
  const [personalAlbumName, setPersonalAlbumName] = useState('')
  const [personalAlbumStatus, setPersonalAlbumStatus] = useState('')
  const [selectedPersonalAlbumId, setSelectedPersonalAlbumId] = useState(null)
  const [opening, setOpening] = useState(false)
  const [notice, setNotice] = useState('')
  const [recyclerSelection, setRecyclerSelection] = useState({})
  const [recyclerRecipeId, setRecyclerRecipeId] = useState('')
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
  const recyclerRecipes = state?.recyclerRecipes ?? []
  const recyclerRecipe = recyclerRecipes.find(recipe => recipe.recipeId === recyclerRecipeId) ?? recyclerRecipes[0] ?? null
  const recycler = useMemo(() => buildRecyclerModel(collection.cards, recyclerRecipe, recyclerSelection), [collection.cards, recyclerRecipe, recyclerSelection])
  const selectedTheme = collection.officialThemeAlbums.find(theme => theme.id === selectedThemeId) ?? null
  const selectedAlbumPage = selectedTheme ? (albumPages[selectedTheme.id] ?? 0) : 0
  const selectedPersonalAlbum = collection.personalAlbums.albums?.find(album => album.album_id === selectedPersonalAlbumId) ?? null
  const selectedPersonalAlbumCards = selectedPersonalAlbum ? (collection.personalAlbums.cards ?? []).filter(row => row.album_id === selectedPersonalAlbum.album_id) : []

  const selectView = next => {
    setView(next)
    if (next !== 'albums') setSelectedThemeId(null)
    setVisibleCount(PAGE_SIZE)
    if (next === 'favourites') setOwnership('all')
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openThemeAlbum = id => {
    setSelectedThemeId(id)
    setView('albums')
    setStickNotice('')
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const setThemePage = (themeId, page) => setAlbumPages(current => ({ ...current, [themeId]: Math.max(0, page) }))
  const toggleFavourite = id => {
    setFavourites(current => {
      const next = current.includes(id) ? current.filter(entry => entry !== id) : [...current, id]
      writeCollectionFavourites(storage, state?.profile?.player_id ?? 'guest', next)
      return next
    })
  }
  const changeFilter = (setter, value) => { setter(value); setVisibleCount(PAGE_SIZE) }
  const resetFilters = () => { setQuery(''); setSetId('all'); setOwnership('all'); setRarity('all'); setVariant('all'); setSort('set'); setVisibleCount(PAGE_SIZE) }

  const requestStick = card => {
    setStickNotice('')
    setPendingStick({ card, transactionId: `album-stick:${crypto.randomUUID()}` })
  }

  const stickInAlbum = async () => {
    if (!pendingStick) return
    setSticking(true)
    setStickNotice('')
    try {
      const result = await actionRunner({ action: 'stick-in-album', transactionId: pendingStick.transactionId, itemId: pendingStick.card.id, variant: 'normal' })
      setJustStuck(`${result.itemId}:normal`)
      setPendingStick(null)
      applyPayload(await dataLoader())
      setStickNotice(`${pendingStick.card.name} was permanently stuck into its Official Theme Album.${result.collectorCardsAwarded?.length ? ` Collector awarded: ${result.collectorCardsAwarded.join(', ')}.` : ''}`)
      setTimeout(() => setJustStuck(''), 450)
    } catch (stickError) {
      setStickNotice(`${stickError.message}. You can retry safely; the same transaction ID will be used.`)
    } finally { setSticking(false) }
  }

  const createPersonalAlbum = async event => {
    event.preventDefault()
    setPersonalAlbumStatus('')
    try {
      const transactionId = `personal-album:${crypto.randomUUID()}`
      const result = await actionRunner({ action: 'create-personal-album', transactionId, name: personalAlbumName })
      setPersonalAlbumName('')
      setSelectedPersonalAlbumId(result.albumId)
      applyPayload(await dataLoader())
      setPersonalAlbumStatus(`Created ${result.name} for ${result.costCoins} Coins.`)
    } catch (createError) { setPersonalAlbumStatus(createError.message) }
  }

  const personalAlbumHasCard = (albumId, itemId) => (collection.personalAlbums.cards ?? []).some(row => row.album_id === albumId && row.item_id === itemId && (row.variant ?? 'normal') === 'normal')

  const addPersonalAlbumCard = async itemId => {
    if (!selectedPersonalAlbum) return
    setPersonalAlbumStatus('')
    try {
      await actionRunner({ action: 'add-personal-album-card', albumId: selectedPersonalAlbum.album_id, itemId, variant: 'normal' })
      applyPayload(await dataLoader())
      setPersonalAlbumStatus('Card added. Inventory quantity is unchanged.')
    } catch (addError) { setPersonalAlbumStatus(addError.message) }
  }

  const removePersonalAlbumCard = async itemId => {
    if (!selectedPersonalAlbum) return
    setPersonalAlbumStatus('')
    try {
      await actionRunner({ action: 'remove-personal-album-card', albumId: selectedPersonalAlbum.album_id, itemId, variant: 'normal' })
      applyPayload(await dataLoader())
      setPersonalAlbumStatus('Card removed from this Personal Album. Inventory quantity is unchanged.')
    } catch (removeError) { setPersonalAlbumStatus(removeError.message) }
  }

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
      const available = card.shreddableQuantity ?? card.recyclableQuantity
      const quantity = Math.max(0, Math.min(available, (Number(current[card.id]) || 0) + change))
      if (!quantity) {
        const next = { ...current }
        delete next[card.id]
        return next
      }
      return { ...current, [card.id]: quantity }
    })
  }

  const changeRecyclerRecipe = event => {
    setRecyclerRecipeId(event.target.value)
    setRecyclerSelection({})
    setRecyclerNotice('')
    pendingRecycle.current = null
  }

  const recycleCards = async () => {
    if (!recycler.complete || !recyclerRecipe) return
    const items = recycler.selectedItems.map(entry => ({ itemId: entry.card.id, quantity: entry.quantity }))
    const payloadKey = JSON.stringify({ recipeId: recyclerRecipe.recipeId, items })
    if (!pendingRecycle.current || pendingRecycle.current.payloadKey !== payloadKey) pendingRecycle.current = {
      payloadKey,
      transactionId: `shred:${crypto.randomUUID()}`,
    }
    setRecycling(true)
    setRecyclerNotice('')
    try {
      const result = await actionRunner({ action: 'shred-cards', transactionId: pendingRecycle.current.transactionId, recipeId: recyclerRecipe.recipeId, items })
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
          <div className={styles.heroCopy}><span className={styles.eyebrow}>Official Album completion</span><strong>{stats.completion}%</strong><p>{stats.baseOwned} of {stats.totalBase} Normal cards stuck into Official Theme Albums.</p></div>
          <ProgressBar value={stats.baseOwned} max={stats.totalBase} label={`Official Albums: ${stats.baseOwned} of ${stats.totalBase}`} tone="foil"/>
          <div className={styles.heroStats}><span><b>{stats.completedSets}</b> Complete albums</span><span><b>{collection.inventoryCapacity.remainingCardSlots ?? '—'}</b> Free slots</span><span><b>{stats.duplicates}</b> Duplicates</span></div>
        </CardPanel>

        {view === 'albums' && <section className={styles.albumView} aria-labelledby="albums-title">
          {stickNotice && <p className={styles.notice} role="status">{stickNotice}</p>}
          {selectedTheme ? <ThemeAlbumPage
            theme={selectedTheme}
            page={selectedAlbumPage}
            onPage={page => setThemePage(selectedTheme.id, page)}
            onBack={() => setSelectedThemeId(null)}
            onStick={requestStick}
            justStuck={justStuck}
          /> : <>
            {collection.recent.length > 0 && <div className={styles.recentSection}>
              <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Inventory finds</span><h2>Ready to stick</h2></div><button type="button" onClick={() => { setOwnership('owned'); selectView('cards') }}>See Inventory</button></div>
              <div className={styles.recentRail}>{collection.recent.slice(0, 8).map(card => <button key={card.id} type="button" onClick={() => openThemeAlbum(card.setId)} aria-label={`Open ${card.setName} album for ${card.name}`}><img src={card.asset} alt="" loading="lazy"/><span>{card.name}</span></button>)}</div>
            </div>}
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Permanent sticker albums</span><h2 id="albums-title">Official Theme Albums</h2></div><span>{collection.officialThemeAlbums.length} themes</span></div>
            <div className={styles.themeAlbumGrid}>{collection.officialThemeAlbums.map(theme => <ThemeAlbumCover key={theme.id} theme={theme} onOpen={openThemeAlbum}/>)}</div>
            <CardPanel className={styles.personalAlbumsPanel}>
              <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Organisational only</span><h2>Personal Albums</h2></div><span>{collection.personalAlbums.albums?.length ?? 0} / {collection.personalAlbums.limit ?? 10}</span></div>
              <p>Personal Albums are flexible folders. Cards can be added and removed freely and Inventory quantity does not change.</p>
              <form className={styles.personalCreateForm} onSubmit={createPersonalAlbum}>
                <label><span className={styles.srOnly}>New Personal Album name</span><input value={personalAlbumName} onChange={event => setPersonalAlbumName(event.target.value)} placeholder="Black Cats" minLength={3} maxLength={32}/></label>
                <button type="submit" disabled={!personalAlbumName.trim()}>Create for {collection.personalAlbums.createCostCoins ?? 500} Coins</button>
              </form>
              {personalAlbumStatus && <p className={styles.notice} role="status">{personalAlbumStatus}</p>}
              <div className={styles.personalAlbumList}>
                {(collection.personalAlbums.albums ?? []).map(album => <button key={album.album_id} type="button" onClick={() => setSelectedPersonalAlbumId(album.album_id)} aria-current={selectedPersonalAlbumId === album.album_id ? 'page' : undefined}>{album.name}</button>)}
              </div>
              {selectedPersonalAlbum && <div className={styles.personalAlbumDetail}>
                <h3>{selectedPersonalAlbum.name}</h3>
                <p>{selectedPersonalAlbumCards.length} cards in this Personal Album.</p>
                <div className={styles.personalCardRows}>
                  {selectedPersonalAlbumCards.map(row => {
                    const card = collection.cards.find(candidate => candidate.id === row.item_id)
                    if (!card) return null
                    return <div key={`${row.album_id}:${row.item_id}`}><span>{card.name}</span><button type="button" onClick={() => removePersonalAlbumCard(card.id)}>Remove</button></div>
                  })}
                  {collection.cards.filter(card => card.inventoryQuantity > 0 && card.variant === 'base' && !personalAlbumHasCard(selectedPersonalAlbum.album_id, card.id)).slice(0, 8).map(card => <div key={card.id}><span>{card.name}</span><button type="button" onClick={() => addPersonalAlbumCard(card.id)}>Add</button></div>)}
                </div>
              </div>}
            </CardPanel>
          </>}
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
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Turn spare cards into Coins</span><h2 id="recycler-title">Card Shredder</h2></div><Badge tone="ready">Unbound only</Badge></div>
          {!recyclerRecipe ? <CardPanel><EmptyState icon="recycle" title="Shredder recipe unavailable" detail="The server has not supplied an active Shredder recipe, so no cards can be destroyed." /></CardPanel> : <>
            <CardPanel variant="elevated" className={`${styles.recyclerMachine} ${recycling ? styles.recyclerRunning : ''}`} aria-busy={recycling || undefined}>
              <div className={styles.machineHeader}><span className={styles.machineIcon}><Icon name="recycle" size={34}/></span><div><span className={styles.eyebrow}>Recipe {recyclerRecipe.configVersion}</span><h3>{recyclerRecipe.batchSize} unbound {recyclerRecipe.selectionType === 'foil-card-any' ? 'Foil' : 'normal'} {recyclerRecipe.batchSize === 1 ? 'card' : 'cards'}</h3><p>Every batch returns {formatRecyclerReward(recyclerRecipe.reward)}. Bound Theme Album cards and Collector Cards are protected.</p></div></div>
              {recyclerRecipes.length > 1 && <label className={styles.recipePicker}>Shredder recipe
                <select value={recyclerRecipe.recipeId} onChange={changeRecyclerRecipe} disabled={recycling}>
                  {recyclerRecipes.map(recipe => <option key={recipe.recipeId} value={recipe.recipeId}>{recipe.batchSize} {recipe.selectionType === 'foil-card-any' ? 'Foil' : 'normal'} {recipe.batchSize === 1 ? 'card' : 'cards'} → {formatRecyclerReward(recipe.reward)}</option>)}
                </select>
              </label>}
              <div className={styles.machineWindow} aria-hidden="true"><span className={styles.gearLarge}><Icon name="recycle" size={58}/></span><span className={styles.gearSmall}><Icon name="recycle" size={35}/></span><span className={styles.machineSteam}/><span className={styles.machineTray}><Icon name={recyclerRecipe.reward.currencyId === 'stars' ? 'star' : recyclerRecipe.reward.currencyId === 'coins' ? 'coin' : 'rewards'} size={26}/></span></div>
              <div className={styles.recyclerMeter}>
                <div><span>Loaded</span><strong>{recycler.cardsSelected} / {recycler.targetCards}</strong></div>
                <ProgressBar value={recycler.cardsSelected} max={recycler.targetCards} label={`${recycler.cardsSelected} cards loaded`} tone="purple"/>
                <p>{recycler.complete ? `${recycler.batches} complete ${recycler.batches === 1 ? 'batch' : 'batches'} · ${formatRecyclerReward(recycler.reward)} guaranteed` : `Select ${recycler.cardsNeeded} more unbound ${recycler.cardsNeeded === 1 ? 'card' : 'cards'} for a complete batch.`}</p>
              </div>
              <button type="button" className={styles.recycleButton} disabled={!recycler.complete || recycling} onClick={recycleCards}><Icon name="recycle"/>{recycling ? 'Shredding securely…' : recyclerNotice ? 'Retry secure shredding' : `Shred ${recycler.cardsSelected || recycler.batchSize} cards`}</button>
              {recyclerNotice && <p className={styles.recyclerError} role="alert">{recyclerNotice}</p>}
            </CardPanel>

            <div className={styles.recyclerRules}><Icon name="info" size={20}/><p>Only unbound Inventory cards are selectable. Shredding is permanent and server-authoritative. Cards stuck in Theme Albums, Collector Cards and cards listed on the Exchange cannot be selected here.</p></div>

            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Available to shred</span><h3>Choose cards</h3></div><span>{recycler.eligibleCards.reduce((sum, card) => sum + (card.shreddableQuantity ?? card.recyclableQuantity), 0)} available</span></div>
            {!recycler.eligibleCards.length ? <CardPanel><EmptyState icon="cards" title="No eligible cards" detail="Collect unbound normal cards or Foils to feed the Shredder." /></CardPanel> : <div className={styles.recyclerGrid}>{recycler.eligibleCards.map(card => {
              const selected = Number(recyclerSelection[card.id]) || 0
              const available = card.shreddableQuantity ?? card.recyclableQuantity
              return <CardPanel as="article" className={`${styles.recyclerCard} ${selected ? styles.recyclerCardSelected : ''}`} key={card.id}>
                <img src={card.asset} alt="" loading="lazy"/>
                <div><strong>{card.name}</strong><span>{card.quantity} owned · {available} unbound</span></div>
                <div className={styles.quantityPicker} aria-label={`${card.name} selected quantity`}>
                  <button type="button" onClick={() => changeRecycleQuantity(card, -1)} disabled={!selected} aria-label={`Remove one ${card.name}`}><Icon name="minus" size={18}/></button>
                  <output aria-live="polite">{selected}</output>
                  <button type="button" onClick={() => changeRecycleQuantity(card, 1)} disabled={selected >= available} aria-label={`Add one ${card.name}`}><Icon name="plus" size={18}/></button>
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

    <Modal
      open={Boolean(pendingStick)}
      title="Stick in Album"
      onDismiss={() => { if (!sticking) setPendingStick(null) }}
      actions={<>
        <button type="button" className={styles.resetButton} disabled={sticking} onClick={() => setPendingStick(null)}>Leave in Inventory</button>
        <button type="button" className={styles.primary} disabled={sticking} onClick={stickInAlbum}>{sticking ? 'Sticking…' : 'Stick in Album'}</button>
      </>}
    >
      {pendingStick && <div className={styles.stickConfirm}>
        <img src={pendingStick.card.asset} alt="" loading="lazy"/>
        <div>
          <p><strong>{pendingStick.card.name}</strong> will be permanently stuck into the Official Theme Album.</p>
          <ul>
            <li>It cannot later be removed.</li>
            <li>It cannot be traded.</li>
            <li>It cannot be shredded.</li>
            <li>It will no longer count towards Inventory capacity.</li>
          </ul>
          {stickNotice && <p role="alert" className={styles.recyclerError}>{stickNotice}</p>}
        </div>
      </div>}
    </Modal>

    <Modal open={Boolean(recyclerReceipt)} title="Shredding complete" tone="reward" onDismiss={() => setRecyclerReceipt(null)} actions={<button type="button" className={styles.primary} onClick={() => setRecyclerReceipt(null)}>Collect reward</button>}>
      {recyclerReceipt && <div className={styles.recyclerResult}>
        <div className={styles.resultMachine} aria-hidden="true"><Icon name="recycle" size={46}/><span/><Icon name={recyclerReceipt.reward.currencyId === 'stars' ? 'star' : recyclerReceipt.reward.currencyId === 'coins' ? 'coin' : 'rewards'} size={52}/></div>
        <strong>+{formatRecyclerReward(recyclerReceipt.reward)}</strong>
        <p>{recyclerReceipt.cardsConsumed} cards were permanently shredded in one secure transaction.</p>
        <small>Receipt: {recyclerReceipt.transactionId}{recyclerReceipt.duplicate ? ' · Safe retry confirmed' : ''}</small>
      </div>}
    </Modal>
  </main>
}

