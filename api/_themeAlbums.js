import crypto from 'node:crypto'
import { ITEM_BY_ID, ITEM_CATALOG } from '../src/data/itemCatalog.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i
const VARIANTS = new Set(['normal', 'foil'])
const COLLECTOR_TIERS = Object.freeze(['bronze', 'silver', 'gold'])

function fail(message, status = 400, code = 'THEME_ALBUM_INVALID') {
  throw Object.assign(new Error(message), { status, code })
}

function safeId(value, label) {
  const id = String(value ?? '')
  if (!SAFE_ID.test(id)) fail(`Invalid ${label}`)
  return id
}

function normaliseVariant(value = 'normal') {
  const variant = String(value ?? 'normal').toLowerCase()
  if (!VARIANTS.has(variant)) fail('Invalid album card variant')
  return variant
}

function deckIdFor(item) {
  return String(item.deckId ?? item.baseDeckId ?? '').replace(/^deck:/, '')
}

export function themeAlbumFingerprint({ itemId, variant }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    itemId: safeId(itemId, 'card item id'),
    variant: normaliseVariant(variant),
  })).digest('hex')
}

export function resolveThemeAlbumCard(itemId, variant = 'normal', catalog = ITEM_BY_ID) {
  const id = safeId(itemId, 'card item id')
  const resolvedVariant = normaliseVariant(variant)
  const item = catalog.get(id)
  if (!item) fail('Card is not in the catalogue', 404, 'THEME_ALBUM_CARD_NOT_FOUND')
  if (item.type === 'card_variant' && item.variant === 'gold') fail('Collector cards cannot be stuck into Theme Albums', 409, 'THEME_ALBUM_COLLECTOR_CARD')
  if (item.type !== 'card') fail('Only standard collectible cards can be stuck into Theme Albums', 409, 'THEME_ALBUM_CARD_UNSUPPORTED')
  if (resolvedVariant !== 'normal') fail('Foil Theme Album entries require authoritative Foil card inventory items first', 409, 'THEME_ALBUM_FOIL_UNSUPPORTED')
  const themeId = deckIdFor(item)
  if (!themeId) fail('Card is not attached to a Theme', 409, 'THEME_ALBUM_THEME_MISSING')
  return { item, itemId: id, themeId, variant: resolvedVariant }
}

export function themeAlbumTotals(catalog = ITEM_CATALOG) {
  const totals = new Map()
  for (const item of catalog) {
    if (item.type !== 'card' || !item.deckId) continue
    const themeId = deckIdFor(item)
    totals.set(themeId, (totals.get(themeId) ?? 0) + 1)
  }
  return totals
}

export function collectorTiersForCompletion({ normalCount, foilCount, total }) {
  if (!Number.isSafeInteger(total) || total < 1) return []
  const normalComplete = normalCount >= total
  const foilComplete = foilCount >= total
  return COLLECTOR_TIERS.filter(tier =>
    (tier === 'bronze' && normalComplete) ||
    (tier === 'silver' && foilComplete) ||
    (tier === 'gold' && normalComplete && foilComplete)
  )
}

async function existingReceipt(client, transactionId) {
  const tx = await client.query(
    `SELECT transaction_id,player_id,input_fingerprint,result,created_at
       FROM fo_theme_album_transactions
      WHERE transaction_id=$1`,
    [transactionId]
  )
  return tx.rows[0] ?? null
}

async function completionFor(client, { playerId, themeId }) {
  const counts = await client.query(
    `SELECT variant, COUNT(*)::int AS count
       FROM fo_theme_album_entries
      WHERE player_id=$1 AND theme_id=$2
      GROUP BY variant`,
    [playerId, themeId]
  )
  const byVariant = new Map(counts.rows.map(row => [row.variant, Number(row.count)]))
  const total = themeAlbumTotals().get(themeId) ?? 0
  return {
    themeId,
    total,
    normalCount: byVariant.get('normal') ?? 0,
    foilCount: byVariant.get('foil') ?? 0,
  }
}

async function grantCollectorCards(client, { playerId, themeId, transactionId, completion }) {
  const tiers = collectorTiersForCompletion(completion)
  const awarded = []
  for (const tier of tiers) {
    const result = await client.query(
      `INSERT INTO fo_theme_album_collectors(player_id,theme_id,collector_tier,awarded_by_transaction_id)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(player_id,theme_id,collector_tier) DO NOTHING
       RETURNING collector_tier`,
      [playerId, themeId, tier, transactionId]
    )
    if (result.rowCount) awarded.push(tier)
  }
  return awarded
}

function receipt(row, duplicate) {
  return { duplicate, transactionId: row.transaction_id, ...row.result, createdAt: row.created_at }
}

export async function stickCardInThemeAlbum(db, { playerId, transactionId: suppliedTransactionId, itemId, variant = 'normal' }) {
  const transactionId = safeId(suppliedTransactionId, 'album transaction id')
  const card = resolveThemeAlbumCard(itemId, variant)
  const fingerprint = themeAlbumFingerprint(card)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`theme-album:${transactionId}`])
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`theme-album:${playerId}:${card.themeId}`])
    const prior = await existingReceipt(client, transactionId)
    if (prior) {
      if (String(prior.player_id) !== String(playerId)) fail('Album transaction belongs to another account', 403, 'THEME_ALBUM_ACCOUNT_CONFLICT')
      if (prior.input_fingerprint !== fingerprint) fail('Album transaction ID was already used for a different card', 409, 'THEME_ALBUM_IDEMPOTENCY_CONFLICT')
      await client.query('COMMIT')
      return receipt(prior, true)
    }

    await enforceRateLimit(client, { playerId, action: 'theme-album-stick', limit: 30 })
    const filled = await client.query(
      `SELECT transaction_id
         FROM fo_theme_album_entries
        WHERE player_id=$1 AND theme_id=$2 AND card_item_id=$3 AND variant=$4`,
      [playerId, card.themeId, card.itemId, card.variant]
    )
    if (filled.rowCount) fail('This Theme Album slot is already filled', 409, 'THEME_ALBUM_SLOT_FILLED')

    await applyReward(client, {
      playerId,
      transactionId: `${transactionId}:inventory`,
      source: 'theme-album-stick',
      reward: { itemId: card.itemId, amount: -1 },
      minimumRemaining: 0,
      metadata: { sourceReferenceId: transactionId, themeId: card.themeId, variant: card.variant },
    })
    await client.query(
      `INSERT INTO fo_theme_album_entries(transaction_id,player_id,theme_id,card_item_id,variant)
       VALUES($1,$2,$3,$4,$5)`,
      [transactionId, playerId, card.themeId, card.itemId, card.variant]
    )
    const completion = await completionFor(client, { playerId, themeId: card.themeId })
    const collectorCardsAwarded = await grantCollectorCards(client, { playerId, themeId: card.themeId, transactionId, completion })
    const result = { themeId: card.themeId, itemId: card.itemId, variant: card.variant, completion, collectorCardsAwarded }
    await client.query(
      `INSERT INTO fo_theme_album_transactions(transaction_id,player_id,input_fingerprint,result)
       VALUES($1,$2,$3,$4)`,
      [transactionId, playerId, fingerprint, result]
    )
    await client.query('COMMIT')
    return { duplicate: false, transactionId, ...result }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getThemeAlbumState(db, playerId) {
  const [entries, collectors] = await Promise.all([
    db.query(
      `SELECT transaction_id,theme_id,card_item_id,variant,stuck_at
         FROM fo_theme_album_entries
        WHERE player_id=$1
        ORDER BY theme_id,card_item_id,variant`,
      [playerId]
    ),
    db.query(
      `SELECT theme_id,collector_tier,awarded_by_transaction_id,awarded_at
         FROM fo_theme_album_collectors
        WHERE player_id=$1
        ORDER BY theme_id,collector_tier`,
      [playerId]
    ),
  ])
  return { entries: entries.rows, collectors: collectors.rows }
}
