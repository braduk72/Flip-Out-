import { spawnSync } from 'node:child_process'

const commands = [
  ['node', ['--test', 'tests/match3-input.test.js', 'tests/match3-engine.test.js', 'tests/match3-presentation.test.js', 'tests/match3-token-assets.test.js']],
  [process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vitest', 'run', '--config', 'vitest.config.js', 'tests-ui/match3-input.test.jsx', 'tests-ui/match3-token-art.test.jsx', 'tests-ui/match3-preview.test.jsx']],
]

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
