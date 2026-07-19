import crypto from 'node:crypto'
import { insertSession } from './_auth.js'

export const IDENTITY_PROVIDERS = Object.freeze(['game_center', 'play_games', 'apple', 'google', 'email_link'])

export function gameCenterPayload({ gamePlayerID, bundleID, timestamp, salt }) {
  if (!gamePlayerID || !bundleID || !Number.isSafeInteger(timestamp) || timestamp <= 0 || !salt) throw new Error('Invalid Game Center identity fields')
  const timestampBytes = Buffer.alloc(8)
  timestampBytes.writeBigUInt64BE(BigInt(timestamp))
  return Buffer.concat([Buffer.from(gamePlayerID, 'utf8'), Buffer.from(bundleID, 'utf8'), timestampBytes, Buffer.from(salt, 'base64')])
}

function validateAppleKeyUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'static.gc.apple.com') throw new Error('Untrusted Game Center public key URL')
  return url
}

async function fetchApplePublicKey(publicKeyUrl) {
  const url = validateAppleKeyUrl(publicKeyUrl)
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('Unable to retrieve Game Center public key')
  const certificate = new crypto.X509Certificate(Buffer.from(await response.arrayBuffer()))
  return certificate.publicKey
}

export async function verifyGameCenterIdentity(identity, { resolvePublicKey = fetchApplePublicKey, now = Date.now(), maxAgeMs = 10 * 60 * 1000 } = {}) {
  validateAppleKeyUrl(identity.publicKeyUrl)
  if (identity.bundleID !== 'uk.gizmogames.flipout') throw new Error('Unexpected Game Center bundle ID')
  if (Math.abs(now - identity.timestamp) > maxAgeMs) throw new Error('Expired Game Center identity signature')
  const key = await resolvePublicKey(identity.publicKeyUrl)
  const valid = crypto.verify('sha256', gameCenterPayload(identity), key, Buffer.from(identity.signature, 'base64'))
  if (!valid) throw new Error('Invalid Game Center identity signature')
  return { provider: 'game_center', subject: identity.gamePlayerID, metadata: { bundleID: identity.bundleID } }
}

export async function getOrCreateGuest(db, deviceUuid) {
  if (!deviceUuid) throw Object.assign(new Error('deviceUuid required'), { status: 400 })
  const existing = await db.query(`
    SELECT a.player_id,a.account_kind FROM fo_player_devices d JOIN fo_accounts a ON a.player_id=d.player_id
    WHERE d.device_uuid=$1`, [deviceUuid])
  if (existing.rowCount) return { player: existing.rows[0], created: false }
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const again = await client.query(`SELECT a.player_id,a.account_kind FROM fo_player_devices d JOIN fo_accounts a ON a.player_id=d.player_id WHERE d.device_uuid=$1`, [deviceUuid])
    if (again.rowCount) { await client.query('COMMIT'); return { player: again.rows[0], created: false } }
    const account = await client.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!platform-managed','guest') RETURNING player_id,account_kind`, [`guest-${crypto.randomUUID()}@guest.invalid`])
    await client.query(`INSERT INTO fo_player_devices(device_uuid,player_id) VALUES($1,$2)`, [deviceUuid, account.rows[0].player_id])
    await client.query('COMMIT')
    return { player: account.rows[0], created: true }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') return getOrCreateGuest(db, deviceUuid)
    throw error
  } finally { client.release() }
}

export async function resolveVerifiedIdentity(db, { verified, currentPlayerId = null, upgrade = false }) {
  if (!IDENTITY_PROVIDERS.includes(verified.provider)) throw Object.assign(new Error('Unsupported identity provider'), { status: 400 })
  const mapped = await db.query(`SELECT player_id FROM fo_account_identities WHERE provider=$1 AND provider_subject=$2`, [verified.provider, verified.subject])
  if (mapped.rowCount) {
    const mappedId = String(mapped.rows[0].player_id)
    if (upgrade && currentPlayerId && mappedId !== String(currentPlayerId)) throw Object.assign(new Error('Identity belongs to another account; switch without merging'), { status: 409, code: 'IDENTITY_CONFLICT' })
    return { playerId: mappedId, created: false, upgraded: false, switched: Boolean(currentPlayerId && mappedId !== String(currentPlayerId)) }
  }
  if (!currentPlayerId) {
    const created = await db.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!platform-managed','protected') RETURNING player_id`, [`${verified.provider}-${crypto.randomUUID()}@identity.invalid`])
    currentPlayerId = created.rows[0].player_id
  } else {
    const account = await db.query(`SELECT account_kind FROM fo_accounts WHERE player_id=$1`, [currentPlayerId])
    if (!account.rowCount) throw Object.assign(new Error('Current account not found'), { status: 404 })
    if (account.rows[0].account_kind === 'protected' && upgrade) throw Object.assign(new Error('Protected account cannot be merged automatically'), { status: 409, code: 'ACCOUNT_MERGE_BLOCKED' })
  }
  await db.query(`INSERT INTO fo_account_identities(provider,provider_subject,player_id,metadata) VALUES($1,$2,$3,$4)`, [verified.provider, verified.subject, currentPlayerId, verified.metadata ?? {}])
  await db.query(`UPDATE fo_accounts SET account_kind='protected',updated_at=NOW() WHERE player_id=$1`, [currentPlayerId])
  return { playerId: String(currentPlayerId), created: !upgrade, upgraded: Boolean(upgrade), switched: false }
}

export async function issueIdentitySession(db, playerId) {
  return insertSession(db, playerId)
}
