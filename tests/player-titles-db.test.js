import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { getPlayerState } from '../api/_playerState.js'
import { setPlayerTitle } from '../api/_playerTitles.js'

const enabled = Boolean(process.env.DATABASE_URL && process.env.VERCEL_ENV === 'preview')

test('Preview player titles persist on account profile and hydrate player state', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind,display_name) VALUES($1,'!test','guest','Brad') RETURNING player_id`, [`title-${suffix}@guest.invalid`])
    playerId = account.rows[0].player_id

    const saved = await setPlayerTitle(pool, { playerId, prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' })
    assert.equal(saved.display, 'Captain Brad the Magnificent')
    assert.deepEqual(saved.selected, { prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' })

    const state = await getPlayerState(pool, playerId)
    assert.equal(state.profile.selected_title_prefix_id, 'title:prefix:captain')
    assert.equal(state.profile.selected_title_suffix_id, 'title:suffix:the-magnificent')
    assert.equal(state.playerTitles.display, 'Captain Brad the Magnificent')
  } finally {
    if (playerId) await pool.query(`DELETE FROM fo_accounts WHERE player_id=$1`, [playerId])
    await pool.end()
  }
})

