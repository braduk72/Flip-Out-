import pg from 'pg'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

// Called from Settings → Restore Purchases
// Given an email, returns all completed purchases and links the new device to that email.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, deviceUuid } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'Email required' })

  const db = getPool()

  try {
    const normalised = email.trim().toLowerCase()

    // Find all device UUIDs linked to this email
    const { rows: players } = await db.query(
      `SELECT device_uuid FROM fo_players WHERE LOWER(email) = $1`,
      [normalised]
    )

    if (!players.length) return res.json({ found: false })

    const deviceUuids = players.map(p => p.device_uuid)

    // Fetch all completed purchases across all devices
    const { rows: purchases } = await db.query(
      `SELECT product_type, coins_granted, decks_granted, extras_granted
       FROM fo_purchases
       WHERE device_uuid = ANY($1) AND status = 'completed'`,
      [deviceUuids]
    )

    // Link new device to this email
    if (deviceUuid && !deviceUuids.includes(deviceUuid)) {
      await db.query(
        `INSERT INTO fo_players (device_uuid, email) VALUES ($1, $2)
         ON CONFLICT (device_uuid) DO UPDATE SET email = $2, updated_at = NOW()`,
        [deviceUuid, normalised]
      )
    }

    // Aggregate purchases
    let coins     = 0
    const decks   = new Set()
    let removeAds = false
    const extras  = {}

    for (const p of purchases) {
      coins += p.coins_granted ?? 0
      ;(p.decks_granted ?? []).forEach(d => decks.add(d))
      if (p.product_type === 'remove_ads') removeAds = true
      for (const [k, v] of Object.entries(p.extras_granted ?? {})) {
        extras[k] = (extras[k] ?? 0) + v
      }
    }

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
    } catch (_) {
      // fo_game_stats may not exist yet — stats just won't be restored this time
    }

    res.json({ found: true, coins, decks: [...decks], removeAds, extras, streakBest, pvpWins })
  } catch (err) {
    console.error('[FO restore]', err)
    res.status(500).json({ error: 'Restore failed' })
  }
}
