import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import pg from 'pg'
import { recycleDuplicateCards } from '../api/_recycler.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview recycler preserves last copies and is atomic, concurrent and idempotent', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const suffix = crypto.randomUUID()
  const players = []
  try {
    for (const label of ['owner', 'other', 'last-copy']) {
      const row = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`recycler-${label}-${suffix}@test.invalid`])
      players.push(row.rows[0].player_id)
    }
    const [owner, other, lastCopy] = players
    await pool.query(`INSERT INTO fo_player_inventory(player_id,item_id,quantity,bound_quantity) VALUES($1,'card:cats:1',3,0),($1,'card:cats:2',4,0),($2,'card:cats:1',6,0),($3,'card:cats:1',1,0)`, [owner, other, lastCopy])
    const transactionId = `recycle:${suffix}`
    const input = { transactionId, recipeId: 'common-stars-v1', items: [{ itemId: 'card:cats:1', quantity: 2 }, { itemId: 'card:cats:2', quantity: 3 }] }
    const attempts = await Promise.all([
      recycleDuplicateCards(pool, { playerId: owner, ...input }),
      recycleDuplicateCards(pool, { playerId: owner, ...input }),
    ])
    assert.equal(attempts.filter(result => !result.duplicate).length, 1)
    assert.equal(attempts.filter(result => result.duplicate).length, 1)
    assert.equal(attempts[0].reward.amount, 1)
    const inventory = await pool.query(`SELECT item_id,quantity FROM fo_player_inventory WHERE player_id=$1 ORDER BY item_id`, [owner])
    assert.deepEqual(inventory.rows.map(row => [row.item_id, Number(row.quantity)]), [['card:cats:1', 1], ['card:cats:2', 1]])
    const balance = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='stars'`, [owner])
    assert.equal(Number(balance.rows[0].balance), 1)
    const receipt = await pool.query(`SELECT cards_consumed,batches,reward FROM fo_recycler_transactions WHERE transaction_id=$1`, [transactionId])
    assert.equal(Number(receipt.rows[0].cards_consumed), 5)
    assert.equal(Number(receipt.rows[0].batches), 1)

    await assert.rejects(
      recycleDuplicateCards(pool, { playerId: owner, transactionId, recipeId: 'common-stars-v1', items: [{ itemId: 'card:cats:1', quantity: 5 }] }),
      error => error.code === 'RECYCLER_IDEMPOTENCY_CONFLICT',
    )
    await assert.rejects(
      recycleDuplicateCards(pool, { playerId: other, ...input }),
      error => error.code === 'RECYCLER_ACCOUNT_CONFLICT',
    )
    await assert.rejects(
      recycleDuplicateCards(pool, { playerId: lastCopy, transactionId: `recycle:last:${suffix}`, recipeId: 'common-stars-v1', items: [{ itemId: 'card:cats:1', quantity: 5 }] }),
      error => error.code === 'RECYCLER_LAST_COPY',
    )
  } finally {
    try {
      if (players.length) await pool.query(`DELETE FROM fo_accounts WHERE player_id=ANY($1::uuid[])`, [players])
    } finally { await pool.end() }
  }
})
