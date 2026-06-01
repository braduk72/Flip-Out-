// Convert Shapes & Colours Peep-Oh PNGs → WebP, named 1.webp – 20.webp
// Source: source-images/Peep-Oh!/Shapes and Colours/
// Dest:   public/images/peepoh/shapes-colours/cards/

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const SRC  = path.join(__dirname, '..', 'source-images', 'Peep-Oh!', 'Shapes and Colours')
const DEST = path.join(__dirname, '..', 'public', 'images', 'peepoh', 'shapes-colours', 'cards')

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'))

function parseSortKey(filename) {
  const timeMatch = filename.match(/(\d{2})_(\d{2})_(\d{2}) (AM|PM)/)
  if (!timeMatch) throw new Error(`Can't parse time: ${filename}`)
  let h = parseInt(timeMatch[1])
  const m = parseInt(timeMatch[2])
  const s = parseInt(timeMatch[3])
  if (timeMatch[4] === 'PM' && h !== 12) h += 12
  const totalSecs = h * 3600 + m * 60 + s
  const numMatch = filename.match(/\((\d+)\)/)
  const n = numMatch ? parseInt(numMatch[1]) : 0  // 0 = the standalone first file
  return [totalSecs, n]
}

files.sort((a, b) => {
  const ka = parseSortKey(a)
  const kb = parseSortKey(b)
  if (ka[0] !== kb[0]) return ka[0] - kb[0]
  return ka[1] - kb[1]
})

console.log(`Found ${files.length} files`)

;(async () => {
  fs.mkdirSync(DEST, { recursive: true })
  for (let i = 0; i < files.length; i++) {
    const cardNum  = i + 1
    const srcPath  = path.join(SRC, files[i])
    const destPath = path.join(DEST, `${cardNum}.webp`)
    await sharp(srcPath).webp({ quality: 85 }).toFile(destPath)
    console.log(`✓ ${cardNum}.webp  ←  ${files[i]}`)
  }
  console.log(`\n✅ Done — ${files.length} cards → ${DEST}`)
})()
