import pg from 'pg'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

// Lazy one-time table creation (idempotent)
let ready = false
async function ensureTable(db) {
  if (ready) return
  await db.query(`
    CREATE TABLE IF NOT EXISTS fo_game_stats (
      device_uuid  TEXT        PRIMARY KEY,
      streak_best  INTEGER     NOT NULL DEFAULT 0,
      pvp_wins     INTEGER     NOT NULL DEFAULT 0,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  ready = true
}

// POST /api/fo-sync-stats
// Body: { deviceUuid, streakBest, pvpWins }
// Stats only ever increase — server never reduces a value below its current best.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deviceUuid, streakBest = 0, pvpWins = 0 } = req.body ?? {}
  if (!deviceUuid) return res.status(400).json({ error: 'deviceUuid required' })

  const db = getPool()
  try {
    await ensureTable(db)

    await db.query(`
      INSERT INTO fo_game_stats (device_uuid, streak_best, pvp_wins, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (device_uuid) DO UPDATE SET
        streak_best = GREATEST(fo_game_stats.streak_best, EXCLUDED.streak_best),
        pvp_wins    = GREATEST(fo_game_stats.pvp_wins,    EXCLUDED.pvp_wins),
        updated_at  = NOW()
    `, [deviceUuid, streakBest, pvpWins])

    res.json({ ok: true })
  } catch (err) {
    console.error('[FO sync-stats]', err)
    res.status(500).json({ error: 'Sync failed' })
  }
}
