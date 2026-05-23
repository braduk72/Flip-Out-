import Jimp from 'jimp'

const FILES = [
  './public/images/globe1.png',
]

const THRESHOLD = 40  // per-channel tolerance — same as used for 6.png

for (const src of FILES) {
  console.log(`\nProcessing: ${src}`)
  const img = await Jimp.read(src)
  const { width, height, data } = img.bitmap

  // Sample the 4 corners to get the background colour
  function px(x, y) {
    const i = (y * width + x) * 4
    return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] }
  }
  const corners = [px(0,0), px(width-1,0), px(0,height-1), px(width-1,height-1)]
  const bg = {
    r: Math.round(corners.reduce((s,c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s,c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s,c) => s + c.b, 0) / 4),
  }
  console.log(`  Corner sample → bg RGB: (${bg.r}, ${bg.g}, ${bg.b})`)

  img.scan(0, 0, width, height, function(x, y, idx) {
    const r = data[idx], g = data[idx+1], b = data[idx+2]
    if (
      Math.abs(r - bg.r) <= THRESHOLD &&
      Math.abs(g - bg.g) <= THRESHOLD &&
      Math.abs(b - bg.b) <= THRESHOLD
    ) {
      data[idx + 3] = 0  // make transparent
    }
  })

  await img.writeAsync(src)
  console.log(`  ✓  Saved: ${src}`)
}

console.log('\nDone.')
