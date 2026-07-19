import { appendCoinTransaction } from './_coinLedger.js'

export async function ensureEconomyTransactionsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS fo_economy_transactions (
      transaction_id TEXT PRIMARY KEY,
      device_uuid    TEXT NOT NULL,
      source         TEXT NOT NULL,
      payload        JSONB NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE INDEX IF NOT EXISTS fo_economy_transactions_device_idx
      ON fo_economy_transactions (device_uuid, created_at)
  `)
}

export function purchaseTransactionId(stripeSessionId) {
  if (!stripeSessionId) throw new Error('Stripe session id is required')
  return `purchase:${stripeSessionId}`
}

export function purchasePayload({ productId, productType, coins = 0, decks = [], extras = {}, removeAds = false }) {
  return {
    product_id: productId,
    product_type: productType,
    coins: Number.parseInt(coins, 10) || 0,
    decks: Array.isArray(decks) ? decks : [],
    extras: extras && typeof extras === 'object' ? extras : {},
    removeAds: Boolean(removeAds || productType === 'remove_ads'),
  }
}

export async function recordPurchaseGrant(db, { stripeSessionId, playerId, deviceUuid, payload }) {
  if (!playerId) throw new Error('Authenticated player id is required')
  const transactionId = purchaseTransactionId(stripeSessionId)
  const isPool = typeof db.connect === 'function' && typeof db.totalCount === 'number'
  const isPgClient = db.constructor?.name === 'Client'
  const client = isPool ? await db.connect() : db
  const transactional = isPool || isPgClient
  try {
  if (transactional) await client.query('BEGIN')
  const result = await client.query(
    `INSERT INTO fo_economy_transactions (transaction_id, player_id, device_uuid, source, payload)
     VALUES ($1, $2, $3, 'purchase', $4)
     ON CONFLICT (transaction_id) DO NOTHING
     RETURNING transaction_id, player_id`,
    [transactionId, playerId, deviceUuid, payload]
  )
  if (!result.rowCount) {
    const existing = await client.query(`SELECT player_id FROM fo_economy_transactions WHERE transaction_id=$1`, [transactionId])
    if (String(existing.rows[0]?.player_id) !== String(playerId)) {
      throw Object.assign(new Error('Purchase transaction belongs to another account'), { status: 403, code: 'PURCHASE_ACCOUNT_MISMATCH' })
    }
  }
  if (result.rowCount === 1 && Number(payload.coins) > 0 && transactional) {
    await appendCoinTransaction(client, {
      transactionId: `${transactionId}:coins`, accountId: playerId, amount: Number(payload.coins),
      transactionType: 'purchase', sourceReferenceId: stripeSessionId,
      metadata: { purchaseTransactionId: transactionId, productId: payload.product_id }, allowCreation: true,
    })
  }
  if (transactional) await client.query('COMMIT')
  return { transactionId, inserted: result.rowCount === 1, payload }
  } catch (error) {
    if (transactional) await client.query('ROLLBACK')
    throw error
  } finally {
    if (isPool) client.release()
  }
}

export async function linkLegacyTestPurchases(db, { playerId, deviceUuid, preview = process.env.VERCEL_ENV === 'preview' }) {
  if (!preview) throw Object.assign(new Error('Legacy linking is development-only'), { status: 403 })
  const device = await db.query(`SELECT player_id FROM fo_player_devices WHERE device_uuid=$1`, [deviceUuid])
  if (!device.rowCount || String(device.rows[0].player_id) !== String(playerId)) throw Object.assign(new Error('Device does not belong to this account'), { status: 403 })
  const conflict = await db.query(`SELECT 1 FROM fo_purchases WHERE device_uuid=$1 AND player_id IS NOT NULL AND player_id<>$2 LIMIT 1`, [deviceUuid, playerId])
  if (conflict.rowCount) throw Object.assign(new Error('Legacy purchase belongs to another account'), { status: 409, code: 'PURCHASE_LINK_CONFLICT' })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const purchases = await client.query(`UPDATE fo_purchases SET player_id=$2 WHERE device_uuid=$1 AND player_id IS NULL RETURNING stripe_session_id`, [deviceUuid, playerId])
    await client.query(`UPDATE fo_economy_transactions SET player_id=$2 WHERE device_uuid=$1 AND player_id IS NULL AND source='purchase'`, [deviceUuid, playerId])
    await client.query('COMMIT')
    return { linked: purchases.rowCount, duplicate: purchases.rowCount === 0 }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export function toClientGrant(row) {
  return {
    transactionId: row.transaction_id,
    source: row.source,
    ...row.payload,
  }
}
