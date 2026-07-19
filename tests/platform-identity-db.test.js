import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { getOrCreateGuest, resolveVerifiedIdentity } from '../api/_platformIdentity.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview guest lifecycle, platform upgrade, duplicate link and conflict handling', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  const device = `identity-test-${suffix}`
  let guestId
  let otherId
  try {
    const first = await getOrCreateGuest(pool, device)
    guestId = first.player.player_id
    const returning = await getOrCreateGuest(pool, device)
    assert.equal(returning.player.player_id, guestId)
    assert.equal(returning.created, false)

    const verified = { provider: 'game_center', subject: `G:${suffix}`, metadata: { test: true } }
    const upgrade = await resolveVerifiedIdentity(pool, { verified, currentPlayerId: guestId, upgrade: true })
    const duplicate = await resolveVerifiedIdentity(pool, { verified, currentPlayerId: guestId, upgrade: true })
    assert.equal(upgrade.upgraded, true)
    assert.equal(duplicate.playerId, String(guestId))

    const other = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`identity-other-${suffix}@guest.invalid`])
    otherId = other.rows[0].player_id
    await assert.rejects(resolveVerifiedIdentity(pool, { verified, currentPlayerId: otherId, upgrade: true }), error => error.code === 'IDENTITY_CONFLICT')
    const switched = await resolveVerifiedIdentity(pool, { verified, currentPlayerId: otherId, upgrade: false })
    assert.equal(switched.playerId, String(guestId))
    assert.equal(switched.switched, true)
  } finally {
    if (guestId || otherId) await pool.query(`DELETE FROM fo_accounts WHERE player_id=ANY($1::uuid[])`, [[guestId, otherId].filter(Boolean)])
    await pool.end()
  }
})
