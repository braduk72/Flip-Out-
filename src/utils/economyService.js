const LEDGER_KEY = 'fo_economy_transactions'

const COUNTER_KEYS = {
  coins: 'fo_coins',
  stars: 'fo_stars',
  trophies: 'fo_trophies',
  bonusSpins: 'fo_spin_bonus',
  freeUnlocks: 'fo_free_unlocks',
  tiebreakers: 'fo_tiebreakers',
  jokers: 'fo_jokers',
}

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback }
  catch { return fallback }
}

function asInteger(value, label) {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`)
  return value
}

function uniqueStrings(values, label) {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`)
  return [...new Set(values.map(value => String(value)))]
}

export function createTransactionId(prefix = 'economy') {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}:${uuid}`
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`
}

export function createEconomyService(storage) {
  if (!storage) throw new Error('Economy storage is required')

  function getLedger() {
    return parseJson(storage.getItem(LEDGER_KEY), {})
  }

  function getCounter(name) {
    const key = COUNTER_KEYS[name]
    if (!key) throw new Error(`Unknown economy counter: ${name}`)
    const value = Number.parseInt(storage.getItem(key) || '0', 10)
    return Number.isSafeInteger(value) ? value : 0
  }

  function hasTransaction(transactionId) {
    return Boolean(getLedger()[transactionId])
  }

  function applyTransaction(transaction) {
    const transactionId = transaction?.id?.trim?.()
    if (!transactionId) throw new Error('Economy transaction id is required')

    const ledger = getLedger()
    if (ledger[transactionId]) return { applied: false, duplicate: true, transactionId }

    const changes = transaction.changes ?? {}
    const writes = new Map()

    for (const [name, delta] of Object.entries(changes.counters ?? {})) {
      const key = COUNTER_KEYS[name]
      if (!key) throw new Error(`Unknown economy counter: ${name}`)
      asInteger(delta, `${name} delta`)
      const next = getCounter(name) + delta
      if (next < 0) return { applied: false, duplicate: false, insufficient: name, transactionId }
      writes.set(key, String(next))
    }

    for (const [name, delta] of Object.entries(changes.extras ?? {})) {
      asInteger(delta, `${name} extra delta`)
      const key = `fo_extra_${name}`
      const current = Number.parseInt(storage.getItem(key) || '0', 10) || 0
      const next = current + delta
      if (next < 0) return { applied: false, duplicate: false, insufficient: `extra:${name}`, transactionId }
      writes.set(key, String(next))
    }

    if (changes.decks) {
      const current = parseJson(storage.getItem('fo_owned_decks'), [])
      writes.set('fo_owned_decks', JSON.stringify([...new Set([...current, ...uniqueStrings(changes.decks, 'decks')])]))
    }

    if (changes.avatars) {
      const current = parseJson(storage.getItem('fo_unlocked_avatars'), [])
      const additions = changes.avatars.map(value => Number.isFinite(Number(value)) ? Number(value) : value)
      writes.set('fo_unlocked_avatars', JSON.stringify([...new Set([...current, ...additions])]))
    }

    for (const [key, value] of Object.entries(changes.flags ?? {})) {
      if (!key.startsWith('fo_')) throw new Error(`Economy flag must use an fo_ key: ${key}`)
      writes.set(key, String(value))
    }

    for (const [key, value] of writes) storage.setItem(key, value)

    ledger[transactionId] = {
      id: transactionId,
      source: transaction.source ?? 'unknown',
      appliedAt: new Date().toISOString(),
    }
    storage.setItem(LEDGER_KEY, JSON.stringify(ledger))

    return { applied: true, duplicate: false, transactionId }
  }

  function applyTransactions(transactions) {
    return (transactions ?? []).map(applyTransaction)
  }

  return { applyTransaction, applyTransactions, getCounter, hasTransaction }
}

const browserStorage = typeof localStorage === 'undefined' ? null : localStorage

export const economy = browserStorage ? createEconomyService(browserStorage) : null
