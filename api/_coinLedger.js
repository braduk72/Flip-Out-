import crypto from 'node:crypto'

export const COIN_TO_STAR_RATE = 10
export const COIN_CREATION_TYPES = Object.freeze(new Set(['purchase', 'promotional-grant', 'refund', 'shredder-reward']))
const GENESIS_HASH = 'GENESIS'

function required(value, label) {
  if (value === undefined || value === null || value === '') throw Object.assign(new Error(`${label} is required`), { status: 400 })
  return String(value)
}

export function canonicalCoinTransaction(row) {
  return JSON.stringify({
    transactionId: required(row.transaction_id ?? row.transactionId, 'transaction id'),
    accountId: required(row.account_id ?? row.accountId, 'account id'),
    amount: Number(row.amount),
    transactionType: required(row.transaction_type ?? row.transactionType, 'transaction type'),
    sourceReferenceId: required(row.source_reference_id ?? row.sourceReferenceId, 'source reference id'),
    timestamp: new Date(row.created_at ?? row.createdAt).toISOString(),
    previousLedgerHash: required(row.previous_ledger_hash ?? row.previousLedgerHash, 'previous ledger hash'),
  })
}

export function coinLedgerHash(row, secret = process.env.COIN_LEDGER_HMAC_SECRET) {
  if (!secret || secret.length < 32) throw Object.assign(new Error('Coin ledger signing secret is not configured securely'), { status: 500, code: 'LEDGER_SECRET_MISSING' })
  return crypto.createHmac('sha256', secret).update(canonicalCoinTransaction(row)).digest('hex')
}

export function verifyCoinLedgerRows(rows, secret = process.env.COIN_LEDGER_HMAC_SECRET) {
  let previous = GENESIS_HASH
  let balance = 0
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const amount = Number(row.amount)
    const expected = coinLedgerHash(row, secret)
    if (row.previous_ledger_hash !== previous) return { valid: false, balance, firstInvalidIndex: index, transactionId: row.transaction_id, reason: 'previous-hash-mismatch' }
    const expectedBuffer = Buffer.from(expected)
    const actualBuffer = Buffer.from(String(row.ledger_hash))
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return { valid: false, balance, firstInvalidIndex: index, transactionId: row.transaction_id, reason: 'ledger-hash-mismatch' }
    balance += amount
    if (balance < 0) return { valid: false, balance, firstInvalidIndex: index, transactionId: row.transaction_id, reason: 'negative-balance' }
    previous = row.ledger_hash
  }
  return { valid: true, balance, firstInvalidIndex: null, transactionId: null, headHash: previous }
}

export async function loadAndVerifyCoinLedger(client, accountId) {
  const result = await client.query(`SELECT transaction_id,account_id,amount,transaction_type,source_reference_id,created_at,previous_ledger_hash,ledger_hash,ledger_sequence,metadata FROM fo_coin_ledger WHERE account_id=$1 ORDER BY ledger_sequence`, [accountId])
  const verification = verifyCoinLedgerRows(result.rows)
  if (!verification.valid) throw Object.assign(new Error(`Coin ledger verification failed at ${verification.transactionId}`), { status: 409, code: 'COIN_LEDGER_INVALID', verification })
  return { rows: result.rows, ...verification }
}

export async function appendCoinTransaction(client, { transactionId, accountId, amount, transactionType, sourceReferenceId, metadata = {}, allowCreation = false }) {
  if (!Number.isSafeInteger(amount) || amount === 0) throw Object.assign(new Error('Coin amount must be a non-zero safe integer'), { status: 400 })
  const internalReceipt = ['exchange-settlement', 'creator-gift-receipt'].includes(transactionType)
  if (amount > 0 && (!allowCreation || !COIN_CREATION_TYPES.has(transactionType)) && !internalReceipt) throw Object.assign(new Error('Unauthorised Coin creation'), { status: 403, code: 'COIN_CREATION_UNAUTHORISED' })
  await client.query(`INSERT INTO fo_player_balances(player_id,currency_id,balance) VALUES($1,'coins',0) ON CONFLICT DO NOTHING`, [accountId])
  await client.query(`SELECT balance FROM fo_player_balances WHERE player_id=$1 AND currency_id='coins' FOR UPDATE`, [accountId])
  const duplicate = await client.query(`SELECT account_id,amount,transaction_type,source_reference_id FROM fo_coin_ledger WHERE transaction_id=$1`, [transactionId])
  if (duplicate.rowCount) {
    const row = duplicate.rows[0]
    if (String(row.account_id) !== String(accountId) || Number(row.amount) !== amount || row.transaction_type !== transactionType || row.source_reference_id !== sourceReferenceId) throw Object.assign(new Error('Duplicate Coin transaction conflicts with existing entry'), { status: 409, code: 'COIN_TRANSACTION_CONFLICT' })
    return { applied: false, duplicate: true, transactionId }
  }
  const verified = await loadAndVerifyCoinLedger(client, accountId)
  const balance = verified.balance + amount
  if (balance < 0) throw Object.assign(new Error('Insufficient Coin balance'), { status: 409, code: 'INSUFFICIENT_COINS' })
  const createdAt = new Date()
  const row = { transactionId, accountId, amount, transactionType, sourceReferenceId, createdAt, previousLedgerHash: verified.headHash }
  const ledgerHash = coinLedgerHash(row)
  const sequence = verified.rows.length + 1
  await client.query(`INSERT INTO fo_coin_ledger(transaction_id,account_id,ledger_sequence,amount,transaction_type,source_reference_id,created_at,previous_ledger_hash,ledger_hash,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [transactionId, accountId, sequence, amount, transactionType, sourceReferenceId, createdAt, verified.headHash, ledgerHash, metadata])
  const updated = await client.query(`UPDATE fo_player_balances SET balance=$2,updated_at=NOW() WHERE player_id=$1 AND currency_id='coins' RETURNING balance`, [accountId, balance])
  await client.query(`INSERT INTO fo_player_transactions(transaction_id,player_id,source,currency_id,amount,metadata) VALUES($1,$2,$3,'coins',$4,$5) ON CONFLICT (transaction_id) DO NOTHING`, [transactionId, accountId, transactionType, amount, { ...metadata, sourceReferenceId, ledgerHash }])
  return { applied: true, duplicate: false, transactionId, balance: Number(updated.rows[0].balance), ledgerHash }
}

export async function convertCoinsToStars(db, { accountId, coins, referenceId }) {
  if (!Number.isSafeInteger(coins) || coins < 1) throw Object.assign(new Error('Conversion Coin amount must be a positive integer'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query(`SELECT result FROM fo_player_claims WHERE claim_id=$1 AND player_id=$2`, [`conversion:${referenceId}`, accountId])
    if (existing.rowCount) { await client.query('COMMIT'); return { ...existing.rows[0].result, duplicate: true } }
    const stars = coins * COIN_TO_STAR_RATE
    await appendCoinTransaction(client, { transactionId: `conversion:${referenceId}:coins`, accountId, amount: -coins, transactionType: 'coin-to-star-conversion', sourceReferenceId: referenceId })
    await client.query(`INSERT INTO fo_player_balances(player_id,currency_id,balance) VALUES($1,'stars',0) ON CONFLICT DO NOTHING`, [accountId])
    await client.query(`UPDATE fo_player_balances SET balance=balance+$2,updated_at=NOW() WHERE player_id=$1 AND currency_id='stars'`, [accountId, stars])
    await client.query(`INSERT INTO fo_player_transactions(transaction_id,player_id,source,currency_id,amount,metadata) VALUES($1,$2,'coin-to-star-conversion','stars',$3,$4)`, [`conversion:${referenceId}:stars`, accountId, stars, { referenceId, rate: COIN_TO_STAR_RATE }])
    const result = { referenceId, coinsDeducted: coins, starsGranted: stars, rate: COIN_TO_STAR_RATE }
    await client.query(`INSERT INTO fo_player_claims(claim_id,player_id,claim_type,result) VALUES($1,$2,'coin-to-star-conversion',$3)`, [`conversion:${referenceId}`, accountId, result])
    await client.query('COMMIT')
    return { ...result, duplicate: false }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function recordAuthorizedCoinGrant(db, { accountId, amount, transactionId, transactionType, sourceReferenceId, metadata }) {
  if (!COIN_CREATION_TYPES.has(transactionType)) throw Object.assign(new Error('Coin creation type is not authorised'), { status: 403, code: 'COIN_CREATION_UNAUTHORISED' })
  const client = await db.connect()
  try { await client.query('BEGIN'); const result = await appendCoinTransaction(client, { accountId, amount, transactionId, transactionType, sourceReferenceId, metadata, allowCreation: true }); await client.query('COMMIT'); return result }
  catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function recordCreatorGift(db, { senderAccountId, creatorAccountId, coins, referenceId }) {
  if (String(senderAccountId) === String(creatorAccountId)) throw Object.assign(new Error('Cannot gift to the same account'), { status: 409 })
  if (!Number.isSafeInteger(coins) || coins < 1) throw Object.assign(new Error('Gift amount must be positive'), { status: 400 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await appendCoinTransaction(client, { transactionId: `creator-gift:${referenceId}:spend`, accountId: senderAccountId, amount: -coins, transactionType: 'creator-gift-spend', sourceReferenceId: referenceId })
    await appendCoinTransaction(client, { transactionId: `creator-gift:${referenceId}:receipt`, accountId: creatorAccountId, amount: coins, transactionType: 'creator-gift-receipt', sourceReferenceId: referenceId })
    await client.query('COMMIT')
    return { referenceId, coins }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export function traceCoinCreation(rows, transactionId) {
  const target = rows.find(row => row.transaction_id === transactionId)
  if (!target) return null
  if (Number(target.amount) > 0 && COIN_CREATION_TYPES.has(target.transaction_type)) return { transactionId, creation: target }
  if (Number(target.amount) > 0) return { transactionId, sourceReferenceId: target.source_reference_id, creationSources: [{ ...target, originalAmount: Number(target.amount), remaining: Number(target.amount), amount: Number(target.amount) }] }
  const lots = []
  for (const row of rows) {
    const amount = Number(row.amount)
    if (amount > 0) lots.push({ transactionId: row.transaction_id, transactionType: row.transaction_type, sourceReferenceId: row.source_reference_id, originalAmount: amount, remaining: amount })
    if (amount < 0) {
      let requiredAmount = -amount
      const consumed = []
      for (const lot of lots) {
        if (requiredAmount === 0 || lot.remaining === 0) continue
        const used = Math.min(lot.remaining, requiredAmount)
        lot.remaining -= used
        requiredAmount -= used
        consumed.push({ ...lot, amount: used })
      }
      if (row.transaction_id === transactionId) return { transactionId, sourceReferenceId: row.source_reference_id, creationSources: consumed }
    }
  }
  return { transactionId, sourceReferenceId: target.source_reference_id, creationSources: [] }
}

export function traceCoinOrigins(allRows, accountId, transactionId, visited = new Set()) {
  const visitKey = `${accountId}:${transactionId}`
  if (visited.has(visitKey)) return []
  visited.add(visitKey)
  const accountRows = allRows.filter(row => String(row.account_id) === String(accountId)).sort((a, b) => Number(a.ledger_sequence) - Number(b.ledger_sequence))
  const trace = traceCoinCreation(accountRows, transactionId)
  if (!trace) return []
  const candidates = trace.creation ? [{ ...trace.creation, amount: Number(trace.creation.amount) }] : trace.creationSources
  const origins = []
  for (const candidate of candidates) {
    if (COIN_CREATION_TYPES.has(candidate.transaction_type ?? candidate.transactionType)) {
      origins.push({ transactionId: candidate.transaction_id ?? candidate.transactionId, accountId: candidate.account_id ?? accountId, transactionType: candidate.transaction_type ?? candidate.transactionType, sourceReferenceId: candidate.source_reference_id ?? candidate.sourceReferenceId, amount: Number(candidate.amount) })
      continue
    }
    const reference = candidate.source_reference_id ?? candidate.sourceReferenceId
    const upstream = allRows.find(row => row.source_reference_id === reference && Number(row.amount) < 0 && String(row.account_id) !== String(accountId))
    if (upstream) origins.push(...traceCoinOrigins(allRows, upstream.account_id, upstream.transaction_id, visited))
  }
  return origins
}
