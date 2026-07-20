import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../src/screens/Match3.module.css', import.meta.url), 'utf8')

test('settled Match-3 board has no infinite full-board or per-tile decorative animation', () => {
  assert.doesNotMatch(css, /\.game::before\s*{[^}]*animation\s*:/s)
  assert.doesNotMatch(css, /\.tile:not\(\.hole\)\s*{[^}]*infinite/s)
  assert.doesNotMatch(css, /\.special_row::after\s*{[^}]*infinite/s)
  assert.doesNotMatch(css, /\.special_col::after\s*{[^}]*infinite/s)
  assert.doesNotMatch(css, /\.special_wrapped::after\s*{[^}]*infinite/s)
  assert.doesNotMatch(css, /\.special_color::after\s*{[^}]*infinite/s)
})

test('settled Match-3 hint animation is finite after the delayed hint appears', () => {
  const hintRule = css.match(/\.hintedTile\s*{[^}]+}/s)?.[0] ?? ''
  assert.match(hintRule, /hintPulse/)
  assert.doesNotMatch(hintRule, /infinite/)
})
