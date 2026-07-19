import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'
import { annualChoice } from './_progressionRules.js'
import { ITEM_CATALOG } from '../src/data/itemCatalog.js'

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') {
      const [challenges, progress, events] = await Promise.all([
        db.query(`SELECT challenge_id,cadence,event_type,target,reward,starts_at,ends_at FROM fo_challenge_definitions WHERE enabled AND NOW() BETWEEN starts_at AND ends_at ORDER BY ends_at`),
        db.query(`SELECT challenge_id,progress,claim_id,updated_at FROM fo_challenge_progress WHERE player_id=$1`, [player.player_id]),
        db.query(`SELECT event_id,stage_id,progress,claimed_at,updated_at FROM fo_event_progress WHERE player_id=$1`, [player.player_id]),
      ])
      return res.json({ challenges: challenges.rows, progress: progress.rows, events: events.rows })
    }
    if (req.method !== 'POST') return res.status(405).end()
    const body = req.body ?? {}
    if (body.action === 'claim-challenge') {
      const client = await db.connect()
      try {
        await client.query('BEGIN')
        await enforceRateLimit(client, { playerId: player.player_id, action: 'challenge-claim', limit: 20 })
        const row = await client.query(`SELECT d.challenge_id,d.target,d.reward,p.progress,p.claim_id FROM fo_challenge_definitions d JOIN fo_challenge_progress p ON p.challenge_id=d.challenge_id AND p.player_id=$1 WHERE d.challenge_id=$2 AND d.enabled AND NOW() BETWEEN d.starts_at AND d.ends_at FOR UPDATE OF p`, [player.player_id, body.challengeId])
        if (!row.rowCount || Number(row.rows[0].progress) < Number(row.rows[0].target)) throw Object.assign(new Error('Challenge is not claimable'), { status: 409 })
        const claimId = `challenge:${body.challengeId}:${player.player_id}`
        if (row.rows[0].claim_id) { await client.query('COMMIT'); return res.json({ duplicate: true, claimId }) }
        await applyReward(client, { playerId: player.player_id, transactionId: claimId, source: 'challenge-reward', reward: row.rows[0].reward })
        await client.query(`UPDATE fo_challenge_progress SET claim_id=$3,updated_at=NOW() WHERE player_id=$1 AND challenge_id=$2`, [player.player_id, body.challengeId, claimId])
        await client.query('COMMIT')
        return res.json({ duplicate: false, claimId, reward: row.rows[0].reward })
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }
    if (body.action === 'annual-choice') {
      const decision = annualChoice(ITEM_CATALOG, Number(body.eventYear), body.itemId)
      if (!decision.allowed) return res.status(400).json({ error: 'Item is not eligible for this annual choice' })
      const client = await db.connect()
      try {
        await client.query('BEGIN')
        const inserted = await client.query(`INSERT INTO fo_choice_claims(entitlement_id,player_id,event_id,item_id) SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM fo_event_progress WHERE player_id=$2 AND event_id=$3 AND stage_id='choice-box' AND progress>=1) ON CONFLICT DO NOTHING RETURNING entitlement_id`, [body.entitlementId, player.player_id, `annual:${body.eventYear}`, body.itemId])
        if (!inserted.rowCount) throw Object.assign(new Error('Choice entitlement unavailable or already claimed'), { status: 409 })
        await applyReward(client, { playerId: player.player_id, transactionId: `annual-choice:${body.entitlementId}`, source: 'annual-choice', reward: { itemId: body.itemId, amount: 1 }, metadata: { eventYear: body.eventYear } })
        await client.query('COMMIT')
        return res.json({ item: decision.item, entitlementId: body.entitlementId })
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    }
    return res.status(400).json({ error: 'Invalid live-ops action' })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
