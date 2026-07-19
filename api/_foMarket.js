import { getDb } from './_db.js'
import { requireProtectedPlayer } from './_auth.js'
import { applyReward } from './_gameServices.js'
import { createListing, settleListing } from './_operations.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requireProtectedPlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') {
      const listings = await db.query(`SELECT listing_id,item_id,quantity,price_coins,created_at,expires_at FROM fo_market_listings WHERE status='active' AND (expires_at IS NULL OR expires_at>NOW()) ORDER BY created_at DESC LIMIT 100`)
      return res.json({ listings: listings.rows })
    }
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'list') return res.json(await createListing(db, { ...body, playerId: player.player_id }))
    if (body.action === 'buy') return res.json(await settleListing(db, { ...body, playerId: player.player_id }))
    if (body.action === 'cancel') {
      const client = await db.connect()
      try {
        await client.query('BEGIN')
        const listing = await client.query(`UPDATE fo_market_listings SET status='cancelled',cancelled_at=NOW() WHERE listing_id=$1 AND seller_id=$2 AND status='active' RETURNING item_id,quantity`, [body.listingId, player.player_id])
        if (!listing.rowCount) throw Object.assign(new Error('Listing unavailable'), { status: 409 })
        await applyReward(client, { playerId: player.player_id, transactionId: `market-cancel:${body.listingId}`, source: 'market-return', reward: { itemId: listing.rows[0].item_id, amount: Number(listing.rows[0].quantity) } })
        await client.query('COMMIT')
        return res.json({ listingId: body.listingId, status: 'cancelled' })
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }
    return res.status(400).json({ error: 'Invalid market action' })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
