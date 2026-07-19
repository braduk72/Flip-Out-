import { ensureEconomyTransactionsTable, linkLegacyTestPurchases, toClientGrant } from './_economy.js'
import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'

// Called from Settings → Restore Purchases
// Given an email, returns all completed purchases and links the new device to that email.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deviceUuid, linkLegacyTest = false } = req.body ?? {}
  const db = getDb()

  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (linkLegacyTest) {
      return res.json(await linkLegacyTestPurchases(db, { playerId: player.player_id, deviceUuid }))
    }

    // Legacy device records remain readable only for devices already linked to this account.
    const { rows: players } = await db.query(
      `SELECT device_uuid FROM fo_player_devices WHERE player_id = $1`,
      [player.player_id]
    )
    const deviceUuids = players.map(p => p.device_uuid)

    await ensureEconomyTransactionsTable(db)

    // Backfill a stable transaction for purchases completed before the ledger existed.
    await db.query(`
      INSERT INTO fo_economy_transactions (transaction_id, device_uuid, source, payload, created_at)
      SELECT
        'purchase:' || stripe_session_id,
        device_uuid,
        'purchase',
        jsonb_build_object(
          'product_id', product_id,
          'product_type', product_type,
          'coins', COALESCE(coins_granted, 0),
          'decks', to_jsonb(COALESCE(decks_granted, ARRAY[]::text[])),
          'extras', COALESCE(extras_granted, '{}'::jsonb),
          'removeAds', product_type = 'remove_ads'
        ),
        COALESCE(completed_at, NOW())
      FROM fo_purchases
      WHERE device_uuid = ANY($1) AND player_id IS NULL AND status = 'completed'
      ON CONFLICT (transaction_id) DO NOTHING
    `, [deviceUuids])

    const { rows: transactionRows } = await db.query(
      `SELECT transaction_id, source, payload
       FROM fo_economy_transactions
       WHERE source = 'purchase' AND (player_id = $1 OR (player_id IS NULL AND device_uuid = ANY($2)))
       ORDER BY created_at, transaction_id`,
      [player.player_id, deviceUuids]
    )

    // Fetch game stats — take the best value across all linked devices
    let streakBest = 0, pvpWins = 0
    try {
      const { rows: statRows } = await db.query(
        `SELECT COALESCE(MAX(streak_best), 0) AS streak_best,
                COALESCE(MAX(pvp_wins),    0) AS pvp_wins
         FROM fo_game_stats
         WHERE device_uuid = ANY($1)`,
        [deviceUuids]
      )
      streakBest = statRows[0]?.streak_best ?? 0
      pvpWins    = statRows[0]?.pvp_wins    ?? 0
    } catch {
      // fo_game_stats may not exist yet — stats just won't be restored this time
    }

    res.json({ found: transactionRows.length > 0, grants: transactionRows.map(toClientGrant), streakBest, pvpWins })
  } catch (err) {
    console.error('[FO restore]', err)
    res.status(500).json({ error: 'Restore failed' })
  }
}
