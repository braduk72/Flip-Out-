import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { getSeasonState, recordMissionReroll, spendSeasonTickets } from './_seasonJourney.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') return res.json(await getSeasonState(db, { playerId: player.player_id, timeZone: req.query?.timeZone ?? 'UTC' }))
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'claim-choice') {
      return res.json(await spendSeasonTickets(db, { playerId: player.player_id, claimId: body.claimId, choiceId: body.choiceId }))
    }
    if (body.action === 'reroll-mission') {
      return res.json(await recordMissionReroll(db, {
        playerId: player.player_id,
        transactionId: body.transactionId,
        missionId: body.missionId,
        paymentType: body.paymentType ?? 'free',
        timeZone: body.timeZone ?? 'UTC',
      }))
    }
    return res.status(400).json({ error: 'Invalid season action' })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message, code: error.code })
  }
}
