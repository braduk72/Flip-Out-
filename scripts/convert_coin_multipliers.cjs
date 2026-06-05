// Converts coin multiplier PNGs → WebP and saves to public/images/
// Usage: node scripts/convert_coin_multipliers.cjs

const sharp = require('sharp')
const path  = require('path')

const SRC = path.resolve(__dirname, '../public/images/downloads/coin_multiplier_set')
const DST = path.resolve(__dirname, '../public/images')

const MULTS = ['x1', 'x5', 'x10', 'x15', 'x20', 'x25', 'x50', 'x100']

async function main() {
  for (const m of MULTS) {
    const src = path.join(SRC, `coin_multiplier_${m}.png`)
    const dst = path.join(DST, `coin_mult_${m}.webp`)
    const info = await sharp(src).webp({ quality: 90 }).toFile(dst)
    console.log(`✓ coin_mult_${m}.webp  (${info.width}×${info.height})`)
  }
  console.log('\nAll done.')
}

main().catch(console.error)
