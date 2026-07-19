export const REWARD_TABLES = Object.freeze({
  dailyWheelV1: {
    id: 'daily-wheel-v1',
    entries: [
      { reward: { currencyId: 'stars', amount: 10 }, weight: 30 },
      { reward: { currencyId: 'stars', amount: 50 }, weight: 25 },
      { reward: { currencyId: 'stars', amount: 100 }, weight: 18 },
      { reward: { currencyId: 'stars', amount: 150 }, weight: 12 },
      { reward: { currencyId: 'stars', amount: 200 }, weight: 8 },
      { reward: { currencyId: 'stars', amount: 250 }, weight: 4 },
      { reward: { currencyId: 'stars', amount: 500 }, weight: 2 },
      { reward: { currencyId: 'stars', amount: 1000 }, weight: 1 },
    ],
  },
  standardLockboxV1: {
    id: 'standard-lockbox-v1',
    entries: [
      { reward: { currencyId: 'stars', amount: 100 }, weight: 70 },
      { reward: { itemId: 'powerup:freeze', amount: 1 }, weight: 25 },
      { reward: { itemId: 'powerup:tiebreaker', amount: 1 }, weight: 5 },
    ],
  },
})

export function validateRewardTable(table) {
  const errors = []
  if (!table?.id) errors.push('Missing table id')
  if (!Array.isArray(table?.entries) || !table.entries.length) errors.push('Reward table must have entries')
  for (const entry of table?.entries ?? []) {
    if (!Number.isSafeInteger(entry.weight) || entry.weight <= 0) errors.push('Weights must be positive integers')
    if (Boolean(entry.reward?.currencyId) === Boolean(entry.reward?.itemId)) errors.push('Reward must target exactly one item or currency')
    if (!Number.isSafeInteger(entry.reward?.amount) || entry.reward.amount <= 0) errors.push('Reward amount must be a positive integer')
  }
  return errors
}

export function selectWeightedReward(table, randomValue) {
  const errors = validateRewardTable(table)
  if (errors.length) throw new Error(errors.join('; '))
  if (!(randomValue >= 0 && randomValue < 1)) throw new Error('randomValue must be in [0, 1)')
  const total = table.entries.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = randomValue * total
  for (const entry of table.entries) {
    cursor -= entry.weight
    if (cursor < 0) return { ...entry.reward, tableId: table.id }
  }
  return { ...table.entries.at(-1).reward, tableId: table.id }
}

export function seededRandom(seed = 1) {
  let state = seed >>> 0
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296)
}

export function simulateRewards(table, rolls, seed = 1) {
  const random = seededRandom(seed)
  const counts = {}
  for (let index = 0; index < rolls; index += 1) {
    const reward = selectWeightedReward(table, random())
    const key = `${reward.currencyId ?? reward.itemId}:${reward.amount}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return { tableId: table.id, rolls, seed, counts }
}
