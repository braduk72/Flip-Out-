import { getRecyclerRecipes } from './_recycler.js'
import { getThemeAlbumState } from './_themeAlbums.js'
import { getPersonalAlbumState } from './_personalAlbums.js'
import { getInventoryCapacityState } from './_inventoryCapacity.js'
import { getAchievementState } from './_achievements.js'

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/

export function validateId(value, label = 'id') {
  if (!SAFE_ID.test(String(value ?? ''))) throw Object.assign(new Error(`Invalid ${label}`), { status: 400 })
  return String(value)
}

export function validateAmount(value) {
  if (!Number.isSafeInteger(value) || value === 0) throw Object.assign(new Error('Amount must be a non-zero safe integer'), { status: 400 })
  return value
}

export async function getPlayerState(db, playerId) {
  const [profile, balances, inventory, transactions, recyclerRecipes, themeAlbums, personalAlbums, inventoryCapacity, achievements] = await Promise.all([
    db.query(`SELECT player_id, account_kind, display_name, selected_avatar_id FROM fo_accounts WHERE player_id=$1`, [playerId]),
    db.query(`SELECT currency_id, balance FROM fo_player_balances WHERE player_id=$1 ORDER BY currency_id`, [playerId]),
    db.query(`SELECT item_id, quantity, bound_quantity FROM fo_player_inventory WHERE player_id=$1 AND quantity > 0 ORDER BY item_id`, [playerId]),
    db.query(`SELECT transaction_id, source, item_id, currency_id, amount, metadata, created_at FROM fo_player_transactions WHERE player_id=$1 ORDER BY created_at DESC LIMIT 100`, [playerId]),
    getRecyclerRecipes(db),
    getThemeAlbumState(db, playerId),
    getPersonalAlbumState(db, playerId),
    getInventoryCapacityState(db, playerId),
    getAchievementState(db, playerId),
  ])
  return {
    profile: profile.rows[0] ?? { player_id: playerId, account_kind: 'guest' },
    balances: balances.rows,
    inventory: inventory.rows,
    transactions: transactions.rows,
    recyclerRecipes,
    themeAlbums,
    personalAlbums,
    inventoryCapacity,
    achievements,
  }
}

export async function mutatePlayerValue(db, { playerId, transactionId, source, currencyId, itemId, amount, metadata = {} }) {
  validateId(transactionId, 'transactionId')
  validateId(source, 'source')
  validateAmount(amount)
  if (Boolean(currencyId) === Boolean(itemId)) throw Object.assign(new Error('Exactly one currencyId or itemId is required'), { status: 400 })
  const target = validateId(currencyId ?? itemId, currencyId ? 'currencyId' : 'itemId')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query(`SELECT player_id FROM fo_player_transactions WHERE transaction_id=$1`, [transactionId])
    if (existing.rowCount) {
      if (String(existing.rows[0].player_id) !== String(playerId)) throw Object.assign(new Error('Transaction belongs to another account'), { status: 403 })
      await client.query('ROLLBACK')
      return { applied: false, duplicate: true, transactionId }
    }
    const table = currencyId ? 'fo_player_balances' : 'fo_player_inventory'
    const idColumn = currencyId ? 'currency_id' : 'item_id'
    const valueColumn = currencyId ? 'balance' : 'quantity'
    await client.query(
      `INSERT INTO ${table} (player_id, ${idColumn}, ${valueColumn}) VALUES ($1,$2,0) ON CONFLICT DO NOTHING`,
      [playerId, target]
    )
    const updated = await client.query(
      `UPDATE ${table} SET ${valueColumn}=${valueColumn}+$3, updated_at=NOW()
        WHERE player_id=$1 AND ${idColumn}=$2 AND ${valueColumn}+$3 >= 0
        RETURNING ${valueColumn}`,
      [playerId, target, amount]
    )
    if (!updated.rowCount) throw Object.assign(new Error('Insufficient balance or quantity'), { status: 409 })
    await client.query(
      `INSERT INTO fo_player_transactions (transaction_id, player_id, source, item_id, currency_id, amount, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [transactionId, playerId, source, itemId ?? null, currencyId ?? null, amount, metadata]
    )
    await client.query('COMMIT')
    return { applied: true, duplicate: false, transactionId, value: Number(updated.rows[0][valueColumn]) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
