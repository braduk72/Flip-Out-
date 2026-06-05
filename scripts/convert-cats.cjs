// Convert new Cats deck PNGs → WebP, named 1.webp – 50.webp
// Source: source-images/newCats/
// Dest:   public/images/cards/cats/

const sharp  = require('sharp')
const fs     = require('fs')
const path   = require('path')

const SRC  = path.join(__dirname, '..', 'source-images', 'newCats')
const DEST = path.join(__dirname, '..', 'public', 'images', 'cards', 'cats')

// Read all PNGs
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'))

// Parse each filename to extract a sort key: [minutes, seconds, inBatchNum]
// Filename pattern: "ChatGPT Image May 29, 2026, HH_MM_SS PM (N).png"
function parseSortKey(filename) {
  const timeMatch  = filename.match(/(\d{2})_(\d{2})_(\d{2}) (AM|PM)/)
  const numMatch   = filename.match(/\((\d+)\)/)
  if (!timeMatch || !numMatch) throw new Error(`Can't parse: ${filename}`)
  let h = parseInt(timeMatch[1])
  const m = parseInt(timeMatch[2])
  const s = parseInt(timeMatch[3])
  if (timeMatch[4] === 'PM' && h !== 12) h += 12
  const totalSecs = h * 3600 + m * 60 + s
  return [totalSecs, parseInt(numMatch[1])]
}

// Sort by [timestamp, inBatchNum]
files.sort((a, b) => {
  const ka = parseSortKey(a)
  const kb = parseSortKey(b)
  if (ka[0] !== kb[0]) return ka[0] - kb[0]
  return ka[1] - kb[1]
})

if (files.length !== 50) {
  console.warn(`⚠ Expected 50 files, found ${files.length}`)
}

;(async () => {
  fs.mkdirSync(DEST, { recursive: true })

  for (let i = 0; i < files.length; i++) {
    const cardNum  = i + 1
    const srcPath  = path.join(SRC, files[i])
    const destPath = path.join(DEST, `${cardNum}.webp`)

    await sharp(srcPath)
      .webp({ quality: 85 })
      .toFile(destPath)

    console.log(`✓ ${cardNum}.webp  ←  ${files[i]}`)
  }

  console.log(`\n✅ Done — ${files.length} cards converted to ${DEST}`)
})()
