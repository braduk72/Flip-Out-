import { getDb } from './_db.js'
import { requirePlayer } from './_auth.js'

const CURRENT_SAVE_VERSION = 1
const ALLOWED_KEYS = new Set(['progression', 'settings', 'selectedDeck', 'selectedPortrait', 'gameplayStats'])

function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw Object.assign(new Error('Invalid save state'), { status: 400 })
  const keys = Object.keys(state)
  if (keys.some(key => !ALLOWED_KEYS.has(key))) throw Object.assign(new Error('Save contains unsupported fields'), { status: 400 })
  if (JSON.stringify(state).length > 100000) throw Object.assign(new Error('Save is too large'), { status: 413 })
  return state
}

export default async function handler(req, res) {
  const db = getDb()
  try {
    const player = await requirePlayer(db, req, res)
    if (!player) return
    if (req.method === 'GET') {
      const cloud = await db.query(`SELECT save_version,revision,state,updated_at FROM fo_cloud_saves WHERE player_id=$1`, [player.player_id])
      return res.json({ cloud: cloud.rows[0] ?? null, currentVersion: CURRENT_SAVE_VERSION })
    }
    if (req.method !== 'POST') return res.status(405).end()
    const state = validateState(req.body?.state)
    const expectedRevision = Number(req.body?.expectedRevision ?? 0)
    const saveVersion = Number(req.body?.saveVersion ?? CURRENT_SAVE_VERSION)
    if (saveVersion !== CURRENT_SAVE_VERSION) return res.status(409).json({ error: 'Save migration required', code: 'SAVE_VERSION_MISMATCH', currentVersion: CURRENT_SAVE_VERSION })
    const result = await db.query(
      `INSERT INTO fo_cloud_saves(player_id,save_version,revision,state) VALUES($1,$2,1,$3)
       ON CONFLICT(player_id) DO UPDATE SET save_version=$2,revision=fo_cloud_saves.revision+1,state=$3,updated_at=NOW()
       WHERE fo_cloud_saves.revision=$4
       RETURNING save_version,revision,state,updated_at`,
      [player.player_id, saveVersion, state, expectedRevision]
    )
    if (!result.rowCount) {
      const cloud = await db.query(`SELECT save_version,revision,state,updated_at FROM fo_cloud_saves WHERE player_id=$1`, [player.player_id])
      return res.status(409).json({ error: 'Cloud save is newer', code: 'STALE_SAVE', cloud: cloud.rows[0] })
    }
    res.json({ cloud: result.rows[0] })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message, code: error.code }) }
}
