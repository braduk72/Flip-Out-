import pg from 'pg'
import { loadAndVerifyCoinLedger, traceCoinOrigins } from '../api/_coinLedger.js'

if (process.env.VERCEL_ENV !== 'preview') throw new Error(`Refusing Coin ledger verification outside Preview (received ${process.env.VERCEL_ENV || 'unset'})`)
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const accountArg = process.argv.find(arg => arg.startsWith('--account='))?.slice(10)
const transactionArg = process.argv.find(arg => arg.startsWith('--transaction='))?.slice(14)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
try {
  const accounts = accountArg ? { rows: [{ player_id: accountArg }] } : await pool.query(`SELECT DISTINCT account_id AS player_id FROM fo_coin_ledger ORDER BY account_id`)
  const allRows = transactionArg ? (await pool.query(`SELECT * FROM fo_coin_ledger ORDER BY account_id,ledger_sequence`)).rows : []
  const reports = []
  for (const { player_id: accountId } of accounts.rows) {
    try {
      const result = await loadAndVerifyCoinLedger(pool, accountId)
      reports.push({ accountId, valid: true, recalculatedBalance: result.balance, transactions: result.rows.length, headHash: result.headHash, trace: transactionArg ? traceCoinOrigins(allRows, accountId, transactionArg) : undefined })
    } catch (error) {
      reports.push({ accountId, valid: false, error: error.message, firstInvalidTransaction: error.verification?.transactionId, reason: error.verification?.reason })
    }
  }
  console.log(JSON.stringify({ environment: process.env.VERCEL_ENV, reports }, null, 2))
  if (reports.some(report => !report.valid)) process.exitCode = 1
} finally { await pool.end() }
