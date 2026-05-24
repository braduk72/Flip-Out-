import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const removed   = p => path.join(__dirname, 'public/images/downloads/removed', p)
const downloads = p => path.join(__dirname, 'public/images/downloads', p)
const out       = p => path.join(__dirname, 'public/images', p)

const jobs = [
  // UI ribbons / buttons
  [removed('c45770a5-ae1b-4043-a6b4-b6c1a1e97074.png'), out('defeated_banner.webp')],
  [removed('victory_banner.png'),                        out('victory_banner.webp')],
  [removed('25784db1-54ed-405d-afc2-fe4551aabf62.png'), out('btn_tryagain.webp')],
  [removed('giveUp.png'),                                out('btn_giveup.webp')],
  [downloads('continue.png'),                            out('btn_continue.webp')],
  // Defeated player avatars
  [downloads('a1d.png'),                                 out('a1d.webp')],
  [removed('b30ece91-9adc-42c5-856a-13d090e31fb0.png'), out('a2d.webp')],
  // Defeated opponent avatars
  [removed('dd4fecc2-2835-4d4f-b8e3-085e54d40a30.png'), out('c1d.webp')],
  [removed('0b30c2fb-bad6-4c70-9501-99a778a32fe1.png'), out('c2d.webp')],
  [removed('4b6d83ad-b689-429c-b746-0e2755b7ed48.png'), out('c3d.webp')],
  [removed('5adbee9b-c3e0-43a2-9236-16c2d897f077.png'), out('c4d.webp')],
]

for (const [src, dest] of jobs) {
  await sharp(src).webp({ quality: 88 }).toFile(dest)
  console.log(`✓ ${path.basename(dest)}`)
}
console.log('All done.')
