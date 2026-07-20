import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { recordAuthorizedCoinGrant } from '../api/_coinLedger.js'
import { addCardToPersonalAlbum, createPersonalAlbum, removeCardFromPersonalAlbum } from '../api/_personalAlbums.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview' && Boolean(process.env.COIN_LEDGER_HMAC_SECRET)

test('Preview Personal Albums charge once and organise Inventory cards without binding them', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`personal-album-${suffix}@test.invalid`])
    playerId = account.rows[0].player_id
    await recordAuthorizedCoinGrant(pool, { accountId: playerId, amount: 1000, transactionId: `purchase:personal-album:${suffix}`, transactionType: 'purchase', sourceReferenceId: `stripe:personal-album:${suffix}` })
    await pool.query(`INSERT INTO fo_player_inventory(player_id,item_id,quantity) VALUES($1,'card:cats:1',1)`, [playerId])

    const transactionId = `personal-album:${suffix}`
    const created = await createPersonalAlbum(pool, { playerId, transactionId, name: 'Black Cats' })
    const retry = await createPersonalAlbum(pool, { playerId, transactionId, name: 'Black   Cats' })
    assert.equal(created.duplicate, false)
    assert.equal(retry.duplicate, true)
    assert.equal(retry.albumId, created.albumId)

    const balance = await pool.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='coins'`, [playerId])
    assert.equal(Number(balance.rows[0].balance), 500)

    const added = await addCardToPersonalAlbum(pool, { playerId, albumId: created.albumId, itemId: 'card:cats:1' })
    const addedRetry = await addCardToPersonalAlbum(pool, { playerId, albumId: created.albumId, itemId: 'card:cats:1' })
    assert.equal(added.added, true)
    assert.equal(addedRetry.duplicate, true)
    const inventory = await pool.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id='card:cats:1'`, [playerId])
    assert.equal(Number(inventory.rows[0].quantity), 1)

    const removed = await removeCardFromPersonalAlbum(pool, { playerId, albumId: created.albumId, itemId: 'card:cats:1' })
    const removedRetry = await removeCardFromPersonalAlbum(pool, { playerId, albumId: created.albumId, itemId: 'card:cats:1' })
    assert.equal(removed.removed, true)
    assert.equal(removedRetry.removed, false)
    await assert.rejects(createPersonalAlbum(pool, { playerId, transactionId, name: 'Cute Animals' }), error => error.code === 'PERSONAL_ALBUM_IDEMPOTENCY_CONFLICT')
  } finally {
    try {
      if (playerId) {
        await pool.query(`DELETE FROM fo_personal_album_cards WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_personal_albums WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_personal_album_transactions WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId]).catch(() => {})
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId]).catch(() => {})
      }
    } finally { await pool.end() }
  }
})
