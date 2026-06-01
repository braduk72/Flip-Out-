const sharp = require('sharp')
const path  = require('path')

const src = 'C:/brad/FlipOut/source-images/Masters of the Lost World/'
const out = 'C:/brad/FlipOut/public/images/cards/mastersOfTheLostWorld/'

const jobs = [
  ['card back.png', 'back.webp'],
  ['gold.png',      'gold.webp'],

  // Card 1 — T-rex (standalone UUID file)
  ['2da8cee9-d246-4754-9752-7d69f4a7bbb9.png', '1.webp'],

  // Cards 2-11 — batch 12_53
  ['ChatGPT Image May 27, 2026, 12_53_30 PM (1).png',  '2.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_31 PM (2).png',  '3.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_31 PM (3).png',  '4.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_31 PM (4).png',  '5.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_31 PM (5).png',  '6.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_32 PM (6).png',  '7.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_32 PM (7).png',  '8.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_32 PM (8).png',  '9.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_33 PM (9).png',  '10.webp'],
  ['ChatGPT Image May 27, 2026, 12_53_33 PM (10).png', '11.webp'],

  // Cards 12-21 — batch 01_02
  ['ChatGPT Image May 27, 2026, 01_02_07 PM (1).png',  '12.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_07 PM (2).png',  '13.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (3).png',  '14.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (4).png',  '15.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (5).png',  '16.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (6).png',  '17.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (7).png',  '18.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_08 PM (8).png',  '19.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_09 PM (9).png',  '20.webp'],
  ['ChatGPT Image May 27, 2026, 01_02_09 PM (10).png', '21.webp'],

  // Cards 22-31 — batch 01_20
  ['ChatGPT Image May 27, 2026, 01_20_46 PM (1).png',  '22.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_46 PM (2).png',  '23.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_46 PM (3).png',  '24.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (4).png',  '25.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (5).png',  '26.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (6).png',  '27.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (7).png',  '28.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (8).png',  '29.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (9).png',  '30.webp'],
  ['ChatGPT Image May 27, 2026, 01_20_47 PM (10).png', '31.webp'],

  // Cards 32-41 — batch 01_25
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (1).png',  '32.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (2).png',  '33.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (3).png',  '34.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (4).png',  '35.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (5).png',  '36.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_00 PM (6).png',  '37.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_01 PM (7).png',  '38.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_01 PM (8).png',  '39.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_01 PM (9).png',  '40.webp'],
  ['ChatGPT Image May 27, 2026, 01_25_02 PM (10).png', '41.webp'],

  // Cards 42-51 — batch 01_30
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (1).png',  '42.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (2).png',  '43.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (3).png',  '44.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (4).png',  '45.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (5).png',  '46.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_00 PM (6).png',  '47.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_01 PM (7).png',  '48.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_01 PM (8).png',  '49.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_01 PM (9).png',  '50.webp'],
  ['ChatGPT Image May 27, 2026, 01_30_01 PM (10).png', '51.webp'],

  // Cards 52-61 — batch 01_39
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (1).png',  '52.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (2).png',  '53.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (3).png',  '54.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (4).png',  '55.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (5).png',  '56.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (6).png',  '57.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (7).png',  '58.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (8).png',  '59.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (9).png',  '60.webp'],
  ['ChatGPT Image May 27, 2026, 01_39_04 PM (10).png', '61.webp'],

  // Cards 62-70 — batch 01_44 (9 files)
  ['ChatGPT Image May 27, 2026, 01_44_48 PM (1).png',  '62.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (2).png',  '63.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (3).png',  '64.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (4).png',  '65.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (5).png',  '66.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (6).png',  '67.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_49 PM (7).png',  '68.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_50 PM (8).png',  '69.webp'],
  ['ChatGPT Image May 27, 2026, 01_44_50 PM (9).png',  '70.webp'],
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
