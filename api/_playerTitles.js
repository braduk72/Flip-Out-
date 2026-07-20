import { availablePlayerTitles, formatPlayerTitle, normaliseTitleSelection } from '../src/data/playerTitles.js'

export function playerTitleState({ profile = {}, inventory = [] } = {}) {
  const available = availablePlayerTitles(inventory)
  const selected = {
    prefixId: profile.selected_title_prefix_id ?? null,
    suffixId: profile.selected_title_suffix_id ?? null,
  }
  return {
    selected,
    display: formatPlayerTitle({
      playerName: profile.display_name ?? 'Player',
      ...selected,
    }),
    available,
  }
}

export async function setPlayerTitle(db, { playerId, prefixId = null, suffixId = null }) {
  const selected = normaliseTitleSelection({ prefixId, suffixId })
  const current = await db.query(
    `SELECT player_id, display_name, selected_title_prefix_id, selected_title_suffix_id
       FROM fo_accounts
      WHERE player_id=$1`,
    [playerId]
  )
  if (!current.rowCount) throw Object.assign(new Error('Account not found'), { status: 404, code: 'ACCOUNT_NOT_FOUND' })
  const inventory = await db.query(`SELECT item_id, quantity FROM fo_player_inventory WHERE player_id=$1 AND quantity > 0`, [playerId])
  const available = playerTitleState({ profile: current.rows[0], inventory: inventory.rows }).available
  if (selected.prefixId && !available.prefixes.some(title => title.id === selected.prefixId)) throw Object.assign(new Error('Title prefix is not owned'), { status: 403, code: 'TITLE_PREFIX_LOCKED' })
  if (selected.suffixId && !available.suffixes.some(title => title.id === selected.suffixId)) throw Object.assign(new Error('Title suffix is not owned'), { status: 403, code: 'TITLE_SUFFIX_LOCKED' })

  const updated = await db.query(
    `UPDATE fo_accounts
        SET selected_title_prefix_id=$2,
            selected_title_suffix_id=$3,
            updated_at=NOW()
      WHERE player_id=$1
      RETURNING player_id, display_name, selected_title_prefix_id, selected_title_suffix_id`,
    [playerId, selected.prefixId, selected.suffixId]
  )
  return playerTitleState({ profile: updated.rows[0], inventory: inventory.rows })
}

