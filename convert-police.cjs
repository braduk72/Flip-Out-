const sharp = require('sharp')
const path  = require('path')

const src = 'C:/brad/FlipOut/source-images/police vehicles/'
const out = 'C:/brad/FlipOut/public/images/cards/policeVehicles/'

const jobs = [
  // New back & gold
  ['3c7fd9f5-5eb6-406c-96d3-bf13c67fb3d1.png', 'back.webp'],
  ['gold.png', 'gold.webp'],

  // Cards 11-20 — batch 07_26
  ['ChatGPT Image May 27, 2026, 07_26_06 AM (1).png',  '11.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_06 AM (2).png',  '12.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_06 AM (3).png',  '13.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_06 AM (4).png',  '14.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_07 AM (5).png',  '15.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_07 AM (6).png',  '16.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_07 AM (7).png',  '17.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_07 AM (8).png',  '18.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_07 AM (9).png',  '19.webp'],
  ['ChatGPT Image May 27, 2026, 07_26_08 AM (10).png', '20.webp'],

  // Cards 21-30 — batch 07_30
  ['ChatGPT Image May 27, 2026, 07_30_01 AM (1).png',  '21.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_01 AM (2).png',  '22.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_01 AM (3).png',  '23.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_02 AM (4).png',  '24.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_02 AM (5).png',  '25.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_02 AM (6).png',  '26.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_02 AM (7).png',  '27.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_02 AM (8).png',  '28.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_03 AM (9).png',  '29.webp'],
  ['ChatGPT Image May 27, 2026, 07_30_03 AM (10).png', '30.webp'],

  // Cards 31-40 — batch 07_34
  ['ChatGPT Image May 27, 2026, 07_34_04 AM (1).png',  '31.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_04 AM (2).png',  '32.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_05 AM (3).png',  '33.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_05 AM (4).png',  '34.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_05 AM (5).png',  '35.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_05 AM (6).png',  '36.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_06 AM (7).png',  '37.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_06 AM (8).png',  '38.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_06 AM (9).png',  '39.webp'],
  ['ChatGPT Image May 27, 2026, 07_34_06 AM (10).png', '40.webp'],

  // Cards 41-50 — batch 07_45
  ['ChatGPT Image May 27, 2026, 07_45_39 AM (1).png',  '41.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_40 AM (2).png',  '42.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_40 AM (3).png',  '43.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_40 AM (4).png',  '44.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_40 AM (5).png',  '45.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_40 AM (6).png',  '46.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_41 AM (7).png',  '47.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_41 AM (8).png',  '48.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_41 AM (9).png',  '49.webp'],
  ['ChatGPT Image May 27, 2026, 07_45_41 AM (10).png', '50.webp'],

  // Cards 51-60 — batch 12_00 (NEW)
  ['ChatGPT Image May 27, 2026, 12_00_04 PM (1).png',  '51.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_05 PM (2).png',  '52.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_05 PM (3).png',  '53.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_05 PM (4).png',  '54.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_06 PM (5).png',  '55.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_06 PM (6).png',  '56.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_06 PM (7).png',  '57.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_07 PM (8).png',  '58.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_07 PM (9).png',  '59.webp'],
  ['ChatGPT Image May 27, 2026, 12_00_07 PM (10).png', '60.webp'],
]

async function run() {
  let ok = 0, fail = 0
  for (const [srcFile, dstFile] of jobs) {
    try {
      await sharp(path.join(src, srcFile))
        .webp({ quality: 88 })
        .toFile(path.join(out, dstFile))
      console.log(`✓  ${dstFile}`)
      ok++
    } catch (e) {
      console.error(`✗  ${dstFile}: ${e.message}`)
      fail++
    }
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed`)
}

run()
