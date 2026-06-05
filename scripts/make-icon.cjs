// Create 1024×1024 app icon
// Source: logov1.0.webp — already square with background, use directly
// Output: assets/icon-only.png  (required by @capacitor/assets)

const sharp = require('sharp')
const path  = require('path')

const SRC  = path.join(__dirname, '..', 'source-images', 'logos', 'logov1.0.webp')
const DEST = path.join(__dirname, '..', 'assets', 'icon-only.png')

;(async () => {
  await sharp(SRC)
    .resize(1024, 1024, { fit: 'cover' })
    .removeAlpha()
    .png()
    .toFile(DEST)

  console.log('✅  assets/icon-only.png created')
})()
