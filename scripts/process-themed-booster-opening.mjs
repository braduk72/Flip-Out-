import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const source = process.argv[2]
const outputDirectory = resolve(process.argv[3] ?? 'public/ui/booster-opening/themed')
const sourceArchive = resolve(process.argv[4] ?? 'assets/source/booster-opening/themed/booster-opening-themed-source.png')
if (!source) throw new Error('Usage: node scripts/process-themed-booster-opening.mjs <approved-source.png> [output-directory] [source-archive]')

const ALPHA_THRESHOLD = 16
// Use only confidently opaque pixels to identify the sparse source-sheet rows.
// The artwork has isolated translucent antialiasing pixels between rows, which
// belong to no frame and must not bridge two visual groups.
const GROUPING_ALPHA_THRESHOLD = 128
const ROW_GAP = 28
const COLUMN_GAP = 18
const PADDING = 6
const CANVAS = 640
const EXPECTED_GROUPS = [3, 3, 3, 2]

const image = sharp(source, { animated: false }).ensureAlpha()
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
if (!info.width || !info.height || info.channels !== 4) throw new Error('Approved source must be an RGBA image')

const alphaAt = (x, y) => data[(y * info.width + x) * 4 + 3]
const cluster = (values, gap) => {
  if (!values.length) return []
  const groups = []
  let start = values[0]
  let end = start
  for (const value of values.slice(1)) {
    if (value <= end + gap) end = value
    else { groups.push({ start, end }); start = end = value }
  }
  groups.push({ start, end })
  return groups
}

const activeRows = []
for (let y = 0; y < info.height; y += 1) {
  let pixels = 0
  for (let x = 0; x < info.width; x += 1) if (alphaAt(x, y) > GROUPING_ALPHA_THRESHOLD) pixels += 1
  if (pixels >= 20) activeRows.push(y)
}
const rowBands = cluster(activeRows, ROW_GAP).filter(band => band.end - band.start > 20)
if (rowBands.length !== EXPECTED_GROUPS.length) throw new Error(`Expected ${EXPECTED_GROUPS.length} detected row bands, received ${rowBands.length}`)

const groups = []
for (const [rowIndex, band] of rowBands.entries()) {
  const activeColumns = []
  for (let x = 0; x < info.width; x += 1) {
    let pixels = 0
    for (let y = band.start; y <= band.end; y += 1) if (alphaAt(x, y) > GROUPING_ALPHA_THRESHOLD) pixels += 1
    if (pixels >= 4) activeColumns.push(x)
  }
  const columns = cluster(activeColumns, COLUMN_GAP).filter(column => column.end - column.start > 12)
  if (columns.length !== EXPECTED_GROUPS[rowIndex]) throw new Error(`Row ${rowIndex + 1} expected ${EXPECTED_GROUPS[rowIndex]} frame groups, received ${columns.length}`)
  for (const column of columns) {
    const seed = { left: column.start, top: band.start, width: column.end - column.start + 1, height: band.end - band.start + 1 }
    let left = info.width
    let right = -1
    let top = info.height
    let bottom = -1
    for (let y = seed.top; y < seed.top + seed.height; y += 1) for (let x = seed.left; x < seed.left + seed.width; x += 1) {
      if (alphaAt(x, y) > ALPHA_THRESHOLD) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y)
      }
    }
    if (right < left || bottom < top) throw new Error(`Frame group ${groups.length + 1} has no visible alpha`)
    const alphaBounds = { left, top, width: right - left + 1, height: bottom - top + 1 }
    const cropBounds = {
      left: Math.max(0, left - PADDING),
      top: Math.max(0, top - PADDING),
      width: Math.min(info.width, right + PADDING + 1) - Math.max(0, left - PADDING),
      height: Math.min(info.height, bottom + PADDING + 1) - Math.max(0, top - PADDING),
    }
    groups.push({ row: rowIndex + 1, alphaBounds, cropBounds })
  }
}
if (groups.length !== 11) throw new Error(`Expected exactly 11 frame groups, received ${groups.length}`)

await mkdir(outputDirectory, { recursive: true })
await mkdir(resolve(sourceArchive, '..'), { recursive: true })
await copyFile(source, sourceArchive)

const frames = []
for (const [index, group] of groups.entries()) {
  const sourceCell = await sharp(source).extract(group.cropBounds).ensureAlpha().png().toBuffer()
  const filename = `booster-open-${String(index + 1).padStart(2, '0')}.webp`
  await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: sourceCell, left: Math.round((CANVAS - group.cropBounds.width) / 2), top: Math.round((CANVAS - group.cropBounds.height) / 2) }])
    .webp({ quality: 96, alphaQuality: 100, smartSubsample: true, effort: 6 })
    .toFile(resolve(outputDirectory, filename))
  frames.push({ frame: index + 1, file: filename, row: group.row, alphaBounds: group.alphaBounds, cropBounds: group.cropBounds, canvas: { width: CANVAS, height: CANVAS }, registration: { x: CANVAS / 2, y: CANVAS / 2 }, scale: 1, detachedWrapperRemnant: index === 9 })
}

const manifest = {
  source: { archive: sourceArchive.replaceAll('\\', '/'), width: info.width, height: info.height, alphaThreshold: ALPHA_THRESHOLD, layout: [3, 3, 3, 2] },
  canvas: { width: CANVAS, height: CANVAS, registration: { x: CANVAS / 2, y: CANVAS / 2 }, scale: 1, padding: PADDING },
  frames,
}
await writeFile(resolve(outputDirectory, 'frames.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ source: `${info.width}x${info.height}`, frames: frames.length, canvas: `${CANVAS}x${CANVAS}`, output: outputDirectory }))
