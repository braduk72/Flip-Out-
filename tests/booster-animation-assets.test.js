import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

test('approved booster strip is sliced into ten transparent square WebP keyframes', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/ui/booster-animation/frames.json', import.meta.url), 'utf8'))
  assert.equal(manifest.source.grid, '5x2')
  assert.equal(manifest.frames.length, 10)
  for (const [index, frame] of manifest.frames.entries()) {
    assert.equal(frame.file, `booster_${String(index + 1).padStart(2, '0')}.webp`)
    const file = fileURLToPath(new URL(`../public/ui/booster-animation/${frame.file}`, import.meta.url))
    assert.ok((await stat(file)).size > 3000)
    const metadata = await sharp(file).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, 512)
    assert.equal(metadata.height, 512)
    assert.equal(metadata.hasAlpha, true)
  }
})
