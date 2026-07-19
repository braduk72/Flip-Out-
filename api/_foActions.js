import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { consumePowerUp, continueMatch, openPlayerLockbox } from './_operations.js'
import { convertCoinsToStars } from './_coinLedger.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'continue') return res.json(await continueMatch(db, { ...body, playerId: player.player_id }))
    if (body.action === 'power-up') return res.json(await consumePowerUp(db, { ...body, playerId: player.player_id }))
    if (body.action === 'open-lockbox') return res.json(await openPlayerLockbox(db, { ...body, playerId: player.player_id }))
    if (body.action === 'convert-coins-to-stars') return res.json(await convertCoinsToStars(db, { accountId: player.player_id, coins: body.coins, referenceId: body.referenceId }))
    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
