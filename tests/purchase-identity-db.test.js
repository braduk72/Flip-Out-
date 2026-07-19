import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { linkLegacyTestPurchases, purchasePayload, recordPurchaseGrant } from '../api/_economy.js'
import { resolveVerifiedIdentity } from '../api/_platformIdentity.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview account purchase ownership and legacy linking lifecycle', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  const device = `purchase-device-${suffix}`
  const legacyDevice = `legacy-device-${suffix}`
  const sessions = [`cs_guest_${suffix}`, `cs_platform_${suffix}`, `cs_legacy_${suffix}`]
  let guestId
  let otherId
  try {
    const guest = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`purchase-guest-${suffix}@guest.invalid`])
    const other = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','protected') RETURNING player_id`, [`purchase-other-${suffix}@identity.invalid`])
    guestId = guest.rows[0].player_id
    otherId = other.rows[0].player_id
    await pool.query(`INSERT INTO fo_player_devices(device_uuid,player_id) VALUES($1,$2),($3,$2)`, [device, guestId, legacyDevice])

    const payload = purchasePayload({ productId: 'coins_100', productType: 'coins', coins: 100 })
    const first = await recordPurchaseGrant(pool, { stripeSessionId: sessions[0], playerId: guestId, deviceUuid: device, payload })
    const repeated = await recordPurchaseGrant(pool, { stripeSessionId: sessions[0], playerId: guestId, deviceUuid: device, payload })
    assert.equal(first.inserted, true)
    assert.equal(repeated.inserted, false)
    await assert.rejects(recordPurchaseGrant(pool, { stripeSessionId: sessions[0], playerId: otherId, deviceUuid: device, payload }), error => error.code === 'PURCHASE_ACCOUNT_MISMATCH')

    await resolveVerifiedIdentity(pool, { verified: { provider: 'game_center', subject: `G:${suffix}` }, currentPlayerId: guestId, upgrade: true })
    const owned = await pool.query(`SELECT player_id FROM fo_economy_transactions WHERE transaction_id=$1`, [`purchase:${sessions[0]}`])
    assert.equal(String(owned.rows[0].player_id), String(guestId))

    await recordPurchaseGrant(pool, { stripeSessionId: sessions[1], playerId: guestId, deviceUuid: device, payload })
    await pool.query(`INSERT INTO fo_purchases(device_uuid,stripe_session_id,product_id,product_type,coins_granted,decks_granted,extras_granted,pence,status,completed_at) VALUES($1,$2,'coins_100','coins',100,ARRAY[]::text[],'{}',99,'completed',NOW())`, [legacyDevice, sessions[2]])
    await pool.query(`INSERT INTO fo_economy_transactions(transaction_id,device_uuid,source,payload) VALUES($1,$2,'purchase',$3)`, [`purchase:${sessions[2]}`, legacyDevice, payload])
    const linked = await linkLegacyTestPurchases(pool, { playerId: guestId, deviceUuid: legacyDevice, preview: true })
    const retry = await linkLegacyTestPurchases(pool, { playerId: guestId, deviceUuid: legacyDevice, preview: true })
    assert.equal(linked.linked, 1)
    assert.equal(retry.duplicate, true)
    const restored = await pool.query(`SELECT transaction_id FROM fo_economy_transactions WHERE player_id=$1 AND source='purchase' ORDER BY transaction_id`, [guestId])
    assert.deepEqual(restored.rows.map(row => row.transaction_id).sort(), sessions.map(id => `purchase:${id}`).sort())
  } finally {
    try {
      await pool.query(`DELETE FROM fo_economy_transactions WHERE transaction_id=ANY($1::text[])`, [sessions.map(id => `purchase:${id}`)])
      await pool.query(`DELETE FROM fo_purchases WHERE stripe_session_id=ANY($1::text[])`, [sessions])
      if (guestId || otherId) {
        const playerIds = [guestId, otherId].filter(Boolean)
        await pool.query(`DELETE FROM fo_account_identities WHERE player_id=ANY($1::uuid[])`, [playerIds])
        await pool.query(`DELETE FROM fo_player_devices WHERE player_id=ANY($1::uuid[])`, [playerIds])
        // Purchase-ledger accounts remain as immutable, uniquely named Preview audit fixtures.
      }
    } finally {
      await pool.end()
    }
  }
})
