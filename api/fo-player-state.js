import { getDb } from './_db.js'
import { linkDevice, requirePlayer } from './_auth.js'
import { getPlayerState, mutatePlayerValue } from './_playerState.js'
import { setInitialDisplayName } from './_nickname.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') return res.json({ player, state: await getPlayerState(db, player.player_id) })
    if (req.method !== 'POST') return res.status(405).end()
    if (req.body?.action === 'link-device') return res.json(await linkDevice(db, { playerId: player.player_id, deviceUuid: req.body.deviceUuid }))
    if (req.body?.action === 'set-display-name') return res.json(await setInitialDisplayName(db, { playerId: player.player_id, displayName: req.body.displayName }))
    if (req.body?.action !== 'mutate') return res.status(400).json({ error: 'Invalid action' })
    // Valuable client calls may spend owned value, but may never mint it.
    if (Number(req.body.amount) > 0) return res.status(403).json({ error: 'Client grants are not allowed' })
    const result = await mutatePlayerValue(db, { ...req.body, playerId: player.player_id, source: `client:${req.body.source ?? 'unknown'}` })
    res.json(result)
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
}
