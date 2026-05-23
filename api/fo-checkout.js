import Stripe from 'stripe'
import pg from 'pg'
import { PRODUCTS } from './_products.js'

const { Pool } = pg
let pool
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return pool
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { deviceUuid, productId } = req.body ?? {}
  if (!deviceUuid || !productId) return res.status(400).json({ error: 'Missing deviceUuid or productId' })

  const product = PRODUCTS[productId]
  if (!product) return res.status(400).json({ error: 'Unknown product' })

  const baseUrl = process.env.FO_URL || 'https://flipout.gizmogames.uk'
  const db = getPool()

  try {
    // Ensure player record exists
    await db.query(
      `INSERT INTO fo_players (device_uuid) VALUES ($1) ON CONFLICT (device_uuid) DO NOTHING`,
      [deviceUuid]
    )

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: product.pence,
          product_data: { name: `Flip Out! — ${product.name}` },
        },
        quantity: 1,
      }],
      metadata: {
        source:       'flipout',
        device_uuid:  deviceUuid,
        product_id:   productId,
        product_type: product.type,
        coins:        String(product.coins ?? 0),
        decks:        JSON.stringify(product.decks ?? []),
        extras:       JSON.stringify(product.extras ?? {}),
      },
      success_url: `${baseUrl}/?fo_session={CHECKOUT_SESSION_ID}&fo_device=${deviceUuid}`,
      cancel_url:  `${baseUrl}/`,
    })

    // Record as pending (for idempotency)
    await db.query(
      `INSERT INTO fo_purchases
         (device_uuid, stripe_session_id, product_id, product_type, coins_granted, decks_granted, extras_granted, pence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (stripe_session_id) DO NOTHING`,
      [deviceUuid, session.id, productId, product.type,
       product.coins ?? 0, product.decks ?? [], product.extras ?? {}, product.pence]
    )

    res.json({ url: session.url })
  } catch (err) {
    console.error('[FO checkout]', err)
    res.status(500).json({ error: 'Checkout failed' })
  }
}
