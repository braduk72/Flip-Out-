import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { setInitialAvatar } from '../api/_avatars.js'

const enabled = Boolean(process.env.DATABASE_URL && process.env.VERCEL_ENV === 'preview')

test('Preview avatar onboarding persists an avatar ID once per account', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  let playerId
  try {
    const account = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind,display_name) VALUES($1,'!test','guest','AvatarTest') RETURNING player_id`, [`avatar-${suffix}@guest.invalid`])
    playerId = account.rows[0].player_id
    assert.deepEqual(await setInitialAvatar(pool, { playerId, avatarId: 'clash-badger' }), { avatarId: 'clash-badger', alreadySet: false })
    assert.deepEqual(await setInitialAvatar(pool, { playerId, avatarId: 'clash-badger' }), { avatarId: 'clash-badger', alreadySet: true })
    await assert.rejects(setInitialAvatar(pool, { playerId, avatarId: 'clash-blackhole' }), error => error.code === 'AVATAR_ALREADY_SET')
  } finally {
    if (playerId) await pool.query(`DELETE FROM fo_accounts WHERE player_id=$1`, [playerId])
    await pool.end()
  }
})
