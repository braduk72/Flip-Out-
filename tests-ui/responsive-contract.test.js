import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from 'vitest'

test('Home and shared components encode safe-area and representative responsive contracts', async () => {
  const fromWorkspace = (file) => join(process.cwd(), file)
  const [home, components, index, routes] = await Promise.all([
    readFile(fromWorkspace('src/screens/Home.module.css'), 'utf8'),
    readFile(fromWorkspace('src/ui/components.module.css'), 'utf8'),
    readFile(fromWorkspace('src/index.css'), 'utf8'),
    readFile(fromWorkspace('src/ui/route-consolidation.css'), 'utf8'),
  ])
  expect(index).not.toMatch(/min\(390px/)
  expect(index).not.toMatch(/min\(844px/)
  expect(home).toMatch(/max\(16px, env\(safe-area-inset-right\)\)/)
  expect(components).toMatch(/env\(safe-area-inset-top\)/)
  expect(components).toMatch(/env\(safe-area-inset-bottom\)/)
  expect(components).toMatch(/@media \(max-width: 360px\)/)
  expect(components).toMatch(/@media \(min-width: 768px\)/)
  expect(home).not.toMatch(/max-height:[^}]+orientation: landscape/s)
  expect(index).toMatch(/@media \(pointer: coarse\)/)
  expect(index).toMatch(/min-width: 44px/)
  expect(index).toMatch(/min-height: 44px/)
  expect(components).toMatch(/scroll-snap-type: x mandatory/)
  expect(components).toMatch(/-webkit-overflow-scrolling: touch/)
  expect(components).toMatch(/\.carouselDots button \{[^}]*width: 44px;[^}]*min-width: 44px;[^}]*height: 44px/s)
  expect(components).not.toMatch(/\.carouselArrow \{ position: absolute/)
  expect(components).toMatch(/min-height: 44px/)
  expect(components).toMatch(/min-height: 48px/)
  expect(routes).toMatch(/var\(--fo-safe-top\)/)
  expect(routes).toMatch(/var\(--fo-safe-left\)/)
  expect(routes).toMatch(/var\(--fo-safe-right\)/)
  expect(routes).toMatch(/@media \(min-width: 768px\)/)
})
