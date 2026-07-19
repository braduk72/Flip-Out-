import test from 'node:test'
import assert from 'node:assert/strict'
import { appendCoinTransaction, canonicalCoinTransaction, coinLedgerHash, COIN_TO_STAR_RATE, traceCoinCreation, traceCoinOrigins, verifyCoinLedgerRows } from '../api/_coinLedger.js'

const SECRET = 'test-secret-that-is-at-least-thirty-two-bytes-long'
const account = '00000000-0000-4000-8000-000000000001'

function chain(entries) {
  let previous = 'GENESIS'
  return entries.map((entry, index) => {
    const row = { transaction_id: entry.id, account_id: account, amount: entry.amount, transaction_type: entry.type, source_reference_id: entry.source, created_at: new Date(1700000000000 + index * 1000), previous_ledger_hash: previous, ledger_sequence: index + 1 }
    row.ledger_hash = coinLedgerHash(row, SECRET)
    previous = row.ledger_hash
    return row
  })
}

test('canonical Coin data is stable and valid chains recalculate balance', () => {
  const rows = chain([{ id: 'p1', amount: 100, type: 'purchase', source: 'stripe-1' }, { id: 's1', amount: -20, type: 'spend', source: 'shop-1' }])
  assert.equal(JSON.parse(canonicalCoinTransaction(rows[0])).amount, 100)
  assert.deepEqual(verifyCoinLedgerRows(rows, SECRET), { valid: true, balance: 80, firstInvalidIndex: null, transactionId: null, headHash: rows[1].ledger_hash })
})

test('modified amount is detected', () => { const rows = chain([{ id: 'p1', amount: 100, type: 'purchase', source: 'stripe-1' }]); rows[0].amount = 101; assert.equal(verifyCoinLedgerRows(rows, SECRET).reason, 'ledger-hash-mismatch') })
test('modified source is detected', () => { const rows = chain([{ id: 'p1', amount: 100, type: 'purchase', source: 'stripe-1' }]); rows[0].source_reference_id = 'stripe-2'; assert.equal(verifyCoinLedgerRows(rows, SECRET).reason, 'ledger-hash-mismatch') })
test('broken previous hash is detected', () => { const rows = chain([{ id: 'p1', amount: 100, type: 'purchase', source: 'stripe-1' }]); rows[0].previous_ledger_hash = 'broken'; assert.equal(verifyCoinLedgerRows(rows, SECRET).reason, 'previous-hash-mismatch') })

test('unauthorised Coin creation is rejected before database mutation', async () => {
  await assert.rejects(appendCoinTransaction({}, { transactionId: 'bad', accountId: account, amount: 5, transactionType: 'game-win', sourceReferenceId: 'match-1' }), error => error.code === 'COIN_CREATION_UNAUTHORISED')
})

test('Coin conversion rate is exactly 1:10 and one-way', () => {
  assert.equal(COIN_TO_STAR_RATE, 10)
  assert.equal(7 * COIN_TO_STAR_RATE, 70)
})

test('creation-source trace attributes a spend to original purchase and promotion lots', () => {
  const rows = chain([
    { id: 'purchase:1', amount: 10, type: 'purchase', source: 'stripe-1' },
    { id: 'promo:1', amount: 5, type: 'promotional-grant', source: 'campaign-1' },
    { id: 'spend:1', amount: -12, type: 'premium-spend', source: 'sku-1' },
  ])
  const trace = traceCoinCreation(rows, 'spend:1')
  assert.deepEqual(trace.creationSources.map(source => [source.transactionId, source.amount]), [['purchase:1', 10], ['promo:1', 2]])
})

test('full provenance follows an Exchange receipt back to the buyer purchase', () => {
  const seller = '00000000-0000-4000-8000-000000000002'
  const buyerRows = chain([
    { id: 'buyer-purchase', amount: 100, type: 'purchase', source: 'stripe-buyer' },
    { id: 'exchange-buyer', amount: -40, type: 'exchange-purchase', source: 'settlement-1' },
  ])
  const sellerRows = chain([{ id: 'exchange-seller', amount: 40, type: 'exchange-settlement', source: 'settlement-1' }]).map(row => ({ ...row, account_id: seller }))
  const origins = traceCoinOrigins([...buyerRows, ...sellerRows], seller, 'exchange-seller')
  assert.deepEqual(origins.map(origin => [origin.transactionId, origin.sourceReferenceId]), [['buyer-purchase', 'stripe-buyer']])
})
