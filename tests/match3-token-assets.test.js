import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { MATCH3_TOKEN_CROPS, validateMatch3TokenCrops } from '../src/match3/tokenCrops.js'

const projectRoot = path.resolve(import.meta.dirname, '..')
const publicFile = webPath => path.join(projectRoot, 'public', ...webPath.split('/').filter(Boolean))

test('every Match-3 token has complete explicit crop metadata', () => {
  assert.equal(MATCH3_TOKEN_CROPS.length, 6)
  assert.deepEqual(validateMatch3TokenCrops(), [])
  assert.equal(new Set(MATCH3_TOKEN_CROPS.map(token => token.accessibleLabel)).size, MATCH3_TOKEN_CROPS.length)
  assert.equal(new Set(MATCH3_TOKEN_CROPS.map(token => token.sourceCardId)).size, MATCH3_TOKEN_CROPS.length)
})

test('source cards and generated circular WebP assets exist', async () => {
  for (const token of MATCH3_TOKEN_CROPS) {
    await access(publicFile(token.sourceAsset))
    await access(publicFile(token.fallbackAsset))
    const output = publicFile(token.asset)
    await access(output)
    const metadata = await sharp(output).metadata()
    assert.equal(metadata.width, 256, token.id)
    assert.equal(metadata.height, 256, token.id)
    assert.equal(metadata.format, 'webp', token.id)
    assert.equal(metadata.hasAlpha, true, token.id)
  }
})

test('32 px quality signals catch weak or confusable token crops', async () => {
  const report = JSON.parse(await readFile(publicFile('/ui/match3/card-tokens/quality-report.json'), 'utf8'))
  assert.equal(report.smallestReviewSize, 32)
  assert.equal(report.tokens.length, MATCH3_TOKEN_CROPS.length)
  for (const token of report.tokens) assert.ok(token.signalsAt32px.luminanceDeviation >= 45, `${token.id} has weak small-size contrast`)
  assert.ok(report.pairwiseDifferences[0].differenceAt32px >= 0.16, `${report.pairwiseDifferences[0].tokens.join('/')} are too similar at 32 px`)
})
