import { REWARD_TABLES, simulateRewards } from '../api/_rewards.js'

const rolls = Number.parseInt(process.argv[2] ?? '100000', 10)
if (!Number.isSafeInteger(rolls) || rolls < 1 || rolls > 10000000) throw new Error('Roll count must be between 1 and 10,000,000')
const reports = Object.fromEntries(Object.entries(REWARD_TABLES).map(([name, table]) => [name, simulateRewards(table, rolls, 20260718)]))
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), rollsPerTable: rolls, reports }, null, 2))
