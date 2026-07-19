import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { claimDailyWheel } from '../api/_gameServices.js'
import { createListing, openPlayerLockbox, settleListing } from '../api/_operations.js'
import { recordAuthorizedCoinGrant } from '../api/_coinLedger.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview wheel, lockbox and marketplace settlement are atomic and retry-safe', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  const ids = []
  let sellerId, buyerA, buyerB, listingId
  try {
    for (const [kind, label] of [['protected', 'seller'], ['protected', 'buyer-a'], ['protected', 'buyer-b']]) {
      const row = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test',$2) RETURNING player_id`, [`services-${label}-${suffix}@test.invalid`, kind])
      ids.push(row.rows[0].player_id)
    }
    ;[sellerId, buyerA, buyerB] = ids
    await recordAuthorizedCoinGrant(pool, { accountId: buyerA, amount: 1000, transactionId: `purchase:${suffix}:a`, transactionType: 'purchase', sourceReferenceId: `stripe:${suffix}:a` })
    await recordAuthorizedCoinGrant(pool, { accountId: buyerB, amount: 1000, transactionId: `purchase:${suffix}:b`, transactionType: 'purchase', sourceReferenceId: `stripe:${suffix}:b` })
    await pool.query(`INSERT INTO fo_player_inventory(player_id,item_id,quantity) VALUES($1,'card:cats:1',2),($1,'inventory:lockbox:standard',1),($1,'inventory:key:standard',1)`, [sellerId])

    const wheel = await claimDailyWheel(pool, { playerId: buyerA, spinType: 'free', timeZone: 'Europe/London' })
    const wheelRetry = await claimDailyWheel(pool, { playerId: buyerA, spinType: 'free', timeZone: 'Europe/London' })
    assert.equal(wheel.duplicate, false)
    assert.equal(wheelRetry.duplicate, true)
    assert.deepEqual(wheelRetry.reward, wheel.reward)

    const openingId = `opening:${suffix}`
    const opening = await openPlayerLockbox(pool, { playerId: sellerId, openingId })
    const openingRetry = await openPlayerLockbox(pool, { playerId: sellerId, openingId })
    assert.equal(opening.duplicate, false)
    assert.equal(openingRetry.duplicate, true)
    assert.deepEqual(openingRetry.reward, opening.reward)

    const listing = await createListing(pool, { playerId: sellerId, itemId: 'card:cats:1', quantity: 1, priceCoins: 101 })
    listingId = listing.listingId
    const attempts = await Promise.allSettled([
      settleListing(pool, { playerId: buyerA, listingId, requestId: `buy-a:${suffix}` }),
      settleListing(pool, { playerId: buyerB, listingId, requestId: `buy-b:${suffix}` }),
    ])
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1)
    const settled = attempts.find(result => result.status === 'fulfilled').value
    assert.deepEqual({ gross: settled.grossCoins, fee: settled.feeCoins, net: settled.netCoins }, { gross: 101, fee: 10, net: 91 })
    const listingRow = await pool.query(`SELECT status,buyer_id,fee_coins,net_coins FROM fo_market_listings WHERE listing_id=$1`, [listingId])
    assert.equal(listingRow.rows[0].status, 'sold')
    assert.equal(Number(listingRow.rows[0].fee_coins), 10)
  } finally {
    try {
      if (listingId) await pool.query(`DELETE FROM fo_market_listings WHERE listing_id=$1`, [listingId])
      if (ids.length) {
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=ANY($1::uuid[])`, [ids])
        await pool.query(`DELETE FROM fo_lockbox_openings WHERE player_id=ANY($1::uuid[])`, [ids])
        await pool.query(`DELETE FROM fo_reward_claims WHERE player_id=ANY($1::uuid[])`, [ids])
        await pool.query(`DELETE FROM fo_daily_actions WHERE player_id=ANY($1::uuid[])`, [ids])
        await pool.query(`DELETE FROM fo_player_transactions WHERE player_id=ANY($1::uuid[])`, [ids])
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=ANY($1::uuid[])`, [ids])
        // Coin-ledger accounts remain as immutable, uniquely named Preview audit fixtures.
      }
    } finally { await pool.end() }
  }
})
