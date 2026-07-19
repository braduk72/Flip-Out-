import { ONBOARDING_AVATARS, getAvatarById, isCuratedAvatarId } from '../src/data/avatarCatalog.js'

export function validateAvatarId(value) {
  const avatarId = String(value ?? '')
  if (!isCuratedAvatarId(avatarId)) throw Object.assign(new Error('That avatar is unavailable'), { status: 400, code: 'INVALID_AVATAR' })
  const avatar = getAvatarById(avatarId)
  return avatar.id
}

export async function setInitialAvatar(db, { playerId, avatarId }) {
  const safeAvatarId = validateAvatarId(avatarId)
  const result = await db.query(
    `UPDATE fo_accounts
        SET selected_avatar_id=$2, updated_at=NOW()
      WHERE player_id=$1 AND selected_avatar_id IS NULL
      RETURNING player_id, selected_avatar_id`,
    [playerId, safeAvatarId],
  )
  if (result.rowCount) return { avatarId: result.rows[0].selected_avatar_id, alreadySet: false }

  const existing = await db.query(`SELECT selected_avatar_id FROM fo_accounts WHERE player_id=$1`, [playerId])
  if (!existing.rowCount) throw Object.assign(new Error('Account not found'), { status: 404 })
  if (existing.rows[0].selected_avatar_id === safeAvatarId) return { avatarId: safeAvatarId, alreadySet: true }
  throw Object.assign(new Error('Avatar has already been chosen'), { status: 409, code: 'AVATAR_ALREADY_SET' })
}

export { ONBOARDING_AVATARS }
