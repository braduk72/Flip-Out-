import pg from 'pg'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

// ── Server-side source of truth for promo codes ───────────────────────────────
// Keep in sync with src/data/promoCodes.js (client uses that for offline fallback)
const CODES = {
  'FLIPOUT':    { stars: 2000 },
  'GIZMO100':   { stars: 1000 },
  'LAUNCH':     { stars: 5000 },
  'LUCKYPENNY': { stars: 10000, spins: 5 },
  'SPIN2WIN':   { spins: 5 },
  'NEWDECK':    { unlocks: 1 },
  'CRASHONE':   { avatar: 99 },  // Beta Tester exclusive — unlocks Crash Test Dummy avatar
}

// ── Ensure the tracking table exists (runs once per cold-start) ───────────────
let tableReady = false
async function ensureTable(db) {
  if (tableReady) return
  await db.query(`
    CREATE TABLE IF NOT EXISTS fo_code_redemptions (
      id           SERIAL PRIMARY KEY,
      code         TEXT        NOT NULL,
      device_uuid  TEXT        NOT NULL,
      email        TEXT,
      ip_address   TEXT,
      redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (code, device_uuid)
    )
  `)
  tableReady = true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { code: rawCode, deviceUuid } = req.body ?? {}
  if (!rawCode || !deviceUuid) return res.status(400).json({ ok: false, msg: 'Missing fields' })

  const code  = rawCode.trim().toUpperCase()
  const promo = CODES[code]
  if (!promo) return res.json({ ok: false, msg: 'Invalid code' })

  const db = getPool()
  await ensureTable(db)

  try {
    // Look up email — device may already be linked via Restore Purchases
    const { rows: players } = await db.query(
      'SELECT email FROM fo_players WHERE device_uuid = $1 LIMIT 1',
      [deviceUuid]
    )
    const email = players[0]?.email ?? null

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? null

    // Insert — UNIQUE(code, device_uuid) will throw a 23505 if already redeemed
    await db.query(
      `INSERT INTO fo_code_redemptions (code, device_uuid, email, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [code, deviceUuid, email, ip]
    )

    return res.json({
      ok: true,
      transactionId: `promo:${deviceUuid}:${code}`,
      stars: promo.stars || 0,
      spins: promo.spins || 0,
      unlocks: promo.unlocks || 0,
      avatar: promo.avatar || null,
    })

  } catch (err) {
    if (err.code === '23505') {
      // Unique-constraint violation — this device has already redeemed this code
      return res.json({ ok: false, msg: 'Code already redeemed' })
    }
    console.error('[FO redeem-code]', err)
    return res.status(500).json({ ok: false, msg: 'Server error — try again' })
  }
}
