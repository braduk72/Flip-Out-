const sharp = require('sharp')
const path  = require('path')

const src = 'C:/brad/FlipOut/source-images/Supercars/'
const out = 'C:/brad/FlipOut/public/images/cards/sportscars/'

// [source filename, output filename]
// Output numbers are sequential 1-68 (card 59 doesn't exist on the cards;
// batch 10_45 printed 60-69 — stored here as files 59-68 to keep it consecutive)
const jobs = [
  // back & gold
  ['back.png', 'back.webp'],
  ['gold.png', 'gold.webp'],

  // Batch 08_03 — cards 1-8 (sequential)
  ['ChatGPT Image May 27, 2026, 08_03_39 AM (1).png', '1.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_39 AM (2).png', '2.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_39 AM (3).png', '3.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_40 AM (4).png', '4.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_40 AM (5).png', '5.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_40 AM (6).png', '6.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_40 AM (7).png', '7.webp'],
  ['ChatGPT Image May 27, 2026, 08_03_41 AM (8).png', '8.webp'],

  // Batch 08_15 — cards 9-18 (OUT OF ORDER by file)
  ['ChatGPT Image May 27, 2026, 08_15_16 AM (7).png', '9.webp'],   // Koenigsegg Jesko
  ['ChatGPT Image May 27, 2026, 08_15_16 AM (6).png', '10.webp'],  // Pagani Huayra
  ['ChatGPT Image May 27, 2026, 08_15_18 AM (9).png', '11.webp'],  // Maserati MC20
  ['ChatGPT Image May 27, 2026, 08_15_15 AM (2).png', '12.webp'],  // Chevrolet Corvette Z06
  ['ChatGPT Image May 27, 2026, 08_15_15 AM (1).png', '13.webp'],  // Ford GT
  ['ChatGPT Image May 27, 2026, 08_15_19 AM (10).png', '14.webp'], // Acura NSX
  ['ChatGPT Image May 27, 2026, 08_15_17 AM (8).png', '15.webp'],  // Mercedes-AMG One
  ['ChatGPT Image May 27, 2026, 08_15_15 AM (3).png', '16.webp'],  // Lexus LFA
  ['ChatGPT Image May 27, 2026, 08_15_16 AM (5).png', '17.webp'],  // Lotus Evija
  ['ChatGPT Image May 27, 2026, 08_15_15 AM (4).png', '18.webp'],  // Rimac Nevera

  // Batch 08_43 — cards 19-28 (sequential)
  ['ChatGPT Image May 27, 2026, 08_43_00 AM (1).png', '19.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_01 AM (2).png', '20.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_01 AM (3).png', '21.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_01 AM (4).png', '22.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_02 AM (5).png', '23.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_02 AM (6).png', '24.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_02 AM (7).png', '25.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_02 AM (8).png', '26.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_03 AM (9).png', '27.webp'],
  ['ChatGPT Image May 27, 2026, 08_43_03 AM (10).png', '28.webp'],

  // Batch 08_51 — cards 29-38 (sequential)
  ['ChatGPT Image May 27, 2026, 08_51_53 AM (1).png', '29.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_53 AM (2).png', '30.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_54 AM (3).png', '31.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_54 AM (4).png', '32.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_55 AM (5).png', '33.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_55 AM (6).png', '34.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_55 AM (7).png', '35.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_55 AM (8).png', '36.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_56 AM (9).png', '37.webp'],
  ['ChatGPT Image May 27, 2026, 08_51_56 AM (10).png', '38.webp'],

  // Batch 09_28 — cards 39-48 (OUT OF ORDER by file)
  ['ChatGPT Image May 27, 2026, 09_29_02 AM (10).png', '39.webp'], // Pagani Utopia
  ['ChatGPT Image May 27, 2026, 09_29_00 AM (3).png',  '40.webp'], // SSC Tuatara
  ['ChatGPT Image May 27, 2026, 09_29_01 AM (6).png',  '41.webp'], // Czinger 21C
  ['ChatGPT Image May 27, 2026, 09_29_01 AM (7).png',  '42.webp'], // Gordon Murray T.50
  ['ChatGPT Image May 27, 2026, 09_29_00 AM (4).png',  '43.webp'], // Nio EP9
  ['ChatGPT Image May 27, 2026, 09_29_01 AM (8).png',  '44.webp'], // Pininfarina Battista
  ['ChatGPT Image May 27, 2026, 09_29_00 AM (5).png',  '45.webp'], // Apollo Intensa Emozione
  ['ChatGPT Image May 27, 2026, 09_29_01 AM (9).png',  '46.webp'], // Maserati MC20
  ['ChatGPT Image May 27, 2026, 09_28_59 AM (2).png',  '47.webp'], // Lotus Evija
  ['ChatGPT Image May 27, 2026, 09_28_59 AM (1).png',  '48.webp'], // Hispano Suiza Carmen

  // Batch 09_52 — cards 49-58 (sequential)
  ['ChatGPT Image May 27, 2026, 09_52_22 AM (1).png',  '49.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_25 AM (2).png',  '50.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_25 AM (3).png',  '51.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_25 AM (4).png',  '52.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_25 AM (5).png',  '53.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_26 AM (6).png',  '54.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_26 AM (7).png',  '55.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_26 AM (8).png',  '56.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_27 AM (9).png',  '57.webp'],
  ['ChatGPT Image May 27, 2026, 09_52_27 AM (10).png', '58.webp'],

  // Batch 10_45 — printed cards 60-69, stored as files 59-68 (no card 59 exists)
  ['ChatGPT Image May 27, 2026, 10_45_54 AM (1).png',  '59.webp'], // Porsche 918 Spyder
  ['ChatGPT Image May 27, 2026, 10_45_54 AM (2).png',  '60.webp'], // Bugatti Chiron
  ['ChatGPT Image May 27, 2026, 10_45_55 AM (3).png',  '61.webp'], // SSC Tuatara
  ['ChatGPT Image May 27, 2026, 10_45_55 AM (4).png',  '62.webp'], // Koenigsegg Jesko
  ['ChatGPT Image May 27, 2026, 10_45_55 AM (5).png',  '63.webp'], // McLaren Senna
  ['ChatGPT Image May 27, 2026, 10_45_55 AM (6).png',  '64.webp'], // Rimac Nevera
  ['ChatGPT Image May 27, 2026, 10_45_56 AM (7).png',  '65.webp'], // Pagani Huayra BC
  ['ChatGPT Image May 27, 2026, 10_45_56 AM (8).png',  '66.webp'], // Ford GT (2017)
  ['ChatGPT Image May 27, 2026, 10_45_56 AM (9).png',  '67.webp'], // Lamborghini Aventador SVJ
  ['ChatGPT Image May 27, 2026, 10_45_56 AM (10).png', '68.webp'], // Koenigsegg Jesko Absolut
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
