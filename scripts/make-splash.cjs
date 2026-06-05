// Create 2732×2732 splash screen (covers all phone/tablet sizes)
// Logo centred on dark purple background
// Output: assets/splash.png  (required by @capacitor/assets)

const sharp = require('sharp')
const path  = require('path')

const SRC  = path.join(__dirname, '..', 'source-images', 'logos', 'logov1.0.webp')
const DEST = path.join(__dirname, '..', 'assets', 'splash.png')

;(async () => {
  const logoBuffer = await sharp(SRC)
    .resize(1400, 1400, { fit: 'contain', background: { r: 13, g: 0, b: 32 } })
    .toBuffer()

  await sharp({
    create: {
      width:      2732,
      height:     2732,
      channels:   4,
      background: { r: 13, g: 0, b: 32, alpha: 1 },  // #0d0020
    }
  })
  .composite([{ input: logoBuffer, gravity: 'centre' }])
  .flatten({ background: '#0d0020' })
  .removeAlpha()
  .png()
  .toFile(DEST)

  console.log('✅  assets/splash.png created')
})()
