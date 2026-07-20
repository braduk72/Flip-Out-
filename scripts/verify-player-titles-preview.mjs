import { spawnSync } from 'node:child_process'

const steps = [
  ['node', ['scripts/run-economy-migration.mjs', '--apply']],
  ['node', ['--test', 'tests/player-titles.test.js', 'tests/player-titles-db.test.js', 'tests/foundation.test.js']],
  ['npx', ['vitest', 'run', 'tests-ui/components.test.jsx', 'tests-ui/settings-title.test.jsx', 'tests-ui/home.test.jsx']],
  ['npx', ['vite', 'build']],
]

for (const [command, args] of steps) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

