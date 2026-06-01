import sharp from 'sharp'
import path from 'path'
import { copyFile } from 'fs/promises'

const SRC = 'source-images/space'
const OUT = 'public/images/cards/conquestOfSpace'

// Source file → output card number (sequential by batch generation order)
const MAP = [
  // Cards 1-4: 02_22_18 AM batch
  ['ChatGPT Image May 26, 2026, 02_22_18 AM (1).png',  1],  // Apollo 11 Moon Landing
  ['ChatGPT Image May 26, 2026, 02_22_18 AM (2).png',  2],  // Space Shuttle Discovery
  ['ChatGPT Image May 26, 2026, 02_22_18 AM (3).png',  3],  // International Space Station
  ['ChatGPT Image May 26, 2026, 02_22_18 AM (4).png',  4],  // Mars Rover Perseverance
  // Card 5: standalone
  ['ChatGPT Image May 26, 2026, 02_22_33 AM.png',      5],  // Saturn V Rocket
  // Cards 6-15: 02_22_53 AM batch
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (1).png',  6],  // Sputnik 1
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (2).png',  7],  // James Webb Space Telescope
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (3).png',  8],  // Curiosity Mars Rover
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (4).png',  9],  // Mars Helicopter Ingenuity
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (5).png',  10], // Voyager 1
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (6).png',  11], // Cassini-Huygens
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (7).png',  12], // New Horizons
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (8).png',  13], // Tiangong Space Station
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (9).png',  14], // Apollo Lunar Rover
  ['ChatGPT Image May 26, 2026, 02_22_53 AM (10).png', 15], // Artemis SLS Rocket
  // Cards 16-25: 02_23_09 AM batch
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (1).png',  16], // Vostok 1
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (2).png',  17], // Friendship 7
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (3).png',  18], // Gemini 4 Spacewalk
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (4).png',  19], // Luna 9
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (5).png',  20], // Viking 1 Mars Lander
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (6).png',  21], // Soyuz Spacecraft
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (7).png',  22], // Juno at Jupiter
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (8).png',  23], // Rosetta at Comet 67P
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (9).png',  24], // Falcon Heavy Launch
  ['ChatGPT Image May 26, 2026, 02_23_09 AM (10).png', 25], // Starship Super Heavy
  // Cards 26-35: 02_28_06/07/08 AM batch
  ['ChatGPT Image May 26, 2026, 02_28_06 AM (1).png',  26], // SpaceX Dragon Capsule
  ['ChatGPT Image May 26, 2026, 02_28_06 AM (2).png',  27], // Salyut 1
  ['ChatGPT Image May 26, 2026, 02_28_07 AM (3).png',  28], // Skylab
  ['ChatGPT Image May 26, 2026, 02_28_07 AM (4).png',  29], // Mir Space Station
  ['ChatGPT Image May 26, 2026, 02_28_07 AM (5).png',  30], // Chandrayaan-3 Lander
  ['ChatGPT Image May 26, 2026, 02_28_07 AM (6).png',  31], // Chang\'e 4 Lander
  ['ChatGPT Image May 26, 2026, 02_28_07 AM (7).png',  32], // BepiColombo at Mercury
  ['ChatGPT Image May 26, 2026, 02_28_08 AM (8).png',  33], // Parker Solar Probe
  ['ChatGPT Image May 26, 2026, 02_28_08 AM (9).png',  34], // Europa Clipper
  ['ChatGPT Image May 26, 2026, 02_28_08 AM (10).png', 35], // Hayabusa2 at Ryugu
  // Cards 36-45: 02_33_38/39/40 AM batch
  ['ChatGPT Image May 26, 2026, 02_33_38 AM (1).png',  36], // Lunar Reconnaissance Orbiter
  ['ChatGPT Image May 26, 2026, 02_33_38 AM (2).png',  37], // MESSENGER at Mercury
  ['ChatGPT Image May 26, 2026, 02_33_38 AM (3).png',  38], // Galileo at Jupiter
  ['ChatGPT Image May 26, 2026, 02_33_38 AM (4).png',  39], // Pioneer 10
  ['ChatGPT Image May 26, 2026, 02_33_39 AM (5).png',  40], // Pioneer 11 at Saturn
  ['ChatGPT Image May 26, 2026, 02_33_39 AM (6).png',  41], // Magellan at Venus
  ['ChatGPT Image May 26, 2026, 02_33_39 AM (7).png',  42], // Venus Express
  ['ChatGPT Image May 26, 2026, 02_33_39 AM (8).png',  43], // Mars Express
  ['ChatGPT Image May 26, 2026, 02_33_39 AM (9).png',  44], // Tianwen-1 Orbiter
  ['ChatGPT Image May 26, 2026, 02_33_40 AM (10).png', 45], // OSIRIS-REx at Bennu
  // Cards 46-55: 02_39_38/39/40 AM batch
  ['ChatGPT Image May 26, 2026, 02_39_38 AM (1).png',  46], // Yuri Gagarin
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (2).png',  47], // Valentina Tereshkova
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (3).png',  48], // Falcon 9 Booster Landing
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (4).png',  49], // Apollo Lunar Module Eagle
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (5).png',  50], // Apollo Command Module
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (6).png',  51], // First Moon Footprint
  ['ChatGPT Image May 26, 2026, 02_39_39 AM (7).png',  52], // Earthrise
  ['ChatGPT Image May 26, 2026, 02_39_40 AM (8).png',  53], // Mars Pathfinder & Sojourner
  ['ChatGPT Image May 26, 2026, 02_39_40 AM (9).png',  54], // Kepler Space Telescope
  ['ChatGPT Image May 26, 2026, 02_39_40 AM (10).png', 55], // Astronaut Spacewalk
  // Cards 56-61: 02_44_56/57 AM batch
  ['ChatGPT Image May 26, 2026, 02_44_56 AM (1).png',  56], // Helen Sharman
  ['ChatGPT Image May 26, 2026, 02_44_56 AM (2).png',  57], // Tim Peake
  ['ChatGPT Image May 26, 2026, 02_44_56 AM (3).png',  58], // Alexei Leonov
  ['ChatGPT Image May 26, 2026, 02_44_56 AM (4).png',  59], // Sally Ride
  ['ChatGPT Image May 26, 2026, 02_44_56 AM (5).png',  60], // John Glenn
  ['ChatGPT Image May 26, 2026, 02_44_57 AM (6).png',  61], // Mae Jemison
  // Cards 62-71: 02_47_12/13/14 AM batch
  ['ChatGPT Image May 26, 2026, 02_47_12 AM (1).png',  62], // Chris Hadfield
  ['ChatGPT Image May 26, 2026, 02_47_12 AM (2).png',  63], // Peggy Whitson
  ['ChatGPT Image May 26, 2026, 02_47_12 AM (3).png',  64], // Buzz Aldrin
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (4).png',  65], // Michael Collins
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (5).png',  66], // Kalpana Chawla
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (6).png',  67], // Samantha Cristoforetti
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (7).png',  68], // Sunita Williams
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (8).png',  69], // Guion Bluford
  ['ChatGPT Image May 26, 2026, 02_47_13 AM (9).png',  70], // Yang Liwei
  ['ChatGPT Image May 26, 2026, 02_47_14 AM (10).png', 71], // Neil Armstrong
]

// Process card images
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

// Convert cardback.png → back.webp
try {
  await sharp(path.join(SRC, 'cardback.png'))
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, 'back.webp'))
  console.log('✓ back.webp  ← cardback.png')
} catch (e) {
  console.error(`✗ back.webp  ERROR: ${e.message}`)
}

// Copy deck.webp and gold.webp as-is
for (const f of ['deck.webp', 'gold.webp']) {
  try {
    await copyFile(path.join(SRC, f), path.join(OUT, f))
    console.log(`✓ ${f} copied`)
  } catch (e) {
    console.error(`✗ ${f}  ERROR: ${e.message}`)
  }
}

console.log(`\nDone: ${ok} cards ok, ${fail} failed`)
