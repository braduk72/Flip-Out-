import crypto from 'node:crypto'
import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { applyReward } from './_gameServices.js'
import { recordAuthorizedCoinGrant } from './_coinLedger.js'
import { createListing, expireMarketListings } from './_operations.js'
import { getPlayerState } from './_playerState.js'
import { ACHIEVEMENT_DEFINITIONS, resetAchievements, unlockAchievement } from './_achievements.js'
import { claimRewardTheatre, getPendingRewardTheatre } from './_rewardTheatre.js'
import { ITEM_BY_ID, ITEM_CATALOG } from '../src/data/itemCatalog.js'
import { DECKS } from '../src/data/decks.js'
import { MATCH3_LEVELS } from '../src/match3/levels.js'

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i
const MAX_GRANT_QUANTITY = 500
const MARKET_SEED_EMAIL = 'dev-market-maker@flipout.preview.invalid'
const MARKET_SEED_ID = 'initial-v1'

function fail(message, status = 400, code = 'DEV_TOOLKIT_INVALID') {
  throw Object.assign(new Error(message), { status, code })
}

function safeId(value, label) {
  const id = String(value ?? '')
  if (!SAFE_ID.test(id)) fail(`Invalid ${label}`)
  return id
}

function positiveAmount(value, label, max = MAX_GRANT_QUANTITY) {
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > max) fail(`${label} must be a whole number from 1 to ${max}`)
  return amount
}

export function isDevToolkitAvailable(env = process.env) {
  return env.VERCEL_ENV === 'preview'
}

export function verifyDevToolkitAccess(req, env = process.env) {
  if (!isDevToolkitAvailable(env)) fail('Developer toolkit is available in Preview only', 404, 'DEV_TOOLKIT_PREVIEW_ONLY')
  const configured = String(env.DEV_TOOLKIT_SECRET ?? '')
  if (configured.length < 16) fail('Developer toolkit secret is not configured', 503, 'DEV_TOOLKIT_SECRET_MISSING')
  const supplied = String(req.headers?.['x-flipout-dev-secret'] ?? req.headers?.['X-Flipout-Dev-Secret'] ?? '')
  const expected = Buffer.from(configured)
  const actual = Buffer.from(supplied)
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) fail('Developer access denied', 403, 'DEV_TOOLKIT_FORBIDDEN')
  return true
}

function cardItemsForTheme(themeId) {
  return ITEM_CATALOG.filter(item => item.type === 'card' && item.deckId === `deck:${themeId}`)
}

function toolkitCatalogue() {
  return {
    themes: DECKS.map(deck => ({
      id: deck.id,
      name: deck.name,
      cardCount: cardItemsForTheme(deck.id).length,
      coverAsset: deck.backFile ? `${deck.path}/${deck.backFile}` : '/images/back.webp',
    })),
    grantableItems: ITEM_CATALOG
      .filter(item => ['card', 'card_variant', 'powerup', 'lockbox', 'key', 'unlock', 'booster'].includes(item.type))
      .map(item => ({ id: item.id, name: item.name, type: item.type, rarity: item.rarity, asset: item.asset })),
    unsupported: {
      foilCards: 'Prepared only: no authoritative Foil item definitions exist yet.',
      boosters: 'Booster inventory items can now be granted as stackable Preview rewards; secure purchase/opening is still postponed.',
    },
    achievements: ACHIEVEMENT_DEFINITIONS,
  }
}

async function devSnapshot(db, playerId) {
  const [coinLedger, exchange, match3, flags, adverts, rewardTheatre] = await Promise.all([
    db.query(`SELECT transaction_id,amount,transaction_type,source_reference_id,ledger_sequence,created_at FROM fo_coin_ledger WHERE account_id=$1 ORDER BY ledger_sequence DESC LIMIT 50`, [playerId]).catch(() => ({ rows: [] })),
    db.query(`SELECT listing_id,seller_id,buyer_id,item_id,quantity,price_coins,status,expires_at,created_at,completed_at FROM fo_market_listings WHERE seller_id=$1 OR buyer_id=$1 ORDER BY created_at DESC LIMIT 50`, [playerId]).catch(() => ({ rows: [] })),
    db.query(`SELECT highest_unlocked_level,completed_levels,updated_at FROM fo_match3_progress WHERE player_id=$1`, [playerId]).catch(() => ({ rows: [] })),
    db.query(`SELECT flag_key,flag_value,updated_at FROM fo_player_flags WHERE player_id=$1 ORDER BY flag_key`, [playerId]).catch(() => ({ rows: [] })),
    db.query(`SELECT completion_id,placement,match_id,created_at FROM fo_advert_completions WHERE player_id=$1 ORDER BY created_at DESC LIMIT 25`, [playerId]).catch(() => ({ rows: [] })),
    getPendingRewardTheatre(db, { playerId }).catch(error => ({ available: false, error: error.message })),
  ])
  return { coinLedger: coinLedger.rows, exchange: exchange.rows, match3: match3.rows[0] ?? null, featureFlags: flags.rows, advertCompletions: adverts.rows, rewardTheatre }
}

export function initialMarketSeedItems(limit = 15) {
  return DECKS
    .map((deck, index) => {
      const card = cardItemsForTheme(deck.id)[0]
      return card ? { itemId: card.id, themeId: deck.id, priceCoins: 25 + (index * 5) } : null
    })
    .filter(Boolean)
    .slice(0, limit)
}

async function grantItem(db, { playerId, itemId, quantity, transactionId }) {
  const item = ITEM_BY_ID.get(safeId(itemId, 'item id'))
  if (!item) fail('Item is not in the catalogue', 404, 'DEV_TOOLKIT_ITEM_NOT_FOUND')
  const amount = positiveAmount(quantity ?? 1, 'Quantity')
  const id = safeId(transactionId ?? `dev-toolkit:item:${crypto.randomUUID()}`, 'transaction id')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await applyReward(client, {
      playerId,
      transactionId: id,
      source: 'dev-toolkit',
      reward: { itemId: item.id, amount },
      metadata: { reason: 'Preview developer toolkit', itemType: item.type },
    })
    await client.query('COMMIT')
    return { ...result, itemId: item.id, quantity: amount }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function grantCoins(db, { playerId, amount, transactionId, referenceId }) {
  const coins = positiveAmount(amount, 'Coins', 100000)
  const id = safeId(transactionId ?? `dev-toolkit:coins:${crypto.randomUUID()}`, 'transaction id')
  const ref = safeId(referenceId ?? id, 'reference id')
  return recordAuthorizedCoinGrant(db, {
    accountId: playerId,
    amount: coins,
    transactionId: id,
    transactionType: 'promotional-grant',
    sourceReferenceId: ref,
    metadata: { reason: 'Preview developer toolkit' },
  })
}

async function grantThemeInventory(db, { playerId, themeId, transactionId }) {
  const theme = DECKS.find(deck => deck.id === safeId(themeId, 'theme id'))
  if (!theme) fail('Theme is not in the catalogue', 404, 'DEV_TOOLKIT_THEME_NOT_FOUND')
  const cards = cardItemsForTheme(theme.id)
  if (!cards.length) fail('Theme has no grantable cards', 409, 'DEV_TOOLKIT_THEME_EMPTY')
  const id = safeId(transactionId ?? `dev-toolkit:theme:${theme.id}:${crypto.randomUUID()}`, 'transaction id')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const grants = []
    for (const card of cards) {
      grants.push(await applyReward(client, {
        playerId,
        transactionId: `${id}:${card.id.replaceAll(':', '-')}`,
        source: 'dev-toolkit',
        reward: { itemId: card.id, amount: 1 },
        metadata: { reason: 'Preview complete Theme inventory grant', sourceReferenceId: id, themeId: theme.id },
      }))
    }
    await client.query('COMMIT')
    return { transactionId: id, themeId: theme.id, cardsGranted: grants.filter(row => row.applied).length, duplicates: grants.filter(row => row.duplicate).length }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function grantCompleteCollection(db, { playerId, transactionId }) {
  const id = safeId(transactionId ?? `dev-toolkit:collection:${crypto.randomUUID()}`, 'transaction id')
  const results = []
  for (const theme of DECKS) results.push(await grantThemeInventory(db, { playerId, themeId: theme.id, transactionId: `${id}:${theme.id}` }))
  return { transactionId: id, themesGranted: results.length, cardsGranted: results.reduce((sum, row) => sum + row.cardsGranted, 0), duplicates: results.reduce((sum, row) => sum + row.duplicates, 0) }
}

async function grantPowerUps(db, { playerId, quantity = 5, transactionId }) {
  const amount = positiveAmount(quantity, 'Power-up quantity', 100)
  const id = safeId(transactionId ?? `dev-toolkit:powerups:${crypto.randomUUID()}`, 'transaction id')
  const powerUps = ITEM_CATALOG.filter(item => item.type === 'powerup')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const grants = []
    for (const item of powerUps) grants.push(await applyReward(client, { playerId, transactionId: `${id}:${item.id.replaceAll(':', '-')}`, source: 'dev-toolkit', reward: { itemId: item.id, amount }, metadata: { reason: 'Preview power-up grant', sourceReferenceId: id } }))
    await client.query('COMMIT')
    return { transactionId: id, powerUpsGranted: grants.filter(row => row.applied).length, quantityEach: amount }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

async function grantCollectorCards(db, { playerId, themeId = 'all', tier = 'all' }) {
  const themes = themeId === 'all' ? DECKS : [DECKS.find(deck => deck.id === safeId(themeId, 'theme id'))].filter(Boolean)
  if (!themes.length) fail('Theme is not in the catalogue', 404, 'DEV_TOOLKIT_THEME_NOT_FOUND')
  const tiers = tier === 'all' ? ['bronze', 'silver', 'gold'] : [safeId(tier, 'collector tier')]
  if (tiers.some(value => !['bronze', 'silver', 'gold'].includes(value))) fail('Invalid collector tier')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const inserted = []
    for (const theme of themes) for (const selectedTier of tiers) {
      const tx = `dev-collector:${theme.id}:${selectedTier}:${crypto.randomUUID()}`
      const result = await client.query(
        `INSERT INTO fo_theme_album_collectors(player_id,theme_id,collector_tier,awarded_by_transaction_id)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(player_id,theme_id,collector_tier) DO NOTHING
         RETURNING theme_id,collector_tier`,
        [playerId, theme.id, selectedTier, tx]
      )
      if (result.rowCount) inserted.push(result.rows[0])
    }
    await client.query('COMMIT')
    return { collectorCardsGranted: inserted.length, duplicates: (themes.length * tiers.length) - inserted.length, collectors: inserted }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

async function markLevelComplete(db, { playerId, levelId }) {
  const level = MATCH3_LEVELS.find(candidate => candidate.id === Number(levelId))
  if (!level) fail('Unknown Match-3 level', 404, 'DEV_TOOLKIT_LEVEL_NOT_FOUND')
  const completed = Object.fromEntries(Array.from({ length: level.id }, (_, index) => [String(index + 1), { coins: 10, score: 0, devCompleted: true }]))
  await db.query(
    `INSERT INTO fo_match3_progress(player_id,highest_unlocked_level,completed_levels)
     VALUES($1,$2,$3)
     ON CONFLICT(player_id) DO UPDATE SET highest_unlocked_level=GREATEST(fo_match3_progress.highest_unlocked_level,$2),completed_levels=fo_match3_progress.completed_levels||$3,updated_at=NOW()`,
    [playerId, Math.min(20, level.id + 1), completed]
  )
  return { levelId: level.id, highestUnlockedLevel: Math.min(20, level.id + 1) }
}

async function unlockAllMatch3(db, { playerId }) {
  await db.query(`INSERT INTO fo_match3_progress(player_id,highest_unlocked_level) VALUES($1,20) ON CONFLICT(player_id) DO UPDATE SET highest_unlocked_level=20,updated_at=NOW()`, [playerId])
  return { highestUnlockedLevel: 20 }
}

async function disableThemeAlbumTriggers(client) {
  await client.query(`ALTER TABLE fo_theme_album_entries DISABLE TRIGGER USER`).catch(() => {})
  await client.query(`ALTER TABLE fo_theme_album_collectors DISABLE TRIGGER USER`).catch(() => {})
}

async function enableThemeAlbumTriggers(client) {
  await client.query(`ALTER TABLE fo_theme_album_entries ENABLE TRIGGER USER`).catch(() => {})
  await client.query(`ALTER TABLE fo_theme_album_collectors ENABLE TRIGGER USER`).catch(() => {})
}

async function clearExchangeListings(db, { playerId, includeSeed = false }) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const seedId = includeSeed ? await ensureMarketMaker(client) : null
    const ids = [playerId, seedId].filter(Boolean)
    const listings = await client.query(`SELECT listing_id,seller_id,item_id,quantity,status FROM fo_market_listings WHERE seller_id=ANY($1::uuid[]) FOR UPDATE`, [ids])
    let returned = 0
    for (const row of listings.rows) if (row.status === 'active') {
      await applyReward(client, { playerId: row.seller_id, transactionId: `dev-market-clear:${row.listing_id}`, source: 'market-return', reward: { itemId: row.item_id, amount: Number(row.quantity) }, skipCapacityCheck: true, metadata: { reason: 'Preview developer toolkit clear' } })
      returned += 1
    }
    await client.query(`DELETE FROM fo_market_listings WHERE seller_id=ANY($1::uuid[]) OR buyer_id=ANY($1::uuid[])`, [ids])
    await client.query('COMMIT')
    return { cleared: listings.rowCount, returned }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

async function resetPlayerScope(db, { playerId, scope, themeId }) {
  const selected = safeId(scope, 'reset scope')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (selected === 'inventory') {
      await client.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId])
    } else if (selected === 'theme-albums') {
      await disableThemeAlbumTriggers(client)
      await client.query(`DELETE FROM fo_theme_album_transactions WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_theme_album_collectors WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_theme_album_entries WHERE player_id=$1`, [playerId])
      await enableThemeAlbumTriggers(client)
    } else if (selected === 'theme-album') {
      const id = safeId(themeId, 'theme id')
      await disableThemeAlbumTriggers(client)
      await client.query(`DELETE FROM fo_theme_album_transactions WHERE player_id=$1 AND result->>'themeId'=$2`, [playerId, id]).catch(() => {})
      await client.query(`DELETE FROM fo_theme_album_collectors WHERE player_id=$1 AND theme_id=$2`, [playerId, id])
      await client.query(`DELETE FROM fo_theme_album_entries WHERE player_id=$1 AND theme_id=$2`, [playerId, id])
      await enableThemeAlbumTriggers(client)
    } else if (selected === 'personal-albums') {
      await client.query(`DELETE FROM fo_personal_album_transactions WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_personal_album_cards WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_personal_albums WHERE player_id=$1`, [playerId])
    } else if (selected === 'match3-progress') {
      await client.query(`DELETE FROM fo_match3_actions WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_match3_sessions WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_match3_progress WHERE player_id=$1`, [playerId])
    } else if (selected === 'exchange') {
      await client.query(`DELETE FROM fo_market_listings WHERE seller_id=$1 OR buyer_id=$1`, [playerId])
    } else {
      fail('Unsupported reset scope', 400, 'DEV_TOOLKIT_RESET_UNSUPPORTED')
    }
    await client.query('COMMIT')
    return { reset: selected }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function ensureMarketMaker(client) {
  const result = await client.query(
    `INSERT INTO fo_accounts(email,password_hash,account_kind)
     VALUES($1,'!dev-toolkit','protected')
     ON CONFLICT(email) DO UPDATE SET account_kind='protected', updated_at=NOW()
     RETURNING player_id`,
    [MARKET_SEED_EMAIL]
  )
  return result.rows[0].player_id
}

async function seedInitialMarket(db) {
  const client = await db.connect()
  let sellerId
  try {
    await client.query('BEGIN')
    sellerId = await ensureMarketMaker(client)
    const active = await client.query(`SELECT COUNT(*)::int AS count FROM fo_market_listings WHERE seller_id=$1 AND status='active' AND (expires_at IS NULL OR expires_at>NOW())`, [sellerId])
    await client.query('COMMIT')
    if (Number(active.rows[0].count) > 0) return { duplicate: true, sellerId, listingsCreated: 0, reason: 'seed-market-already-active' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  const seedItems = initialMarketSeedItems()
  const created = []
  for (const item of seedItems) {
    const transactionId = `dev-market-seed:${MARKET_SEED_ID}:${item.itemId.replaceAll(':', '-')}`
    const before = await db.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id=$2`, [sellerId, item.itemId])
    if (Number(before.rows[0]?.quantity ?? 0) < 1) {
      await grantItem(db, { playerId: sellerId, itemId: item.itemId, quantity: 1, transactionId })
    }
    const available = await db.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id=$2`, [sellerId, item.itemId])
    if (Number(available.rows[0]?.quantity ?? 0) >= 1) {
      created.push(await createListing(db, { playerId: sellerId, itemId: item.itemId, quantity: 1, priceCoins: item.priceCoins }))
    }
  }
  if (!created.length) return { duplicate: true, sellerId, listingsCreated: 0, reason: 'seed-market-already-consumed' }
  return { duplicate: false, sellerId, listingsCreated: created.length, seedId: MARKET_SEED_ID, listings: created }
}

export async function runDevToolkitAction(db, { playerId, body = {} }) {
  if (body.action === 'grant-item') return grantItem(db, { playerId, ...body })
  if (body.action === 'grant-coins') return grantCoins(db, { playerId, ...body })
  if (body.action === 'grant-complete-theme') return grantThemeInventory(db, { playerId, ...body })
  if (body.action === 'grant-complete-collection') return grantCompleteCollection(db, { playerId, ...body })
  if (body.action === 'grant-power-ups') return grantPowerUps(db, { playerId, ...body })
  if (body.action === 'grant-collector-cards') return grantCollectorCards(db, { playerId, ...body })
  if (body.action === 'match3-unlock-all') return unlockAllMatch3(db, { playerId })
  if (body.action === 'match3-mark-complete') return markLevelComplete(db, { playerId, ...body })
  if (body.action === 'match3-reward-theatre') return claimRewardTheatre(db, { playerId, milestone: body.milestone })
  if (body.action === 'exchange-expire') return expireMarketListings(db, { sellerId: playerId })
  if (body.action === 'exchange-clear') return clearExchangeListings(db, { playerId, includeSeed: Boolean(body.includeSeed) })
  if (body.action === 'achievement-unlock') return unlockAchievement(db, { playerId, achievementId: body.achievementId, transactionId: body.transactionId ?? `dev-achievement:${body.achievementId}:${crypto.randomUUID()}`, trigger: 'dev-toolkit', metadata: { reason: 'Preview developer toolkit' } })
  if (body.action === 'achievement-reset') return resetAchievements(db, { playerId, achievementId: body.achievementId === 'all' ? null : body.achievementId })
  if (body.action === 'seed-initial-market') return seedInitialMarket(db)
  if (body.action === 'reset') return resetPlayerScope(db, { playerId, scope: body.scope, themeId: body.themeId })
  fail('Invalid developer toolkit action')
}

export default async function handler(req, res) {
  const db = getDb()
  try {
    verifyDevToolkitAccess(req)
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') return res.json({ state: await getPlayerState(db, player.player_id), dev: await devSnapshot(db, player.player_id), catalogue: toolkitCatalogue() })
    if (req.method !== 'POST') return res.status(405).end()
    const result = await runDevToolkitAction(db, { playerId: player.player_id, body: req.body ?? {} })
    return res.json({ result, state: await getPlayerState(db, player.player_id), dev: await devSnapshot(db, player.player_id), catalogue: toolkitCatalogue() })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message, code: error.code })
  }
}
