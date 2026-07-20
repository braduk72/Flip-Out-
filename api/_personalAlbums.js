import crypto from 'node:crypto'
import { ITEM_BY_ID } from '../src/data/itemCatalog.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'
import { validateSuitableName } from './_nickname.js'

export const PERSONAL_ALBUM_LIMIT = 10
export const PERSONAL_ALBUM_COST_COINS = 500

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function fail(message, status = 400, code = 'PERSONAL_ALBUM_INVALID') {
  throw Object.assign(new Error(message), { status, code })
}

function safeId(value, label) {
  const id = String(value ?? '')
  if (!SAFE_ID.test(id)) fail(`Invalid ${label}`)
  return id
}

function safeUuid(value, label) {
  const id = String(value ?? '')
  if (!UUID.test(id)) fail(`Invalid ${label}`)
  return id
}

function normaliseVariant(value = 'normal') {
  const variant = String(value ?? 'normal').toLowerCase()
  if (!['normal', 'foil'].includes(variant)) fail('Invalid personal album card variant')
  return variant
}

export function validatePersonalAlbumName(value) {
  return validateSuitableName(value, { label: 'Album name', min: 3, max: 32, allowSpaces: true })
}

export function personalAlbumFingerprint({ name }) {
  return crypto.createHash('sha256').update(JSON.stringify({ name: validatePersonalAlbumName(name) })).digest('hex')
}

function resolveInventoryCard(itemId, variant = 'normal') {
  const id = safeId(itemId, 'card item id')
  const resolvedVariant = normaliseVariant(variant)
  const item = ITEM_BY_ID.get(id)
  if (!item) fail('Card is not in the catalogue', 404, 'PERSONAL_ALBUM_CARD_NOT_FOUND')
  if (item.type === 'card_variant' && item.variant === 'gold') fail('Collector cards cannot be placed in Personal Albums', 409, 'PERSONAL_ALBUM_COLLECTOR_CARD')
  if (item.type !== 'card') fail('Only Inventory cards can be placed in Personal Albums', 409, 'PERSONAL_ALBUM_CARD_UNSUPPORTED')
  if (resolvedVariant !== 'normal') fail('Foil Personal Album entries require authoritative Foil card inventory items first', 409, 'PERSONAL_ALBUM_FOIL_UNSUPPORTED')
  return { itemId: id, variant: resolvedVariant }
}

function receipt(row, duplicate) {
  return { duplicate, transactionId: row.transaction_id, ...row.result, createdAt: row.created_at }
}

async function existingReceipt(client, transactionId) {
  const result = await client.query(
    `SELECT transaction_id,player_id,input_fingerprint,result,created_at
       FROM fo_personal_album_transactions
      WHERE transaction_id=$1`,
    [transactionId]
  )
  return result.rows[0] ?? null
}

export async function createPersonalAlbum(db, { playerId, transactionId: suppliedTransactionId, name }) {
  const transactionId = safeId(suppliedTransactionId, 'personal album transaction id')
  const safeName = validatePersonalAlbumName(name)
  const fingerprint = personalAlbumFingerprint({ name: safeName })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`personal-albums:${playerId}`])
    const prior = await existingReceipt(client, transactionId)
    if (prior) {
      if (String(prior.player_id) !== String(playerId)) fail('Personal Album transaction belongs to another account', 403, 'PERSONAL_ALBUM_ACCOUNT_CONFLICT')
      if (prior.input_fingerprint !== fingerprint) fail('Personal Album transaction ID was already used for a different request', 409, 'PERSONAL_ALBUM_IDEMPOTENCY_CONFLICT')
      await client.query('COMMIT')
      return receipt(prior, true)
    }

    await enforceRateLimit(client, { playerId, action: 'personal-album-create', limit: 12 })
    const count = await client.query(`SELECT COUNT(*)::int AS count FROM fo_personal_albums WHERE player_id=$1`, [playerId])
    if (Number(count.rows[0].count) >= PERSONAL_ALBUM_LIMIT) fail('Personal Album limit reached', 409, 'PERSONAL_ALBUM_LIMIT')
    await applyReward(client, {
      playerId,
      transactionId: `${transactionId}:cost`,
      source: 'personal-album-create',
      reward: { currencyId: 'coins', amount: -PERSONAL_ALBUM_COST_COINS },
      metadata: { sourceReferenceId: transactionId, name: safeName },
    })
    const album = await client.query(
      `INSERT INTO fo_personal_albums(player_id,name,created_transaction_id)
       VALUES($1,$2,$3)
       RETURNING album_id,name,created_at`,
      [playerId, safeName, transactionId]
    )
    const result = {
      albumId: album.rows[0].album_id,
      name: album.rows[0].name,
      costCoins: PERSONAL_ALBUM_COST_COINS,
      limit: PERSONAL_ALBUM_LIMIT,
    }
    await client.query(
      `INSERT INTO fo_personal_album_transactions(transaction_id,player_id,action,input_fingerprint,result)
       VALUES($1,$2,'create',$3,$4)`,
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

export async function addCardToPersonalAlbum(db, { playerId, albumId, itemId, variant = 'normal' }) {
  const id = safeUuid(albumId, 'album id')
  const card = resolveInventoryCard(itemId, variant)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'personal-album-card', limit: 60 })
    const album = await client.query(`SELECT album_id FROM fo_personal_albums WHERE album_id=$1 AND player_id=$2 FOR UPDATE`, [id, playerId])
    if (!album.rowCount) fail('Personal Album not found', 404, 'PERSONAL_ALBUM_NOT_FOUND')
    const inventory = await client.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id=$2 AND quantity > 0`, [playerId, card.itemId])
    if (!inventory.rowCount) fail('Only cards currently in Inventory can be placed in Personal Albums', 409, 'PERSONAL_ALBUM_CARD_NOT_IN_INVENTORY')
    const inserted = await client.query(
      `INSERT INTO fo_personal_album_cards(album_id,player_id,item_id,variant)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(album_id,item_id,variant) DO NOTHING
       RETURNING album_id`,
      [id, playerId, card.itemId, card.variant]
    )
    await client.query('COMMIT')
    return { albumId: id, itemId: card.itemId, variant: card.variant, added: inserted.rowCount > 0, duplicate: inserted.rowCount === 0 }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function removeCardFromPersonalAlbum(db, { playerId, albumId, itemId, variant = 'normal' }) {
  const id = safeUuid(albumId, 'album id')
  const card = resolveInventoryCard(itemId, variant)
  const result = await db.query(
    `DELETE FROM fo_personal_album_cards
      WHERE album_id=$1 AND player_id=$2 AND item_id=$3 AND variant=$4`,
    [id, playerId, card.itemId, card.variant]
  )
  return { albumId: id, itemId: card.itemId, variant: card.variant, removed: result.rowCount > 0 }
}

export async function getPersonalAlbumState(db, playerId) {
  const [albums, cards] = await Promise.all([
    db.query(
      `SELECT album_id,name,created_at,updated_at
         FROM fo_personal_albums
        WHERE player_id=$1
        ORDER BY created_at,album_id`,
      [playerId]
    ),
    db.query(
      `SELECT album_id,item_id,variant,added_at
         FROM fo_personal_album_cards
        WHERE player_id=$1
        ORDER BY album_id,item_id,variant`,
      [playerId]
    ),
  ])
  return { albums: albums.rows, cards: cards.rows, limit: PERSONAL_ALBUM_LIMIT, createCostCoins: PERSONAL_ALBUM_COST_COINS }
}
