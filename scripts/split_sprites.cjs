/**
 * split_sprites.js
 * Splits background-removed sprite sheets from downloads/ into individual WebP files.
 * Run: node scripts/split_sprites.js
 */

const sharp = require('sharp')
const path  = require('path')

const SRC = path.resolve(__dirname, '../public/images/downloads')
const DST = path.resolve(__dirname, '../public/images')

// ── Detect content bands (non-transparent strips) along one axis ──────────────
async function detectBands(srcPath, axis) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const bands = []
  let inContent = false
  let start = 0

  const limit = axis === 'col' ? width : height

  for (let i = 0; i < limit; i++) {
    let hasContent = false

    if (axis === 'col') {
      for (let y = 0; y < height; y++) {
        const a = (y * width + i) * channels + 3
        if (data[a] > 10) { hasContent = true; break }
      }
    } else {
      for (let x = 0; x < width; x++) {
        const a = (i * width + x) * channels + 3
        if (data[a] > 10) { hasContent = true; break }
      }
    }

    if (hasContent && !inContent)  { start = i; inContent = true }
    else if (!hasContent && inContent) { bands.push([start, i - 1]); inContent = false }
  }
  if (inContent) bands.push([start, limit - 1])
  return bands
}

// ── Extract and save one cell ─────────────────────────────────────────────────
async function extractCell(srcPath, left, top, w, h, outPath, resize) {
  let pipeline = sharp(srcPath)
    .extract({ left, top, width: w, height: h })

  if (resize) {
    const { fit, width: rw, height: rh } = resize
    pipeline = pipeline.resize(rw, rh, {
      fit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
  }

  await pipeline.webp({ quality: 92 }).toFile(outPath)
}

// ── Split one sheet ────────────────────────────────────────────────────────────
async function splitSheet({ file, rowNames, resize }) {
  const srcPath = path.join(SRC, file)

  const colBands = await detectBands(srcPath, 'col')
  const rowBands = await detectBands(srcPath, 'row')

  console.log(`\n📄 ${file}`)
  console.log(`   Cols (${colBands.length}): ${colBands.map(b => `${b[0]}–${b[1]}`).join(', ')}`)
  console.log(`   Rows (${rowBands.length}): ${rowBands.map(b => `${b[0]}–${b[1]}`).join(', ')}`)

  if (rowBands.length !== rowNames.length) {
    console.warn(`   ⚠️  Expected ${rowNames.length} rows, got ${rowBands.length}`)
  }

  const results = []

  for (let r = 0; r < rowBands.length; r++) {
    const [top, bottom] = rowBands[r]
    const rowName = rowNames[r] ?? `row${r}`

    for (let c = 0; c < colBands.length; c++) {
      const [left, right] = colBands[c]
      const frame = c + 1
      const outName = `${rowName}${frame}.webp`
      const outPath = path.join(DST, outName)

      await extractCell(
        srcPath,
        left, top,
        right - left + 1,
        bottom - top + 1,
        outPath,
        resize
      )

      console.log(`   ✓ ${outName}`)
      results.push(outName)
    }
  }

  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔪 Splitting sprite sheets...')

  // ROBOMICE  (b469468d): 4 cols × 3 rows → mg/mo/mp, 4 frames each
  await splitSheet({
    file:     'b469468d-6c36-4fa1-aa4d-ec7d0a5dc3ec.png',
    rowNames: ['mg', 'mo', 'mp'],
    resize:   { fit: 'contain', width: 96, height: 96 },
  })

  // TESLA COILS  (b2f5339f): 4 cols × 3 rows → tc_b/tc_y/tc_p, 4 frames each
  await splitSheet({
    file:     'b2f5339f-9138-4ebe-812d-3bb11c366010.png',
    rowNames: ['tc_b', 'tc_y', 'tc_p'],
    resize:   { fit: 'contain', width: 128, height: 128 },
  })

  // FLAT CLOUDS  (086ae154): 3 cols × 4 rows → cld_fw/fm/fd/fs, 3 variants each
  await splitSheet({
    file:     '086ae154-c108-4206-a0aa-4afcb01bb3ca.png',
    rowNames: ['cld_fw', 'cld_fm', 'cld_fd', 'cld_fs'],
    resize:   { fit: 'inside', width: 420, height: 420 },
  })

  // PUFFBALL CLOUDS  (2e40cd2f): 4 cols × 3 rows → cld_pw/pm/pd, 4 variants each
  await splitSheet({
    file:     '2e40cd2f-a6bb-4cf4-840d-c6d15d770997.png',
    rowNames: ['cld_pw', 'cld_pm', 'cld_pd'],
    resize:   { fit: 'inside', width: 320, height: 320 },
  })

  console.log('\n✅ All sprites extracted.')
}

main().catch(err => { console.error(err); process.exit(1) })
