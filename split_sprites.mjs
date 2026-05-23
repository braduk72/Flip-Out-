import Jimp from 'jimp'
import path from 'path'

const SRC   = './public/images/downloads/b469468d-6c36-4fa1-aa4d-ec7d0a5dc3ec.png'
const OUT   = './public/images'
const COLS  = 4
const ROWS  = 3
const NAMES = ['g', 'o', 'p']   // teal, orange, pink

const img = await Jimp.read(SRC)
const fw = Math.floor(img.bitmap.width  / COLS)
const fh = Math.floor(img.bitmap.height / ROWS)

console.log(`Sheet: ${img.bitmap.width}×${img.bitmap.height}  →  frames: ${fw}×${fh}`)

for (let row = 0; row < ROWS; row++) {
  const colour = NAMES[row]
  for (let col = 0; col < COLS; col++) {
    const frame    = col + 1
    const filename = `m${colour}${frame}.png`
    const clone    = img.clone().crop(col * fw, row * fh, fw, fh)
    const outPath  = path.join(OUT, filename)
    await clone.writeAsync(outPath)
    console.log(`  ✓  ${filename}`)
  }
}

console.log('\nDone — 12 frames written to public/images/')
