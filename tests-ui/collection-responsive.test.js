import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from 'vitest'

const source = () => readFile(join(process.cwd(), 'src/screens/Collection.module.css'), 'utf8')

test('Collection is mobile-first, safe-area aware and never uses a fixed phone frame', async () => {
  const css = await source()
  expect(css).toMatch(/height: 100dvh/)
  expect(css).toMatch(/var\(--fo-safe-top\)/)
  expect(css).toMatch(/var\(--fo-safe-right\)/)
  expect(css).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  expect(css).toMatch(/@media \(min-width: 560px\)/)
  expect(css).toMatch(/@media \(min-width: 820px\)/)
  expect(css).not.toMatch(/390px|844px/)
})

test('Collection preserves touch, reduced-motion and incremental-loading contracts', async () => {
  const [css, component] = await Promise.all([
    source(),
    readFile(join(process.cwd(), 'src/screens/Inventory.jsx'), 'utf8'),
  ])
  expect(css).toMatch(/min-height: 44px/)
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  expect(component).toMatch(/PAGE_SIZE = 30/)
  expect(component).toMatch(/loading="lazy"/)
  expect(component).toMatch(/aria-pressed=/)
})
