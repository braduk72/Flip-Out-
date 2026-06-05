import sharp from 'sharp'
import path from 'path'

const SRC = 'source-images/Ocean Liners'
const OUT = 'public/images/cards/oceanLiners'

// filename → card number
// 03_01 batch DISCARDED (superseded by 03_08 for cards 11-20)
// 05_01 (10) DISCARDED (Disney Treasure superseded by PM card 51 = MSC Virtuosa)
const MAP = [
  // Cards 1-10 (02_38 AM batch)
  ['ChatGPT Image May 26, 2026, 02_38_17 AM (1).png',  1],
  ['ChatGPT Image May 26, 2026, 02_38_17 AM (2).png',  2],
  ['ChatGPT Image May 26, 2026, 02_38_17 AM (3).png',  3],
  ['ChatGPT Image May 26, 2026, 02_38_17 AM (4).png',  4],
  ['ChatGPT Image May 26, 2026, 02_38_17 AM (5).png',  5],
  ['ChatGPT Image May 26, 2026, 02_38_18 AM (6).png',  6],
  ['ChatGPT Image May 26, 2026, 02_38_18 AM (7).png',  7],
  ['ChatGPT Image May 26, 2026, 02_38_18 AM (8).png',  8],
  ['ChatGPT Image May 26, 2026, 02_38_18 AM (9).png',  9],
  ['ChatGPT Image May 26, 2026, 02_38_18 AM (10).png', 10],
  // Cards 11-20 (03_08 AM batch — replaces earlier 03_01 batch)
  ['ChatGPT Image May 26, 2026, 03_08_53 AM (1).png',  11],
  ['ChatGPT Image May 26, 2026, 03_08_53 AM (2).png',  12],
  ['ChatGPT Image May 26, 2026, 03_08_54 AM (3).png',  13],
  ['ChatGPT Image May 26, 2026, 03_08_54 AM (4).png',  14],
  ['ChatGPT Image May 26, 2026, 03_08_54 AM (5).png',  15],
  ['ChatGPT Image May 26, 2026, 03_08_54 AM (6).png',  16],
  ['ChatGPT Image May 26, 2026, 03_08_54 AM (7).png',  17],
  ['ChatGPT Image May 26, 2026, 03_08_55 AM (8).png',  18],
  ['ChatGPT Image May 26, 2026, 03_08_55 AM (9).png',  19],
  ['ChatGPT Image May 26, 2026, 03_08_55 AM (10).png', 20],
  // Cards 21-30 (03_12 AM batch)
  ['ChatGPT Image May 26, 2026, 03_12_38 AM (1).png',  21],
  ['ChatGPT Image May 26, 2026, 03_12_39 AM (2).png',  22],
  ['ChatGPT Image May 26, 2026, 03_12_39 AM (3).png',  23],
  ['ChatGPT Image May 26, 2026, 03_12_39 AM (4).png',  24],
  ['ChatGPT Image May 26, 2026, 03_12_39 AM (5).png',  25],
  ['ChatGPT Image May 26, 2026, 03_12_39 AM (6).png',  26],
  ['ChatGPT Image May 26, 2026, 03_12_40 AM (7).png',  27],
  ['ChatGPT Image May 26, 2026, 03_12_40 AM (8).png',  28],
  ['ChatGPT Image May 26, 2026, 03_12_40 AM (9).png',  29],
  ['ChatGPT Image May 26, 2026, 03_12_40 AM (10).png', 30],
  // Card 31 (standalone)
  ['6c9d5e64-a256-4a7e-921f-4a8010716a63.png',          31],
  // Cards 32-41 (03_37 AM batch; 36.png fills the missing (5) slot)
  ['ChatGPT Image May 26, 2026, 03_37_06 AM (1).png',  32],
  ['ChatGPT Image May 26, 2026, 03_37_06 AM (2).png',  33],
  ['ChatGPT Image May 26, 2026, 03_37_06 AM (3).png',  34],
  ['ChatGPT Image May 26, 2026, 03_37_07 AM (4).png',  35],
  ['36.png',                                            36],
  ['ChatGPT Image May 26, 2026, 03_37_09 AM (6).png',  37],
  ['ChatGPT Image May 26, 2026, 03_37_09 AM (7).png',  38],
  ['ChatGPT Image May 26, 2026, 03_37_09 AM (8).png',  39],
  ['ChatGPT Image May 26, 2026, 03_37_09 AM (9).png',  40],
  ['ChatGPT Image May 26, 2026, 03_37_10 AM (10).png', 41],
  // Cards 42-50 (05_01 AM batch, first 9 only; (10)=Disney Treasure superseded by PM card 51)
  ['ChatGPT Image May 26, 2026, 05_01_13 AM (1).png',  42],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (2).png',  43],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (3).png',  44],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (4).png',  45],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (5).png',  46],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (6).png',  47],
  ['ChatGPT Image May 26, 2026, 05_01_14 AM (7).png',  48],
  ['ChatGPT Image May 26, 2026, 05_01_15 AM (8).png',  49],
  ['ChatGPT Image May 26, 2026, 05_01_15 AM (9).png',  50],
  // Cards 51-60 (PM batch — newest generation)
  ['ChatGPT Image May 26, 2026, 01_59_09 PM (1).png',  51],
  ['ChatGPT Image May 26, 2026, 01_59_09 PM (2).png',  52],
  ['ChatGPT Image May 26, 2026, 01_59_10 PM (3).png',  53],
  ['ChatGPT Image May 26, 2026, 01_59_12 PM (4).png',  54],
  ['ChatGPT Image May 26, 2026, 01_59_14 PM (5).png',  55],
  ['ChatGPT Image May 26, 2026, 01_59_15 PM (6).png',  56],
  ['ChatGPT Image May 26, 2026, 01_59_17 PM (7).png',  57],
  ['ChatGPT Image May 26, 2026, 01_59_19 PM (8).png',  58],
  ['ChatGPT Image May 26, 2026, 01_59_19 PM (9).png',  59],
  ['ChatGPT Image May 26, 2026, 01_59_19 PM (10).png', 60],
]

let ok = 0, fail = 0
for (const [file, num] of MAP) {
  const src = path.join(SRC, file)
  const out = path.join(OUT, `${num}.webp`)
  try {
    await sharp(src)
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .webp({ quality: 90 })
      .toFile(out)
    console.log(`✓ ${num}.webp  ← ${file}`)
    ok++
  } catch (e) {
    console.error(`✗ ${num}.webp  ← ${file}  ERROR: ${e.message}`)
    fail++
  }
}
console.log(`\nDone: ${ok} ok, ${fail} failed`)
