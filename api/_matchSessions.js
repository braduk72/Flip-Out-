import crypto from 'node:crypto'
import { DECKS } from '../src/data/decks.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'
import { applyMatchEvent, createRegularMatchState, DIFFICULTY_PAIRS, MATCH_RULES_VERSION, publicMatchState, stateHash } from './_matchRules.js'

function deckCardIds(deck) {
  const start = deck.cardStart ?? 1
  return Array.from({ length: deck.cardCount }, (_, offset) => `card:${deck.id}:${start + offset}`)
}

async function audit(client, playerId, action, outcome, metadata) {
  await client.query(`INSERT INTO fo_economy_audit(player_id,action,outcome,metadata) VALUES($1,$2,$3,$4)`, [playerId, action, outcome, metadata])
}

export async function createMatchSession(db, { playerId, mode = 'vs', difficulty = 'Medium', deckId }) {
  const deck = DECKS.find(candidate => candidate.id === deckId)
  if (!deck) throw Object.assign(new Error('Unknown deck'), { status: 400 })
  if (!['vs', 'solo', 'local', 'gauntlet', 'season'].includes(mode)) throw Object.assign(new Error('Unsupported match mode'), { status: 400 })
  const pairCount = DIFFICULTY_PAIRS[difficulty]
  if (!pairCount) throw Object.assign(new Error('Unsupported difficulty'), { status: 400 })
  const matchId = `match:${crypto.randomUUID()}`
  const state = createRegularMatchState({ pairCount, cardIds: deckCardIds(deck) })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'match-create', limit: 20 })
    await client.query(`INSERT INTO fo_matches(match_id,player_id,state,status,rules_version,mode,difficulty,deck_id,sequence) VALUES($1,$2,$3,'active',$4,$5,$6,$7,0)`, [matchId, playerId, state, MATCH_RULES_VERSION, mode, difficulty, deckId])
    await audit(client, playerId, 'match-create', 'accepted', { matchId, mode, difficulty, deckId, rulesVersion: MATCH_RULES_VERSION })
    await client.query('COMMIT')
    return { matchId, sequence: 0, state: publicMatchState(state) }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function getMatchSession(db, { playerId, matchId }) {
  const match = await db.query(`SELECT match_id,state,status,sequence,rules_version,mode,difficulty,deck_id,advert_continue_used,coin_continue_used,updated_at FROM fo_matches WHERE match_id=$1 AND player_id=$2 AND expires_at>NOW()`, [matchId, playerId])
  if (!match.rowCount) throw Object.assign(new Error('Match not found'), { status: 404 })
  return { ...match.rows[0], state: publicMatchState(match.rows[0].state) }
}

export async function recordMatchEvent(db, { playerId, matchId, eventId, sequence, event }) {
  if (!/^event:[a-z0-9-]{8,100}$/i.test(String(eventId ?? ''))) throw Object.assign(new Error('Invalid event id'), { status: 400 })
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw Object.assign(new Error('Invalid sequence'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'match-event', limit: 120 })
    const duplicate = await client.query(`SELECT match_id,sequence,payload FROM fo_match_events WHERE event_id=$1`, [eventId])
    if (duplicate.rowCount) {
      if (duplicate.rows[0].match_id !== matchId) throw Object.assign(new Error('Event belongs to another match'), { status: 403 })
      const current = await client.query(`SELECT state,sequence,status FROM fo_matches WHERE match_id=$1 AND player_id=$2`, [matchId, playerId])
      await client.query('COMMIT')
      return { duplicate: true, matchId, sequence: Number(current.rows[0].sequence), status: current.rows[0].status, state: publicMatchState(current.rows[0].state) }
    }
    const found = await client.query(`SELECT * FROM fo_matches WHERE match_id=$1 AND player_id=$2 AND expires_at>NOW() FOR UPDATE`, [matchId, playerId])
    if (!found.rowCount) throw Object.assign(new Error('Match not found'), { status: 404 })
    const match = found.rows[0]
    if (sequence !== Number(match.sequence) + 1) throw Object.assign(new Error('Event sequence is missing or reordered'), { status: 409, code: 'EVENT_SEQUENCE' })
    let state
    try { state = applyMatchEvent(match.state, event) } catch (error) {
      await audit(client, playerId, 'match-event', 'rejected', { matchId, eventId, sequence, code: error.code, eventType: event?.type })
      throw error
    }
    const hash = stateHash(state)
    await client.query(`INSERT INTO fo_match_events(event_id,match_id,player_id,sequence,event_type,payload,resulting_state_hash) VALUES($1,$2,$3,$4,$5,$6,$7)`, [eventId, matchId, playerId, sequence, event.type, event, hash])
    await client.query(`UPDATE fo_matches SET state=$2,status=$3,sequence=$4,completed_at=CASE WHEN $3='completed' THEN NOW() ELSE completed_at END,updated_at=NOW() WHERE match_id=$1`, [matchId, state, state.status, sequence])
    await audit(client, playerId, 'match-event', 'accepted', { matchId, eventId, sequence, eventType: event.type, stateHash: hash })
    await client.query('COMMIT')
    return { duplicate: false, matchId, sequence, status: state.status, state: publicMatchState(state) }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function completeMatchSession(db, { playerId, matchId, completionId }) {
  if (!/^completion:[a-z0-9-]{8,100}$/i.test(String(completionId ?? ''))) throw Object.assign(new Error('Invalid completion id'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'match-complete', limit: 20 })
    const match = await client.query(`SELECT * FROM fo_matches WHERE match_id=$1 AND player_id=$2 FOR UPDATE`, [matchId, playerId])
    if (!match.rowCount) throw Object.assign(new Error('Match not found'), { status: 404 })
    const state = match.rows[0].state
    if (state.status !== 'completed') throw Object.assign(new Error('Server has not validated match completion'), { status: 409, code: 'MATCH_NOT_COMPLETE' })
    if (state.winner !== 'player') { await client.query('COMMIT'); return { duplicate: false, reward: null, winner: state.winner } }
    const transactionId = `match-win:${matchId}`
    const reward = await applyReward(client, { playerId, transactionId, source: 'match-win', reward: { currencyId: 'stars', amount: 100 }, metadata: { matchId, completionId, rulesVersion: match.rows[0].rules_version } })
    await client.query(`INSERT INTO fo_match_progress_events(progress_event_id,match_id,player_id,event_type,value) VALUES($1,$2,$3,'match-win',1) ON CONFLICT DO NOTHING`, [`progress:${matchId}:win`, matchId, playerId])
    await audit(client, playerId, 'match-complete', reward.duplicate ? 'duplicate' : 'accepted', { matchId, completionId, transactionId })
    await client.query('COMMIT')
    return { duplicate: reward.duplicate, reward: { currencyId: 'stars', amount: 100, transactionId }, winner: state.winner }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}
