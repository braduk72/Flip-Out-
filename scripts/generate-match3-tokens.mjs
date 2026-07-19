import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { MATCH3_TOKEN_CROPS, validateMatch3TokenCrops } from '../src/match3/tokenCrops.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'public', 'ui', 'match3', 'card-tokens')
const outputSize = 256
const ringWidth = 12

function publicFile(webPath) {
  return path.join(projectRoot, 'public', ...webPath.split('/').filter(Boolean))
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function circleSvg(accent) {
  return Buffer.from(`<svg width="${outputSize}" height="${outputSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="128" cy="128" r="126" fill="none" stroke="${accent}" stroke-width="${ringWidth}"/><circle cx="128" cy="128" r="119" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2"/></svg>`)
}

function maskSvg() {
  return Buffer.from(`<svg width="${outputSize}" height="${outputSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="128" cy="128" r="126" fill="white"/></svg>`)
}

function imageSignals(buffer, info) {
  const luminance = []
  for (let index = 0; index < buffer.length; index += info.channels) {
    luminance.push((buffer[index] * 0.2126) + (buffer[index + 1] * 0.7152) + (buffer[index + 2] * 0.0722))
  }
  const average = luminance.reduce((sum, value) => sum + value, 0) / luminance.length
  const variance = luminance.reduce((sum, value) => sum + ((value - average) ** 2), 0) / luminance.length
  return { averageLuminance: Number(average.toFixed(2)), luminanceDeviation: Number(Math.sqrt(variance).toFixed(2)) }
}

function pixelDifference(a, b) {
  let difference = 0
  for (let index = 0; index < a.length; index += 3) difference += Math.abs(a[index] - b[index]) + Math.abs(a[index + 1] - b[index + 1]) + Math.abs(a[index + 2] - b[index + 2])
  return Number((difference / (a.length * 255)).toFixed(4))
}

async function generateToken(token) {
  const source = publicFile(token.sourceAsset)
  const transformed = sharp(source).rotate(token.rotation)
  const metadata = await transformed.metadata()
  const cropSize = Math.round(Math.min(metadata.width, metadata.height) / token.zoom)
  const left = clamp(Math.round((metadata.width * token.focalPoint.x) - (cropSize / 2)), 0, metadata.width - cropSize)
  const top = clamp(Math.round((metadata.height * token.focalPoint.y) - (cropSize / 2)), 0, metadata.height - cropSize)
  const output = publicFile(token.asset)

  await transformed
    .extract({ left, top, width: cropSize, height: cropSize })
    .resize(outputSize, outputSize, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .composite([
      { input: maskSvg(), blend: 'dest-in' },
      { input: circleSvg(token.accent), blend: 'over' },
    ])
    .webp({ quality: 92, alphaQuality: 100, smartSubsample: true })
    .toFile(output)

  const small = await sharp(output)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .flatten({ background: '#081127' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return {
    id: token.id,
    output: token.asset,
    crop: { left, top, size: cropSize },
    signalsAt32px: imageSignals(small.data, small.info),
    pixels: small.data,
  }
}

const metadataErrors = validateMatch3TokenCrops()
if (metadataErrors.length) throw new Error(`Invalid Match-3 crop metadata:\n${metadataErrors.join('\n')}`)

await mkdir(outputDir, { recursive: true })
const generated = []
for (const token of MATCH3_TOKEN_CROPS) generated.push(await generateToken(token))

const pairwiseDifferences = []
for (let left = 0; left < generated.length; left += 1) {
  for (let right = left + 1; right < generated.length; right += 1) {
    pairwiseDifferences.push({
      tokens: [generated[left].id, generated[right].id],
      differenceAt32px: pixelDifference(generated[left].pixels, generated[right].pixels),
    })
  }
}

const report = {
  outputSize,
  smallestReviewSize: 32,
  tokens: generated.map(({ pixels: _pixels, ...entry }) => entry),
  pairwiseDifferences: pairwiseDifferences.sort((a, b) => a.differenceAt32px - b.differenceAt32px),
}

await writeFile(path.join(outputDir, 'quality-report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`Generated ${generated.length} Match-3 card tokens in ${path.relative(projectRoot, outputDir)}`)
console.log(`Closest 32 px pair: ${report.pairwiseDifferences[0].tokens.join(' / ')} (${report.pairwiseDifferences[0].differenceAt32px})`)
