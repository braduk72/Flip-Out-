import { applyReward } from './_gameServices.js'
import { localDateKey } from './_progressionRules.js'
import {
  ACTIVE_SEASON,
  FREE_MISSION_REROLLS_PER_DAY,
  MISSION_REROLL_TOKEN_ID,
  SEASON_MAX_JOURNEY_LEVEL,
  SEASON_MISSION_DEFINITIONS,
  SEASON_REWARD_PAGES,
  SEASON_SCORE_PER_MATCH3_COMPLETION,
  findSeasonChoice,
  journeyLevelForScore,
  post100SupplyCount,
  seasonTicketsForLevelDelta,
  validateSeasonJourneyDesign,
} from '../src/data/seasonJourney.js'

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i

function safeId(value, label = 'id') {
  if (!SAFE_ID.test(String(value ?? ''))) throw Object.assign(new Error(`Invalid ${label}`), { status: 400 })
  return String(value)
}

function safePositiveAmount(value, label = 'amount') {
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Object.assign(new Error(`Invalid ${label}`), { status: 400 })
  return amount
}

export function match3SeasonScoreEventId(sessionId) {
  return safeId(`season-score:match3:${safeId(sessionId, 'session id')}`, 'season score event id')
}

export async function ensureActiveSeason(client, season = ACTIVE_SEASON) {
  await client.query(
    `INSERT INTO fo_seasons(season_id,name,starts_at,ends_at,active,score_per_level,tickets_per_level,collector_item_id,metadata)
     VALUES($1,$2,$3,$4,TRUE,$5,$6,$7,$8)
     ON CONFLICT (season_id) DO UPDATE SET
       name=EXCLUDED.name,
       starts_at=EXCLUDED.starts_at,
       ends_at=EXCLUDED.ends_at,
       active=EXCLUDED.active,
       score_per_level=EXCLUDED.score_per_level,
       tickets_per_level=EXCLUDED.tickets_per_level,
       collector_item_id=EXCLUDED.collector_item_id,
       metadata=EXCLUDED.metadata`,
    [season.id, season.name, season.startsAt, season.endsAt, season.scorePerLevel, season.ticketsPerLevel, season.collectorItemId, { track: 'free-only', premiumTrack: false }],
  )
  return season
}

async function ensureProgress(client, playerId, season = ACTIVE_SEASON) {
  await client.query(
    `INSERT INTO fo_season_progress(player_id,season_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
    [playerId, season.id],
  )
  const progress = await client.query(
    `SELECT * FROM fo_season_progress WHERE player_id=$1 AND season_id=$2 FOR UPDATE`,
    [playerId, season.id],
  )
  if (!progress.rowCount) throw Object.assign(new Error('Season progress unavailable'), { status: 500 })
  return progress.rows[0]
}

export async function getSeasonState(db, { playerId, timeZone = 'UTC' }) {
  const [season, progress, scoreEvents, tickets, claims, archive, rerolls] = await Promise.all([
    db.query(`SELECT season_id,name,starts_at,ends_at,active,score_per_level,tickets_per_level,collector_item_id,metadata FROM fo_seasons WHERE season_id=$1`, [ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT season_score,journey_level,season_tickets,post_100_supply_claims,collector_awarded_at,updated_at FROM fo_season_progress WHERE player_id=$1 AND season_id=$2`, [playerId, ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT event_id,source,score_amount,metadata,created_at FROM fo_season_score_events WHERE player_id=$1 AND season_id=$2 ORDER BY created_at DESC LIMIT 20`, [playerId, ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT transaction_id,amount,source,reference_id,metadata,created_at FROM fo_season_ticket_transactions WHERE player_id=$1 AND season_id=$2 ORDER BY created_at DESC LIMIT 20`, [playerId, ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT claim_id,page_id,choice_id,ticket_cost,reward,created_at FROM fo_season_reward_claims WHERE player_id=$1 AND season_id=$2 ORDER BY created_at DESC LIMIT 20`, [playerId, ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT collector_item_id,proof_level,awarded_at FROM fo_season_archive WHERE player_id=$1 AND season_id=$2`, [playerId, ACTIVE_SEASON.id]).catch(() => ({ rows: [] })),
    db.query(`SELECT free_rerolls_used FROM fo_mission_reroll_usage WHERE player_id=$1 AND local_date=$2`, [playerId, localDateKey(new Date(), timeZone)]).catch(() => ({ rows: [] })),
  ])
  const row = progress.rows[0] ?? { season_score: 0, journey_level: 0, season_tickets: 0, post_100_supply_claims: 0 }
  return {
    season: season.rows[0] ?? ACTIVE_SEASON,
    progress: {
      seasonScore: Number(row.season_score ?? 0),
      journeyLevel: Number(row.journey_level ?? 0),
      seasonTickets: Number(row.season_tickets ?? 0),
      post100SupplyClaims: Number(row.post_100_supply_claims ?? 0),
      collectorAwardedAt: row.collector_awarded_at ?? null,
    },
    missions: SEASON_MISSION_DEFINITIONS,
    rewardPages: SEASON_REWARD_PAGES,
    recentScoreEvents: scoreEvents.rows,
    recentTicketTransactions: tickets.rows,
    recentClaims: claims.rows,
    archive: archive.rows,
    rerolls: { freePerDay: FREE_MISSION_REROLLS_PER_DAY, freeUsedToday: Number(rerolls.rows[0]?.free_rerolls_used ?? 0) },
    designErrors: validateSeasonJourneyDesign(),
  }
}

export async function grantSeasonScore(client, { playerId, eventId, source, scoreAmount, metadata = {}, season = ACTIVE_SEASON }) {
  const id = safeId(eventId, 'season score event id')
  const amount = safePositiveAmount(scoreAmount, 'season score amount')
  await ensureActiveSeason(client, season)
  const progress = await ensureProgress(client, playerId, season)
  const duplicate = await client.query(`SELECT event_id FROM fo_season_score_events WHERE event_id=$1`, [id])
  if (duplicate.rowCount) {
    return {
      duplicate: true,
      eventId: id,
      seasonScore: Number(progress.season_score),
      journeyLevel: Number(progress.journey_level),
      seasonTickets: Number(progress.season_tickets),
    }
  }
  const previousScore = Number(progress.season_score)
  const previousLevel = Number(progress.journey_level)
  const nextScore = previousScore + amount
  const nextLevel = journeyLevelForScore(nextScore, season)
  const ticketsEarned = seasonTicketsForLevelDelta(previousLevel, nextLevel, season)
  await client.query(
    `INSERT INTO fo_season_score_events(event_id,player_id,season_id,source,score_amount,metadata) VALUES($1,$2,$3,$4,$5,$6)`,
    [id, playerId, season.id, safeId(source, 'season score source'), amount, metadata],
  )
  if (ticketsEarned > 0) {
    await client.query(
      `INSERT INTO fo_season_ticket_transactions(transaction_id,player_id,season_id,amount,source,reference_id,metadata)
       VALUES($1,$2,$3,$4,'season-level',$5,$6)`,
      [`season-ticket:${id}`, playerId, season.id, ticketsEarned, id, { previousLevel, nextLevel }],
    )
  }
  const post100 = post100SupplyCount(nextScore, season)
  await client.query(
    `UPDATE fo_season_progress
     SET season_score=$3,
         journey_level=$4,
         season_tickets=season_tickets+$5,
         post_100_supply_claims=GREATEST(post_100_supply_claims,$6),
         updated_at=NOW()
     WHERE player_id=$1 AND season_id=$2`,
    [playerId, season.id, nextScore, nextLevel, ticketsEarned, post100],
  )
  let collectorAwarded = false
  if (nextLevel >= SEASON_MAX_JOURNEY_LEVEL) {
    const archived = await client.query(
      `INSERT INTO fo_season_archive(player_id,season_id,collector_item_id,proof_level)
       VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING collector_item_id`,
      [playerId, season.id, season.collectorItemId, SEASON_MAX_JOURNEY_LEVEL],
    )
    if (archived.rowCount) {
      await client.query(`UPDATE fo_season_progress SET collector_awarded_at=NOW(),updated_at=NOW() WHERE player_id=$1 AND season_id=$2`, [playerId, season.id])
      await applyReward(client, {
        playerId,
        transactionId: `season-collector:${season.id}:${playerId}`,
        source: 'season-collector-card',
        reward: { itemId: season.collectorItemId, amount: 1 },
        metadata: { seasonId: season.id, eventId: id, level: SEASON_MAX_JOURNEY_LEVEL },
      })
      collectorAwarded = true
    }
  }
  return { duplicate: false, eventId: id, seasonScore: nextScore, journeyLevel: nextLevel, ticketsEarned, collectorAwarded }
}

export async function grantMatch3SeasonScore(client, { playerId, sessionId, levelId, score }) {
  return grantSeasonScore(client, {
    playerId,
    eventId: match3SeasonScoreEventId(sessionId),
    source: 'match3-completion',
    scoreAmount: SEASON_SCORE_PER_MATCH3_COMPLETION,
    metadata: { sessionId, levelId, score },
  })
}

export async function spendSeasonTickets(db, { playerId, claimId, choiceId }) {
  const selected = findSeasonChoice(safeId(choiceId, 'season choice id'))
  if (!selected) throw Object.assign(new Error('Unknown season reward choice'), { status: 400 })
  const { page, choice } = selected
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensureActiveSeason(client)
    const progress = await ensureProgress(client, playerId)
    if (Number(progress.journey_level) < page.unlockLevel) throw Object.assign(new Error('Season page is locked'), { status: 403, code: 'SEASON_PAGE_LOCKED' })
    if (choice.collectorOnly && Number(progress.journey_level) < SEASON_MAX_JOURNEY_LEVEL) throw Object.assign(new Error('Collector card requires level 100'), { status: 403, code: 'SEASON_COLLECTOR_LOCKED' })
    const id = safeId(claimId, 'season claim id')
    const duplicate = await client.query(`SELECT reward FROM fo_season_reward_claims WHERE claim_id=$1 AND player_id=$2`, [id, playerId])
    if (duplicate.rowCount) {
      await client.query('COMMIT')
      return { duplicate: true, claimId: id, reward: duplicate.rows[0].reward }
    }
    if (choice.ticketCost > 0) {
      const updated = await client.query(
        `UPDATE fo_season_progress SET season_tickets=season_tickets-$3,updated_at=NOW()
         WHERE player_id=$1 AND season_id=$2 AND season_tickets >= $3 RETURNING season_tickets`,
        [playerId, ACTIVE_SEASON.id, choice.ticketCost],
      )
      if (!updated.rowCount) throw Object.assign(new Error('Insufficient Season Tickets'), { status: 409, code: 'INSUFFICIENT_SEASON_TICKETS' })
      await client.query(
        `INSERT INTO fo_season_ticket_transactions(transaction_id,player_id,season_id,amount,source,reference_id,metadata)
         VALUES($1,$2,$3,$4,'season-choice',$5,$6)`,
        [`season-ticket-spend:${id}`, playerId, ACTIVE_SEASON.id, -choice.ticketCost, id, { pageId: page.id, choiceId }],
      )
    }
    await applyReward(client, { playerId, transactionId: `season-choice:${id}`, source: 'season-choice', reward: choice.reward, metadata: { pageId: page.id, choiceId } })
    await client.query(
      `INSERT INTO fo_season_reward_claims(claim_id,player_id,season_id,page_id,choice_id,ticket_cost,reward)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [id, playerId, ACTIVE_SEASON.id, page.id, choice.id, choice.ticketCost, choice.reward],
    )
    await client.query('COMMIT')
    return { duplicate: false, claimId: id, reward: choice.reward }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function recordMissionReroll(db, { playerId, transactionId, missionId, paymentType = 'free', timeZone = 'UTC' }) {
  const id = safeId(transactionId, 'mission reroll transaction id')
  const localDate = localDateKey(new Date(), timeZone)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensureActiveSeason(client)
    const prior = await client.query(`SELECT transaction_id,payment_type FROM fo_mission_reroll_transactions WHERE transaction_id=$1`, [id])
    if (prior.rowCount) {
      await client.query('COMMIT')
      return { duplicate: true, transactionId: id, paymentType: prior.rows[0].payment_type }
    }
    let paidBy = paymentType
    if (paidBy === 'free') {
      const usage = await client.query(
        `INSERT INTO fo_mission_reroll_usage(player_id,local_date,free_rerolls_used)
         VALUES($1,$2,1)
         ON CONFLICT(player_id,local_date) DO UPDATE
         SET free_rerolls_used=fo_mission_reroll_usage.free_rerolls_used+1,updated_at=NOW()
         WHERE fo_mission_reroll_usage.free_rerolls_used < $3
         RETURNING free_rerolls_used`,
        [playerId, localDate, FREE_MISSION_REROLLS_PER_DAY],
      )
      if (!usage.rowCount) throw Object.assign(new Error('No free mission rerolls remaining'), { status: 409, code: 'FREE_REROLLS_USED' })
    } else if (paidBy === 'token') {
      await applyReward(client, { playerId, transactionId: `mission-reroll-token:${id}`, source: 'mission-reroll-token', reward: { itemId: MISSION_REROLL_TOKEN_ID, amount: -1 }, metadata: { missionId } })
    } else if (paidBy === 'coins') {
      await applyReward(client, { playerId, transactionId: `mission-reroll-coin:${id}`, source: 'mission-reroll-cost', reward: { currencyId: 'coins', amount: -10 }, metadata: { missionId } })
    } else {
      throw Object.assign(new Error('Invalid reroll payment type'), { status: 400 })
    }
    await client.query(
      `INSERT INTO fo_mission_reroll_transactions(transaction_id,player_id,season_id,mission_id,payment_type,local_date)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [id, playerId, ACTIVE_SEASON.id, safeId(missionId, 'mission id'), paidBy, localDate],
    )
    await client.query('COMMIT')
    return { duplicate: false, transactionId: id, paymentType: paidBy }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
