import { getDb } from './_db.js'
import { requireProtectedPlayer } from './_auth.js'

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).end()
  const db = getDb()
  try {
    const player = await requireProtectedPlayer(db, req, res)
    if (!player) return
    const [transactions, wheels, lockboxes, marketplace, challenges, continuations] = await Promise.all([
      db.query(`SELECT source,COALESCE(currency_id,item_id) AS target,SUM(amount)::bigint AS net,COUNT(*)::bigint AS events FROM fo_player_transactions GROUP BY source,COALESCE(currency_id,item_id) ORDER BY source,target`),
      db.query(`SELECT reward->>'amount' AS amount,COUNT(*)::bigint AS results FROM fo_reward_claims WHERE claim_type='daily-wheel' GROUP BY reward->>'amount' ORDER BY (reward->>'amount')::int`),
      db.query(`SELECT reward_table_id,reward,COUNT(*)::bigint AS results FROM fo_lockbox_openings GROUP BY reward_table_id,reward`),
      db.query(`SELECT COUNT(*)::bigint AS sales,COALESCE(SUM(gross_coins),0)::bigint AS volume,COALESCE(SUM(fee_coins),0)::bigint AS fees,MIN(price_coins)::bigint AS minimum,MAX(price_coins)::bigint AS maximum FROM fo_market_listings WHERE status='sold'`),
      db.query(`SELECT challenge_id,COUNT(*) FILTER (WHERE claim_id IS NOT NULL)::bigint AS completed FROM fo_challenge_progress GROUP BY challenge_id`),
      db.query(`SELECT COUNT(*) FILTER (WHERE advert_continue_used)::bigint AS advert,COUNT(*) FILTER (WHERE coin_continue_used)::bigint AS coins FROM fo_matches`),
    ])
    res.json({ generatedAt: new Date().toISOString(), privacy: 'aggregate-only', coinAndItemFlows: transactions.rows, wheelResults: wheels.rows, lockboxResults: lockboxes.rows, marketplace: marketplace.rows[0], challenges: challenges.rows, continuations: continuations.rows[0] })
  } catch (error) { res.status(error.status ?? 500).json({ error: error.message }) }
}
