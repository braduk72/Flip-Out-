import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import pg from 'pg'
import { setInitialDisplayName } from '../api/_nickname.js'

const enabled = Boolean(process.env.DATABASE_URL && process.env.VERCEL_ENV === 'preview')

test('Preview nickname onboarding persists one non-unique display name per account', { skip: !enabled }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  const suffix = crypto.randomUUID()
  const playerIds = []
  try {
    for (const label of ['a', 'b']) {
      const result = await pool.query(`INSERT INTO fo_accounts(email,password_hash,account_kind) VALUES($1,'!test','guest') RETURNING player_id`, [`nickname-${label}-${suffix}@guest.invalid`])
      playerIds.push(result.rows[0].player_id)
    }
    const first = await setInitialDisplayName(pool, { playerId: playerIds[0], displayName: 'Brad' })
    const duplicateDisplayName = await setInitialDisplayName(pool, { playerId: playerIds[1], displayName: 'Brad' })
    const retry = await setInitialDisplayName(pool, { playerId: playerIds[0], displayName: 'Brad' })
    assert.deepEqual(first, { displayName: 'Brad', alreadySet: false })
    assert.deepEqual(duplicateDisplayName, { displayName: 'Brad', alreadySet: false })
    assert.deepEqual(retry, { displayName: 'Brad', alreadySet: true })
    await assert.rejects(setInitialDisplayName(pool, { playerId: playerIds[0], displayName: 'OtherName' }), error => error.code === 'DISPLAY_NAME_ALREADY_SET')
  } finally {
    if (playerIds.length) await pool.query(`DELETE FROM fo_accounts WHERE player_id=ANY($1::uuid[])`, [playerIds])
    await pool.end()
  }
})

