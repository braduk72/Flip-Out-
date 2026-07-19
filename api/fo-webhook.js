import Stripe from 'stripe'
import { ensureEconomyTransactionsTable, purchasePayload, recordPurchaseGrant } from './_economy.js'
import { getDb } from './_db.js'

// Disable Vercel's automatic body parsing — Stripe needs the raw bytes to verify signature
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']
  const secret  = process.env.STRIPE_FO_WEBHOOK_SECRET

  if (!secret) return res.status(500).json({ error: 'Webhook secret not configured' })

  let event
  try {
    event = new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    return res.status(400).json({ error: `Signature invalid: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.metadata?.source !== 'flipout') return res.json({ received: true })

    const { player_id, device_uuid, product_id, product_type, coins, decks, extras } = session.metadata
    if (!player_id) return res.status(400).json({ error: 'Authenticated purchase owner missing' })
    const customerEmail = session.customer_details?.email?.toLowerCase()
    const db = getDb()

    try {
      await db.query(
        `UPDATE fo_purchases SET status = 'completed', completed_at = NOW() WHERE stripe_session_id = $1 AND player_id = $2`,
        [session.id, player_id]
      )

      await ensureEconomyTransactionsTable(db)
      await recordPurchaseGrant(db, {
        stripeSessionId: session.id,
        playerId: player_id,
        deviceUuid: device_uuid,
        payload: purchasePayload({
          productId: product_id,
          productType: product_type,
          coins,
          decks: JSON.parse(decks ?? '[]'),
          extras: JSON.parse(extras ?? '{}'),
        }),
      })

      // Link email captured by Stripe checkout to this device
      if (customerEmail && device_uuid) {
        await db.query(
          `UPDATE fo_players SET email = $1, updated_at = NOW() WHERE device_uuid = $2`,
          [customerEmail, device_uuid]
        )
      }

      console.log(`[FO webhook] ${product_id} completed for ${device_uuid} (${customerEmail})`)
    } catch (err) {
      console.error('[FO webhook]', err)
      return res.status(500).json({ error: 'Processing failed' })
    }
  }

  res.json({ received: true })
}
