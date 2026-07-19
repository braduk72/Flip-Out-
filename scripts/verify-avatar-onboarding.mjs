import { spawnSync } from 'node:child_process'

const commands = [
  ['node', ['--test', '--test-concurrency=1', 'tests/avatars.test.js', 'tests/avatars-db.test.js', 'tests/nickname.test.js', 'tests/nickname-db.test.js']],
  [process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vitest', 'run', '--config', 'vitest.config.js', 'tests-ui/nickname-onboarding.test.jsx', 'tests-ui/home.test.jsx', 'tests-ui/components.test.jsx']],
]

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
