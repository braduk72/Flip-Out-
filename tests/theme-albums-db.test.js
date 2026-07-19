import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { stickCardInThemeAlbum } from '../api/_themeAlbums.js'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.VERCEL_ENV === 'preview'

test('Preview Theme Album sticking is transactional, idempotent and account-isolated', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerOne
  let playerTwo
  try {
    const one = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`album-${suffix}@test.invalid`])
    const two = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`album-other-${suffix}@test.invalid`])
    playerOne = one.rows[0].player_id
    playerTwo = two.rows[0].player_id
    await pool.query(`INSERT INTO fo_player_inventory(player_id,item_id,quantity) VALUES($1,'card:cats:1',1),($1,'card:cats:2',1)`, [playerOne])

    const transactionId = `album-stick:${suffix}`
    const first = await stickCardInThemeAlbum(pool, { playerId: playerOne, transactionId, itemId: 'card:cats:1' })
    const retry = await stickCardInThemeAlbum(pool, { playerId: playerOne, transactionId, itemId: 'card:cats:1' })
    assert.equal(first.duplicate, false)
    assert.equal(retry.duplicate, true)
    assert.equal(retry.itemId, 'card:cats:1')

    const inventory = await pool.query(`SELECT quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id='card:cats:1'`, [playerOne])
    assert.equal(Number(inventory.rows[0].quantity), 0)
    const entries = await pool.query(`SELECT COUNT(*)::int AS count FROM fo_theme_album_entries WHERE player_id=$1 AND card_item_id='card:cats:1'`, [playerOne])
    assert.equal(entries.rows[0].count, 1)

    await assert.rejects(
      stickCardInThemeAlbum(pool, { playerId: playerTwo, transactionId, itemId: 'card:cats:1' }),
      error => error.code === 'THEME_ALBUM_ACCOUNT_CONFLICT',
    )
    await assert.rejects(
      stickCardInThemeAlbum(pool, { playerId: playerOne, transactionId, itemId: 'card:cats:2' }),
      error => error.code === 'THEME_ALBUM_IDEMPOTENCY_CONFLICT',
    )
    await assert.rejects(
      stickCardInThemeAlbum(pool, { playerId: playerOne, transactionId: `album-stick-slot:${suffix}`, itemId: 'card:cats:1' }),
      error => error.code === 'THEME_ALBUM_SLOT_FILLED',
    )
  } finally {
    try {
      for (const playerId of [playerOne, playerTwo].filter(Boolean)) {
        await pool.query(`DELETE FROM fo_rate_limits WHERE player_id=$1`, [playerId])
        await pool.query(`DELETE FROM fo_player_inventory WHERE player_id=$1`, [playerId])
      }
    } finally { await pool.end() }
  }
})
