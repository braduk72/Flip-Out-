const RESERVED_NAMES = new Set([
  'admin', 'administrator', 'moderator', 'system', 'support', 'developer', 'flipout', 'official',
])

// Kept deliberately small and server-side. This is a first-line public-name filter,
// not a replacement for future player-reporting and moderation tooling.
const PROFANE_NAMES = new Set([
  'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fag', 'fuck', 'motherfucker', 'nigger', 'piss', 'porn', 'sex', 'shit', 'slut', 'twat', 'whore',
])

export function validateDisplayName(value) {
  const displayName = String(value ?? '')
  if (!/^[A-Za-z0-9]{3,12}$/.test(displayName)) {
    throw Object.assign(new Error('Nickname must be 3–12 letters or numbers with no spaces or punctuation'), { status: 400, code: 'INVALID_DISPLAY_NAME' })
  }
  const normalised = displayName.toLowerCase()
  if (RESERVED_NAMES.has(normalised)) throw Object.assign(new Error('That nickname is reserved'), { status: 400, code: 'RESERVED_DISPLAY_NAME' })
  if (PROFANE_NAMES.has(normalised)) throw Object.assign(new Error('That nickname is not allowed'), { status: 400, code: 'PROFANE_DISPLAY_NAME' })
  return displayName
}

export async function setInitialDisplayName(db, { playerId, displayName }) {
  const safeDisplayName = validateDisplayName(displayName)
  const result = await db.query(
    `UPDATE fo_accounts
        SET display_name=$2, updated_at=NOW()
      WHERE player_id=$1 AND display_name IS NULL
      RETURNING player_id, display_name`,
    [playerId, safeDisplayName],
  )
  if (result.rowCount) return { displayName: result.rows[0].display_name, alreadySet: false }

  const existing = await db.query(`SELECT display_name FROM fo_accounts WHERE player_id=$1`, [playerId])
  if (!existing.rowCount) throw Object.assign(new Error('Account not found'), { status: 404 })
  if (existing.rows[0].display_name === safeDisplayName) return { displayName: safeDisplayName, alreadySet: true }
  throw Object.assign(new Error('Nickname has already been chosen'), { status: 409, code: 'DISPLAY_NAME_ALREADY_SET' })
}

