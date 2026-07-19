import crypto from 'node:crypto'

const SESSION_DAYS = 30

export function normaliseEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('A valid email is required')
  return email
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  if (typeof password !== 'string' || password.length < 10) throw new Error('Password must be at least 10 characters')
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':')
  if (!salt || !expected) return false
  const actual = crypto.scryptSync(password, salt, 64)
  const expectedBuffer = Buffer.from(expected, 'hex')
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer)
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export async function insertSession(db, playerId, now = new Date()) {
  const token = createSessionToken()
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86400000)
  await db.query(
    `INSERT INTO fo_player_sessions (session_hash, player_id, expires_at) VALUES ($1, $2, $3)`,
    [hashSessionToken(token), playerId, expiresAt]
  )
  return { token, expiresAt: expiresAt.toISOString() }
}

export async function authenticateRequest(db, req) {
  const authorization = req.headers?.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  if (!match) return null
  const result = await db.query(
    `SELECT p.player_id, p.email
       FROM fo_player_sessions s JOIN fo_accounts p ON p.player_id = s.player_id
      WHERE s.session_hash = $1 AND s.expires_at > NOW()`,
    [hashSessionToken(match[1])]
  )
  return result.rows[0] ?? null
}

export async function requirePlayer(db, req, res) {
  const player = await authenticateRequest(db, req)
  if (!player) res.status(401).json({ error: 'Authentication required' })
  return player
}

export async function requireProtectedPlayer(db, req, res) {
  const player = await authenticateRequest(db, req)
  if (!player) { res.status(401).json({ error: 'Authentication required' }); return null }
  const kind = await db.query(`SELECT account_kind FROM fo_accounts WHERE player_id=$1`, [player.player_id])
  if (kind.rows[0]?.account_kind !== 'protected') { res.status(403).json({ error: 'Protected identity required' }); return null }
  return player
}

export async function linkDevice(db, { playerId, deviceUuid }) {
  if (!deviceUuid) throw new Error('deviceUuid required')
  const result = await db.query(
    `INSERT INTO fo_player_devices (device_uuid, player_id) VALUES ($1, $2)
     ON CONFLICT (device_uuid) DO UPDATE SET player_id = fo_player_devices.player_id
     RETURNING player_id`,
    [deviceUuid, playerId]
  )
  if (String(result.rows[0].player_id) !== String(playerId)) throw Object.assign(new Error('Device belongs to another account'), { status: 409 })
  return { linked: true, playerId }
}
