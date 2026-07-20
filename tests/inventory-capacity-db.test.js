import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { applyReward } from '../api/_gameServices.js'
import { getInventoryCapacityState } from '../api/_inventoryCapacity.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview Inventory capacity blocks over-capacity card grants but permits non-card items', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  const client = await pool.connect()
  try {
    const account = await client.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`capacity-${suffix}@test.invalid`])
    playerId = account.rows[0].player_id
    await client.query(`INSERT INTO fo_player_inventory_settings(player_id,card_capacity) VALUES($1,1)`, [playerId])
    await client.query(`INSERT INTO fo_player_inventory(player_id,item_id,quantity) VALUES($1,'card:cats:1',1)`, [playerId])
    assert.deepEqual(await getInventoryCapacityState(client, playerId), { cardCapacity: 1, cardCount: 1, remainingCardSlots: 0 })

    await client.query('BEGIN')
    await assert.rejects(
      applyReward(client, { playerId, transactionId: `capacity-card:${suffix}`, source: 'capacity-test', reward: { itemId: 'card:cats:2', amount: 1 } }),
      error => error.code === 'INVENTORY_CAPACITY_EXCEEDED',
    )
    await client.query('ROLLBACK')

    await client.query('BEGIN')
    await applyReward(client, { playerId, transactionId: `capacity-key:${suffix}`, source: 'capacity-test', reward: { itemId: 'inventory:key:standard', amount: 1 } })
    await client.query('COMMIT')
    const inventory = await client.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id='inventory:key:standard'`, [playerId])
    assert.equal(Number(inventory.rows[0].quantity), 1)

    await client.query('BEGIN')
    const retry = await applyReward(client, { playerId, transactionId: `capacity-key:${suffix}`, source: 'capacity-test', reward: { itemId: 'inventory:key:standard', amount: 1 } })
    await client.query('COMMIT')
    assert.deepEqual({ applied: retry.applied, duplicate: retry.duplicate }, { applied: false, duplicate: true })
  } finally {
    client.release()
    try {
      if (playerId) {
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_transactions WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory_settings WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_accounts WHERE player_id=$1`, [playerId]).catch(() => {})
      }
    } finally { await pool.end() }
  }
})

test('Preview Inventory capacity serialises concurrent duplicate card grants', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`capacity-concurrent-${suffix}@test.invalid`])
    playerId = account.rows[0].player_id
    await pool.query(`INSERT INTO fo_player_inventory_settings(player_id,card_capacity) VALUES($1,1)`, [playerId])

    async function grant(transactionId, itemId) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await applyReward(client, { playerId, transactionId, source: 'capacity-concurrent-test', reward: { itemId, amount: 1 } })
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        throw error
      } finally {
        client.release()
      }
    }

    const results = await Promise.allSettled([
      grant(`capacity-concurrent-a:${suffix}`, 'card:cats:1'),
      grant(`capacity-concurrent-b:${suffix}`, 'card:cats:2'),
    ])
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(results.filter(result => result.status === 'rejected' && result.reason.code === 'INVENTORY_CAPACITY_EXCEEDED').length, 1)
    assert.deepEqual(await getInventoryCapacityState(pool, playerId), { cardCapacity: 1, cardCount: 1, remainingCardSlots: 0 })
  } finally {
    try {
      if (playerId) {
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_transactions WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory_settings WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_accounts WHERE player_id=$1`, [playerId]).catch(() => {})
      }
    } finally { await pool.end() }
  }
})
