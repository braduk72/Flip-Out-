import sharp from 'sharp'

const coin = await sharp('public/images/coin_mult_x1.webp')
  .extract({ left: 0, top: 0, width: 118, height: 132 })
  .toBuffer()

const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="242" height="132">
  <text x="121" y="104"
    font-family="Impact, Arial Black, sans-serif"
    font-size="80" font-weight="900"
    text-anchor="middle"
    fill="none"
    stroke="#4a0080" stroke-width="14" stroke-linejoin="round">X100</text>
  <text x="121" y="104"
    font-family="Impact, Arial Black, sans-serif"
    font-size="80" font-weight="900"
    text-anchor="middle"
    fill="#FFE44D">X100</text>
</svg>`

const textImg = await sharp(Buffer.from(svgStr), { density: 300 })
  .resize(242, 132)
  .toBuffer()

await sharp({ create: { width: 360, height: 132, channels: 4, background: { r:0, g:0, b:0, alpha:0 } } })
  .composite([
    { input: coin,    left: 0,   top: 0 },
    { input: textImg, left: 118, top: 0 },
  ])
  .webp({ quality: 90 })
  .toFile('public/images/coin_mult_x100.webp')

console.log('✓ coin_mult_x100.webp generated')
