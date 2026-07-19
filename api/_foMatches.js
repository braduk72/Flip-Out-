import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { completeMatchSession, createMatchSession, getMatchSession, recordMatchEvent } from './_matchSessions.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') return res.json(await getMatchSession(db, { playerId: player.player_id, matchId: req.query?.matchId }))
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'create') return res.json(await createMatchSession(db, { ...body, playerId: player.player_id }))
    if (body.action === 'event') return res.json(await recordMatchEvent(db, { ...body, playerId: player.player_id }))
    if (body.action === 'complete') return res.json(await completeMatchSession(db, { ...body, playerId: player.player_id }))
    return res.status(400).json({ error: 'Invalid match action' })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
