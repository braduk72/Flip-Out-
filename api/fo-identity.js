import { getDb } from './_db.js'
import { authenticateRequest } from './_auth.js'
import { getOrCreateGuest, issueIdentitySession, resolveVerifiedIdentity, verifyGameCenterIdentity } from './_platformIdentity.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const db = getDb()
  try {
    if (req.body?.action === 'guest') {
      const result = await getOrCreateGuest(db, req.body.deviceUuid)
      return res.json({ ...result, session: await issueIdentitySession(db, result.player.player_id) })
    }
    if (req.body?.action !== 'game-center') return res.status(400).json({ error: 'Unsupported identity action' })
    const current = await authenticateRequest(db, req)
    const verified = await verifyGameCenterIdentity(req.body.identity)
    const resolved = await resolveVerifiedIdentity(db, { verified, currentPlayerId: current?.player_id, upgrade: Boolean(req.body.upgrade) })
    res.json({ ...resolved, session: await issueIdentitySession(db, resolved.playerId) })
  } catch (error) {
    res.status(error.status ?? 401).json({ error: error.message, code: error.code })
  }
}
