import crypto from 'node:crypto'
import { ITEM_BY_ID } from '../src/data/itemCatalog.js'
import { REWARD_TABLES } from './_rewards.js'
import { applyReward, enforceRateLimit, secureWeightedReward } from './_gameServices.js'
import { auctionAmounts, EXCHANGE_DEFAULT_EXPIRY_DAYS, EXCHANGE_MAX_ACTIVE_LISTINGS, EXCHANGE_MIN_LISTING_PRICE_COINS, reviveDecision, validateListing } from './_progressionRules.js'

export async function continueMatch(db, { playerId, matchId, requestId }) {
  const transactionId = String(requestId ?? `revive:${matchId}:${crypto.randomUUID()}`)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'continue', limit: 10 })
    const match = await client.query(`SELECT * FROM fo_matches WHERE match_id=$1 AND player_id=$2 FOR UPDATE`, [matchId, playerId])
    if (!match.rowCount) throw Object.assign(new Error('Match not found'), { status: 404 })
    const row = match.rows[0]
    if (!['active', 'lost'].includes(row.status)) throw Object.assign(new Error('Match cannot be continued'), { status: 409 })
    const state = row.state && typeof row.state === 'object' ? row.state : {}
    const prior = (state.revives ?? []).find(revive => revive.transactionId === transactionId)
    if (prior) { await client.query('COMMIT'); return { continued: prior.success, duplicate: true, method: 'coins', transactionId, revive: prior, state } }
    if (row.status !== 'lost') throw Object.assign(new Error('Revive is available only after a loss'), { status: 409, code: 'REVIVE_NOT_AVAILABLE' })
    const balance = await client.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='coins' FOR UPDATE`, [playerId])
    const randomValue = crypto.randomInt(0, 10000) / 10000
    const decision = reviveDecision({ attempt: (state.revives?.length ?? 0) + 1, coins: Number(balance.rows[0]?.balance ?? 0), randomValue })
    if (!decision.allowed) throw Object.assign(new Error(decision.reason === 'insufficient-coins' ? 'Insufficient Coins' : 'No revives remaining'), { status: decision.reason === 'insufficient-coins' ? 409 : 400, code: decision.reason.toUpperCase().replaceAll('-', '_') })
    await applyReward(client, { playerId, transactionId: `${transactionId}:cost`, source: 'revive-cost', reward: { currencyId: 'coins', amount: -decision.costCoins }, metadata: { matchId, attempt: decision.attempt, odds: decision.oddsPercent } })
    const revive = { transactionId, attempt: decision.attempt, label: decision.label, costCoins: decision.costCoins, oddsPercent: decision.oddsPercent, success: decision.success }
    const nextState = { ...state, revives: [...(state.revives ?? []), revive] }
    const nextStatus = decision.success ? 'active' : 'lost'
    await client.query(`UPDATE fo_matches SET state=$2,status=$3,coin_continue_used=TRUE,updated_at=NOW() WHERE match_id=$1`, [matchId, nextState, nextStatus])
    await client.query('COMMIT')
    return { continued: decision.success, method: 'coins', transactionId, revive, state: nextState }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function consumePowerUp(db, { playerId, matchId, itemId, activationId }) {
  if (ITEM_BY_ID.get(itemId)?.type !== 'powerup') throw Object.assign(new Error('Invalid power-up'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const match = await client.query(`SELECT status,state FROM fo_matches WHERE match_id=$1 AND player_id=$2 FOR UPDATE`, [matchId, playerId])
    if (!match.rowCount || match.rows[0].status !== 'active') throw Object.assign(new Error('Active match required'), { status: 409 })
    const used = Array.isArray(match.rows[0].state?.powerUpActivations) ? match.rows[0].state.powerUpActivations : []
    if (used.includes(activationId)) { await client.query('COMMIT'); return { duplicate: true, activationId } }
    await applyReward(client, { playerId, transactionId: `powerup:${activationId}`, source: 'powerup-use', reward: { itemId, amount: -1 }, metadata: { matchId, activationId } })
    const state = { ...match.rows[0].state, powerUpActivations: [...used, activationId] }
    await client.query(`UPDATE fo_matches SET state=$2,updated_at=NOW() WHERE match_id=$1`, [matchId, state])
    await client.query('COMMIT')
    return { duplicate: false, activationId, itemId }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function openPlayerLockbox(db, { playerId, openingId, boxItemId = 'inventory:lockbox:standard', keyItemId = 'inventory:key:standard' }) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'lockbox', limit: 10 })
    const prior = await client.query(`SELECT reward,reward_table_id FROM fo_lockbox_openings WHERE opening_id=$1 AND player_id=$2`, [openingId, playerId])
    if (prior.rowCount) { await client.query('COMMIT'); return { duplicate: true, openingId, reward: prior.rows[0].reward, rewardTableId: prior.rows[0].reward_table_id } }
    await applyReward(client, { playerId, transactionId: `lockbox:${openingId}:box`, source: 'lockbox-open', reward: { itemId: boxItemId, amount: -1 } })
    await applyReward(client, { playerId, transactionId: `lockbox:${openingId}:key`, source: 'lockbox-open', reward: { itemId: keyItemId, amount: -1 } })
    const reward = secureWeightedReward(REWARD_TABLES.standardLockboxV1)
    await applyReward(client, { playerId, transactionId: `lockbox:${openingId}:reward`, source: 'lockbox-reward', reward, metadata: { rewardTableId: reward.tableId } })
    await client.query(`INSERT INTO fo_lockbox_openings(opening_id,player_id,box_item_id,key_item_id,reward_table_id,reward) VALUES($1,$2,$3,$4,$5,$6)`, [openingId, playerId, boxItemId, keyItemId, reward.tableId, reward])
    await client.query('COMMIT')
    return { duplicate: false, openingId, reward, rewardTableId: reward.tableId }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

function defaultListingExpiry(now = new Date()) {
  return new Date(now.getTime() + EXCHANGE_DEFAULT_EXPIRY_DAYS * 86400000)
}

export async function expireMarketListings(dbOrClient, { sellerId = null, listingId = null } = {}) {
  const ownsConnection = typeof dbOrClient.connect === 'function' && typeof dbOrClient.release !== 'function'
  const client = ownsConnection ? await dbOrClient.connect() : dbOrClient
  try {
    if (ownsConnection) await client.query('BEGIN')
    const expired = await client.query(
      `UPDATE fo_market_listings
          SET status='expired', cancelled_at=NOW()
        WHERE status='active'
          AND expires_at IS NOT NULL
          AND expires_at<=NOW()
          AND ($1::uuid IS NULL OR seller_id=$1)
          AND ($2::uuid IS NULL OR listing_id=$2)
        RETURNING listing_id,seller_id,item_id,quantity`,
      [sellerId, listingId]
    )
    const returned = []
    for (const row of expired.rows) {
      await applyReward(client, {
        playerId: row.seller_id,
        transactionId: `market-expire:${row.listing_id}`,
        source: 'market-return',
        reward: { itemId: row.item_id, amount: Number(row.quantity) },
        metadata: { listingId: row.listing_id, reason: 'expired-listing' },
        skipCapacityCheck: true,
      })
      returned.push(row.listing_id)
    }
    if (ownsConnection) await client.query('COMMIT')
    return { expired: returned.length, listingIds: returned }
  } catch (error) {
    if (ownsConnection) await client.query('ROLLBACK')
    throw error
  } finally {
    if (ownsConnection) client.release()
  }
}

export async function createListing(db, { playerId, itemId, quantity, priceCoins, expiresAt }) {
  const item = ITEM_BY_ID.get(itemId)
  const validation = validateListing({ item, quantity, priceCoins, sellerId: playerId, minPrice: EXCHANGE_MIN_LISTING_PRICE_COINS })
  if (!validation.allowed) throw Object.assign(new Error('Invalid listing'), { status: 400, code: validation.reason })
  const listingId = crypto.randomUUID()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'market-list', limit: 20 })
    await expireMarketListings(client, { sellerId: playerId })
    const active = await client.query(`SELECT COUNT(*)::int AS count FROM fo_market_listings WHERE seller_id=$1 AND status='active' AND (expires_at IS NULL OR expires_at>NOW())`, [playerId])
    if (Number(active.rows[0].count) >= EXCHANGE_MAX_ACTIVE_LISTINGS) throw Object.assign(new Error('Maximum active listings reached'), { status: 409, code: 'EXCHANGE_ACTIVE_LISTING_LIMIT' })
    await applyReward(client, { playerId, transactionId: `market-list:${listingId}`, source: 'market-escrow', reward: { itemId, amount: -quantity } })
    const expiry = expiresAt ? new Date(expiresAt) : defaultListingExpiry()
    await client.query(`INSERT INTO fo_market_listings(listing_id,seller_id,item_id,quantity,price_coins,expires_at) VALUES($1,$2,$3,$4,$5,$6)`, [listingId, playerId, itemId, quantity, priceCoins, expiry])
    await client.query('COMMIT')
    return { listingId, status: 'active', expiresAt: expiry.toISOString() }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function settleListing(db, { playerId, listingId, requestId }) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await enforceRateLimit(client, { playerId, action: 'market-buy', limit: 20 })
    const found = await client.query(`SELECT * FROM fo_market_listings WHERE listing_id=$1 FOR UPDATE`, [listingId])
    if (!found.rowCount || found.rows[0].status !== 'active') throw Object.assign(new Error('Listing unavailable'), { status: 409 })
    const listing = found.rows[0]
    if (String(listing.seller_id) === String(playerId)) throw Object.assign(new Error('Cannot buy your own listing'), { status: 409 })
    if (listing.expires_at && new Date(listing.expires_at) <= new Date()) {
      await expireMarketListings(client, { listingId })
      throw Object.assign(new Error('Listing expired'), { status: 409, code: 'EXCHANGE_LISTING_EXPIRED' })
    }
    const amounts = auctionAmounts(Number(listing.price_coins))
    const settlementId = String(requestId ?? `market-buy:${listingId}`)
    await applyReward(client, { playerId, transactionId: `${settlementId}:buyer-coins`, source: 'exchange-purchase', reward: { currencyId: 'coins', amount: -amounts.grossCoins }, metadata: { sourceReferenceId: settlementId, listingId } })
    await applyReward(client, { playerId: listing.seller_id, transactionId: `${settlementId}:seller-gross`, source: 'market-sale', reward: { currencyId: 'coins', amount: amounts.grossCoins }, metadata: { sourceReferenceId: settlementId, listingId } })
    if (amounts.feeCoins > 0) await applyReward(client, { playerId: listing.seller_id, transactionId: `${settlementId}:fee`, source: 'exchange-fee', reward: { currencyId: 'coins', amount: -amounts.feeCoins }, metadata: { sourceReferenceId: settlementId, listingId } })
    await applyReward(client, { playerId, transactionId: `${settlementId}:item`, source: 'market-purchase', reward: { itemId: listing.item_id, amount: Number(listing.quantity) } })
    await client.query(`UPDATE fo_market_listings SET status='sold',buyer_id=$2,gross_coins=$3,fee_coins=$4,net_coins=$5,completed_at=NOW() WHERE listing_id=$1`, [listingId, playerId, amounts.grossCoins, amounts.feeCoins, amounts.netCoins])
    await client.query('COMMIT')
    return { listingId, ...amounts, status: 'sold' }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}
