import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC  = 'C:/brad/FlipOut/source-images/police vehicles'
const DEST = 'C:/brad/FlipOut/public/images/cards/policeVehicles'

const MAP = [
  ['ChatGPT Image May 26, 2026, 05_20_33 AM.png',      1],  // Mounted Police Horse — UK
  ['ChatGPT Image May 26, 2026, 05_44_16 AM (1).png',  9],  // Police Snowmobile — Canada
  ['ChatGPT Image May 26, 2026, 05_44_16 AM (2).png',  3],  // Police Patrol Boat — Australia
  ['ChatGPT Image May 26, 2026, 05_44_16 AM (3).png',  10], // Police Tuk-Tuk — Thailand
  ['ChatGPT Image May 26, 2026, 05_44_16 AM (4).png',  4],  // Mounted Police — France
  ['ChatGPT Image May 26, 2026, 05_44_16 AM (5).png',  6],  // Police Interceptor SUV — USA
  ['ChatGPT Image May 26, 2026, 05_44_17 AM (6).png',  5],  // Airbus H135 — Spain
  ['ChatGPT Image May 26, 2026, 05_44_17 AM (7).png',  8],  // Police Bicycle — China
  ['ChatGPT Image May 26, 2026, 05_44_17 AM (8).png',  7],  // Police Van — Finland
  ['ChatGPT Image May 26, 2026, 05_44_17 AM (9).png',  2],  // BMW R 1250 RT — Germany
]

let ok = 0, fail = 0
for (const [filename, cardNum] of MAP) {
  const src  = `${SRC}/${filename}`
  const dest = `${DEST}/${cardNum}.webp`
  try {
    await sharp(src).resize(400, 400, { fit: 'cover' }).webp({ quality: 90 }).toFile(dest)
    console.log(`✓ ${cardNum}.webp`)
    ok++
  } catch (e) {
    console.error(`✗ ${cardNum} (${filename}): ${e.message}`)
    fail++
  }
}
console.log(`\nDone: ${ok} ok, ${fail} failed`)
