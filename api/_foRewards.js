import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { claimDailyLogin, claimDailyWheel, getDailyLoginStatus } from './_gameServices.js'
import { getPlayerState } from './_playerState.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') {
      const [state, dailyLogin] = await Promise.all([
        getPlayerState(db, player.player_id),
        getDailyLoginStatus(db, { playerId: player.player_id, timeZone: req.query?.timeZone }),
      ])
      return res.json({ state, dailyLogin })
    }
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'daily-login') return res.json(await claimDailyLogin(db, { playerId: player.player_id, timeZone: body.timeZone }))
    if (body.action === 'daily-wheel') return res.json(await claimDailyWheel(db, { playerId: player.player_id, spinType: body.spinType, timeZone: body.timeZone, advertCompletionId: body.advertCompletionId, requestId: body.requestId }))
    return res.status(400).json({ error: 'Invalid reward action' })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message, code: error.code })
  }
}
