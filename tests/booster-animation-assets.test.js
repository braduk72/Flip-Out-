import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ASSET_ROOT = new URL('../public/ui/booster-opening/themed/', import.meta.url)

test('approved irregular themed strip becomes eleven centred transparent WebP keyframes', async () => {
  const manifest = JSON.parse(await readFile(new URL('frames.json', ASSET_ROOT), 'utf8'))
  assert.equal(manifest.source.width, 768)
  assert.equal(manifest.source.height, 1376)
  assert.deepEqual(manifest.source.layout, [3, 3, 3, 2])
  assert.equal(manifest.frames.length, 11)
  assert.deepEqual(manifest.canvas, { width: 640, height: 640, registration: { x: 320, y: 320 }, scale: 1, padding: 6 })

  for (const [index, frame] of manifest.frames.entries()) {
    assert.equal(frame.file, `booster-open-${String(index + 1).padStart(2, '0')}.webp`)
    assert.deepEqual(frame.canvas, { width: 640, height: 640 })
    assert.deepEqual(frame.registration, { x: 320, y: 320 })
    const file = fileURLToPath(new URL(frame.file, ASSET_ROOT))
    assert.ok((await stat(file)).size > 1500)
    const metadata = await sharp(file).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, 640)
    assert.equal(metadata.height, 640)
    assert.equal(metadata.hasAlpha, true)
  }
})

test('the Frame 10 group keeps its detached wrapper remnant and source crops do not overlap neighbours', async () => {
  const manifest = JSON.parse(await readFile(new URL('frames.json', ASSET_ROOT), 'utf8'))
  const tenth = manifest.frames[9]
  assert.equal(tenth.detachedWrapperRemnant, true)
  assert.ok(tenth.cropBounds.height > 290, 'Frame 10 crop must retain the lower detached wrapper remnant')

  for (let row = 1; row <= 4; row += 1) {
    const inRow = manifest.frames.filter(frame => frame.row === row).sort((a, b) => a.cropBounds.left - b.cropBounds.left)
    for (let index = 1; index < inRow.length; index += 1) {
      const previous = inRow[index - 1].cropBounds
      const current = inRow[index].cropBounds
      assert.ok(previous.left + previous.width < current.left, `row ${row} source crops must not leak into a neighbour`)
    }
  }
})
