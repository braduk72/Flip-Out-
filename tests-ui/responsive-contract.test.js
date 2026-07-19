import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from 'vitest'

test('Home and shared components encode safe-area and representative responsive contracts', async () => {
  const fromWorkspace = (file) => join(process.cwd(), file)
  const [home, components, index] = await Promise.all([
    readFile(fromWorkspace('src/screens/Home.module.css'), 'utf8'),
    readFile(fromWorkspace('src/ui/components.module.css'), 'utf8'),
    readFile(fromWorkspace('src/index.css'), 'utf8'),
  ])
  expect(index).not.toMatch(/min\(390px/)
  expect(index).not.toMatch(/min\(844px/)
  expect(home).toMatch(/max\(16px, env\(safe-area-inset-right\)\)/)
  expect(components).toMatch(/env\(safe-area-inset-top\)/)
  expect(components).toMatch(/env\(safe-area-inset-bottom\)/)
  expect(components).toMatch(/@media \(max-width: 360px\)/)
  expect(components).toMatch(/@media \(min-width: 768px\)/)
  expect(home).toMatch(/orientation: landscape/)
  expect(components).toMatch(/min-height: 44px/)
  expect(components).toMatch(/min-height: 48px/)
})
