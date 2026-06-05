import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC  = 'C:/brad/FlipOut/source-images/Fighter Jets'
const DEST = 'C:/brad/FlipOut/public/images/cards/fighterJets'

const MAP = [
  // batch 02:42 → cards 1–9
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (1).png',  1],
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (2).png',  2],
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (3).png',  3],
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (4).png',  4],
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (5).png',  5],
  ['ChatGPT Image May 26, 2026, 02_42_20 AM (6).png',  6],
  ['ChatGPT Image May 26, 2026, 02_42_21 AM (7).png',  7],
  ['ChatGPT Image May 26, 2026, 02_42_21 AM (8).png',  8],
  ['ChatGPT Image May 26, 2026, 02_42_21 AM (9).png',  9],
  // batch 03:00 → cards 10–19
  ['ChatGPT Image May 26, 2026, 03_00_22 AM (1).png',  10],
  ['ChatGPT Image May 26, 2026, 03_00_22 AM (2).png',  11],
  ['ChatGPT Image May 26, 2026, 03_00_22 AM (3).png',  12],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (4).png',  13],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (5).png',  14],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (6).png',  15],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (7).png',  16],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (8).png',  17],
  ['ChatGPT Image May 26, 2026, 03_00_23 AM (9).png',  18],
  ['ChatGPT Image May 26, 2026, 03_00_24 AM (10).png', 19],
  // batch 03:04 → cards 20–29
  ['ChatGPT Image May 26, 2026, 03_04_00 AM (1).png',  20],
  ['ChatGPT Image May 26, 2026, 03_04_00 AM (2).png',  21],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (3).png',  22],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (4).png',  23],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (5).png',  24],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (6).png',  25],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (7).png',  26],
  ['ChatGPT Image May 26, 2026, 03_04_01 AM (8).png',  27],
  ['ChatGPT Image May 26, 2026, 03_04_02 AM (9).png',  28],
  ['ChatGPT Image May 26, 2026, 03_04_02 AM (10).png', 29],
  // batch 03:11 → cards 30–39
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (1).png',  30],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (2).png',  31],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (3).png',  32],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (4).png',  33],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (5).png',  34],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (6).png',  35],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (7).png',  36],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (8).png',  37],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (9).png',  38],
  ['ChatGPT Image May 26, 2026, 03_11_13 AM (10).png', 39],
  // UUID → card 40
  ['07361ea4-6a3b-495a-9b51-275dd6587ed4.png',         40],
  // batch 04:29 → cards 41–50
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (1).png',  41],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (2).png',  42],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (3).png',  43],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (4).png',  44],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (5).png',  45],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (6).png',  46],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (7).png',  47],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (8).png',  48],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (9).png',  49],
  ['ChatGPT Image May 26, 2026, 04_29_24 AM (10).png', 50],
  // batch 04:50 → cards 51–60
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (1).png',  51],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (2).png',  52],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (3).png',  53],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (4).png',  54],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (5).png',  55],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (6).png',  56],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (7).png',  57],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (8).png',  58],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (9).png',  59],
  ['ChatGPT Image May 26, 2026, 04_50_29 AM (10).png', 60],
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
