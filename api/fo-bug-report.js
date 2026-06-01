import pg from 'pg'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

let tableReady = false
async function ensureTable(db) {
  if (tableReady) return
  await db.query(`
    CREATE TABLE IF NOT EXISTS fo_bug_reports (
      id          SERIAL PRIMARY KEY,
      version     TEXT,
      description TEXT NOT NULL,
      user_email  TEXT,
      user_agent  TEXT,
      ip_address  TEXT,
      reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  tableReady = true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { description, userEmail, userAgent, version } = req.body ?? {}
  if (!description?.trim()) return res.status(400).json({ ok: false, msg: 'Description required' })

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? null
  const now = new Date().toISOString()

  // ── Store in DB ───────────────────────────────────────────────────────────
  try {
    const db = getPool()
    await ensureTable(db)
    await db.query(
      `INSERT INTO fo_bug_reports (version, description, user_email, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [version || 'unknown', description.trim(), userEmail?.trim() || null, userAgent || null, ip]
    )
  } catch (err) {
    console.error('[FO bug-report] DB error:', err)
    // Non-fatal — still attempt email
  }

  // ── Send email via Resend (requires RESEND_API_KEY env var) ───────────────
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlipOut Bug Reporter <noreply@gizmogames.uk>',
          to:   ['support@gizmogames.uk'],
          subject: `🐛 Bug Report — FlipOut ${version || 'unknown'}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#6B21A8">🐛 FlipOut Bug Report</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 12px;background:#f3f0ff;font-weight:bold;width:130px">Version</td><td style="padding:6px 12px">${version || 'unknown'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Time</td><td style="padding:6px 12px">${now}</td></tr>
                <tr><td style="padding:6px 12px;background:#f3f0ff;font-weight:bold">IP Address</td><td style="padding:6px 12px">${ip || 'unknown'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Device / OS</td><td style="padding:6px 12px;font-size:12px;word-break:break-all">${userAgent || 'unknown'}</td></tr>
                ${userEmail ? `<tr><td style="padding:6px 12px;background:#f3f0ff;font-weight:bold">Player email</td><td style="padding:6px 12px">${userEmail}</td></tr>` : ''}
              </table>
              <h3 style="color:#6B21A8;margin-top:20px">Description</h3>
              <div style="background:#f9f9f9;border-left:4px solid #6B21A8;padding:12px 16px;white-space:pre-wrap;font-size:14px">${description.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error('[FO bug-report] Resend error:', err)
      // Non-fatal
    }
  }

  return res.json({ ok: true })
}
