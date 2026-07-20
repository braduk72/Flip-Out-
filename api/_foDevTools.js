import crypto from 'node:crypto'
import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { applyReward } from './_gameServices.js'
import { recordAuthorizedCoinGrant } from './_coinLedger.js'
import { createListing } from './_operations.js'
import { getPlayerState } from './_playerState.js'
import { ITEM_BY_ID, ITEM_CATALOG } from '../src/data/itemCatalog.js'
import { DECKS } from '../src/data/decks.js'

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
      .filter(item => ['card', 'card_variant', 'powerup', 'lockbox', 'key', 'unlock'].includes(item.type))
      .map(item => ({ id: item.id, name: item.name, type: item.type, rarity: item.rarity, asset: item.asset })),
    unsupported: {
      foilCards: 'Prepared only: no authoritative Foil item definitions exist yet.',
      achievements: 'Prepared only: no achievement persistence tables exist yet.',
    },
  }
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

async function resetPlayerScope(db, { playerId, scope }) {
  const selected = safeId(scope, 'reset scope')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (selected === 'inventory') {
      await client.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId])
    } else if (selected === 'theme-albums') {
      await client.query(`DELETE FROM fo_theme_album_transactions WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_theme_album_collectors WHERE player_id=$1`, [playerId])
      await client.query(`DELETE FROM fo_theme_album_entries WHERE player_id=$1`, [playerId])
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
  if (body.action === 'seed-initial-market') return seedInitialMarket(db)
  if (body.action === 'reset') return resetPlayerScope(db, { playerId, scope: body.scope })
  fail('Invalid developer toolkit action')
}

export default async function handler(req, res) {
  const db = getDb()
  try {
    verifyDevToolkitAccess(req)
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') return res.json({ state: await getPlayerState(db, player.player_id), catalogue: toolkitCatalogue() })
    if (req.method !== 'POST') return res.status(405).end()
    const result = await runDevToolkitAction(db, { playerId: player.player_id, body: req.body ?? {} })
    return res.json({ result, state: await getPlayerState(db, player.player_id), catalogue: toolkitCatalogue() })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message, code: error.code })
  }
}
