import crypto from 'node:crypto'
import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { verifyAdvertCompletion } from './_advertProvider.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method !== 'POST') return res.status(405).end()
    const { provider, receipt, placement, matchId } = req.body ?? {}
    if (!['daily-wheel', 'continue', 'match3-double'].includes(placement)) return res.status(400).json({ error: 'Invalid advert placement' })
    const verified = await verifyAdvertCompletion({ provider, receipt, placement, playerId: player.player_id, matchId })
    const completionId = `advert:${crypto.randomUUID()}`
    await db.query(`INSERT INTO fo_advert_completions(completion_id,player_id,provider,provider_receipt_hash,placement,match_id) VALUES($1,$2,$3,$4,$5,$6)`, [completionId, player.player_id, provider, verified.receiptHash, placement, matchId ?? null])
    res.json({ completionId })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
