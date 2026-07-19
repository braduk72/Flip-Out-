import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const source = process.argv[2]
const destination = resolve(process.argv[3] ?? 'public/ui/booster-animation')
if (!source) throw new Error('Usage: node scripts/slice-booster-animation.mjs <source.png> [destination]')

const columns = 5
const rows = 2
const canvas = 512
const sourceImage = sharp(source, { animated: false })
const metadata = await sourceImage.metadata()
if (!metadata.width || !metadata.height) throw new Error('Source image dimensions are unavailable')

const partitions = (size, count) => {
  const base = Math.floor(size / count)
  const remainder = size % count
  let offset = 0
  return Array.from({ length: count }, (_, index) => {
    const length = base + (index < remainder ? 1 : 0)
    const part = { offset, length }
    offset += length
    return part
  })
}

const xParts = partitions(metadata.width, columns)
const yParts = partitions(metadata.height, rows)
const frameMetadata = []
await mkdir(destination, { recursive: true })

for (let index = 0; index < columns * rows; index += 1) {
  const column = index % columns
  const row = Math.floor(index / columns)
  const extract = { left: xParts[column].offset, top: yParts[row].offset, width: xParts[column].length, height: yParts[row].length }
  const tile = await sharp(source).extract(extract).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = extract.width
  let minY = extract.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < extract.height; y += 1) for (let x = 0; x < extract.width; x += 1) {
    if (tile.data[(y * extract.width + x) * 4 + 3] > 10) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
  }
  if (maxX < minX || maxY < minY) throw new Error(`Frame ${index + 1} contains no visible pixels`)
  const contentBounds = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  const content = await sharp(source).extract({ left: extract.left + contentBounds.left, top: extract.top + contentBounds.top, width: contentBounds.width, height: contentBounds.height }).png().toBuffer()
  const scale = Math.min(440 / contentBounds.width, 440 / contentBounds.height, 1)
  const width = Math.max(1, Math.round(contentBounds.width * scale))
  const height = Math.max(1, Math.round(contentBounds.height * scale))
  const buffer = await sharp(content).resize(width, height, { fit: 'contain', kernel: sharp.kernel.lanczos3 }).png().toBuffer()
  const filename = `booster_${String(index + 1).padStart(2, '0')}.webp`
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: buffer, left: Math.round((canvas - width) / 2), top: Math.round((canvas - height) / 2) }])
    .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
    .toFile(resolve(destination, filename))
  frameMetadata.push({ frame: index + 1, file: filename, sourceSlice: extract, contentBounds, canvas: `${canvas}x${canvas}`, content: { width, height } })
}

await writeFile(resolve(destination, 'frames.json'), `${JSON.stringify({ source: { width: metadata.width, height: metadata.height, grid: `${columns}x${rows}` }, frames: frameMetadata }, null, 2)}\n`)
console.log(JSON.stringify({ output: destination, frames: frameMetadata.length, canvas: `${canvas}x${canvas}` }))
