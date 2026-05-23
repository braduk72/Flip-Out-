import Stripe from 'stripe'
import pg from 'pg'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

// Called by the frontend after Stripe redirects back with ?fo_session=xxx&fo_device=xxx
// Verifies the payment directly with Stripe, then records it and returns what to grant.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { session_id, device } = req.query
  if (!session_id || !device) return res.status(400).json({ error: 'Missing params' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const db = getPool()

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== 'paid')          return res.status(402).json({ error: 'Payment not completed' })
    if (session.metadata?.source !== 'flipout')     return res.status(400).json({ error: 'Wrong source' })
    if (session.metadata?.device_uuid !== device)   return res.status(403).json({ error: 'Device mismatch' })

    const { product_id, product_type, coins, decks, extras } = session.metadata
    const email = session.customer_details?.email?.toLowerCase()

    // Upsert player with email from Stripe
    if (email) {
      await db.query(
        `INSERT INTO fo_players (device_uuid, email) VALUES ($1, $2)
         ON CONFLICT (device_uuid) DO UPDATE SET email = $2, updated_at = NOW()`,
        [device, email]
      )
    }

    // Mark purchase completed (idempotent — webhook may have already done this)
    await db.query(
      `INSERT INTO fo_purchases
         (device_uuid, stripe_session_id, product_id, product_type, coins_granted, decks_granted, extras_granted, pence, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', NOW())
       ON CONFLICT (stripe_session_id)
       DO UPDATE SET status = 'completed', completed_at = COALESCE(fo_purchases.completed_at, NOW())`,
      [device, session_id, product_id, product_type,
       parseInt(coins ?? 0), JSON.parse(decks ?? '[]'), JSON.parse(extras ?? '{}'),
       session.amount_total]
    )

    res.json({
      ok:           true,
      product_id,
      product_type,
      coins:        parseInt(coins ?? 0),
      decks:        JSON.parse(decks ?? '[]'),
      extras:       JSON.parse(extras ?? '{}'),
      email,
    })
  } catch (err) {
    console.error('[FO verify]', err)
    res.status(500).json({ error: 'Verification failed' })
  }
}
