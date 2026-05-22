import Jimp from 'jimp'
import path from 'path'

const OUT = './public/images'

const SHEETS = [
  {
    src:   './public/images/downloads/b2f5339f-9138-4ebe-812d-3bb11c366010.png',
    cols:  4, rows: 3,
    names: ['tc_b', 'tc_y', 'tc_p'],   // tesla coils: blue, yellow, pink
    desc:  'Tesla coils',
  },
  {
    src:   './public/images/downloads/2e40cd2f-a6bb-4cf4-840d-c6d15d770997.png',
    cols:  4, rows: 3,
    names: ['cld_pw', 'cld_pm', 'cld_pd'],  // puffball: white, mid, dark
    desc:  'Cloud sheet A (puffballs)',
  },
  {
    src:   './public/images/downloads/086ae154-c108-4206-a0aa-4afcb01bb3ca.png',
    cols:  3, rows: 4,
    names: ['cld_fw', 'cld_fm', 'cld_fd', 'cld_fs'],  // flat: white, mid, dark, smoke
    desc:  'Cloud sheet B (flat/storm)',
  },
]

for (const sheet of SHEETS) {
  console.log(`\n── ${sheet.desc} ──`)
  const img = await Jimp.read(sheet.src)
  const fw  = Math.floor(img.bitmap.width  / sheet.cols)
  const fh  = Math.floor(img.bitmap.height / sheet.rows)
  console.log(`  Sheet: ${img.bitmap.width}×${img.bitmap.height}  →  frames: ${fw}×${fh}`)

  for (let row = 0; row < sheet.rows; row++) {
    const prefix = sheet.names[row]
    for (let col = 0; col < sheet.cols; col++) {
      const frame    = col + 1
      const filename = `${prefix}${frame}.png`
      const clone    = img.clone().crop(col * fw, row * fh, fw, fh)
      await clone.writeAsync(path.join(OUT, filename))
      console.log(`  ✓  ${filename}`)
    }
  }
}

console.log('\nDone.')
