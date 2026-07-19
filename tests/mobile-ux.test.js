import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { applyWebOrientationPolicy, classifyMobileViewport } from '../src/mobile/orientationPolicy.js'
import { getDeviceTimeZone } from '../src/utils/timeZone.js'

test('mobile orientation policy locks phones and permits tablet rotation', async () => {
  assert.deepEqual(classifyMobileViewport({ width: 390, height: 844, coarsePointer: true }), { formFactor: 'phone', blockLandscape: false })
  assert.deepEqual(classifyMobileViewport({ width: 844, height: 390, coarsePointer: true }), { formFactor: 'phone', blockLandscape: true })
  assert.deepEqual(classifyMobileViewport({ width: 1024, height: 768, coarsePointer: true }), { formFactor: 'tablet', blockLandscape: false })

  const calls = []
  const orientation = { lock: async value => calls.push(['lock', value]), unlock: () => calls.push(['unlock']) }
  await applyWebOrientationPolicy({ width: 390, height: 844, coarsePointer: true, orientation })
  await applyWebOrientationPolicy({ width: 1024, height: 768, coarsePointer: true, orientation })
  assert.deepEqual(calls, [['lock', 'portrait'], ['unlock']])
})

test('unsupported browser orientation locking falls back without rejecting', async () => {
  const result = await applyWebOrientationPolicy({ width: 844, height: 390, coarsePointer: true, orientation: { lock: async () => { throw new Error('Not supported') } } })
  assert.equal(result.blockLandscape, true)
})

test('device timezone has a Safari-safe UTC fallback', () => {
  assert.equal(getDeviceTimeZone({ DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/London' }) }) }), 'Europe/London')
  assert.equal(getDeviceTimeZone({ DateTimeFormat: () => ({ resolvedOptions: () => ({}) }) }), 'UTC')
  assert.equal(getDeviceTimeZone({ DateTimeFormat: () => { throw new Error('Unavailable') } }), 'UTC')
})

test('native projects encode phone portrait and tablet adaptive orientation', async () => {
  const [plist, activity, manifest, webManifest, index] = await Promise.all([
    readFile(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/java/uk/gizmogames/flipout/MainActivity.java', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
    readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
  ])
  const phoneOrientations = plist.match(/<key>UISupportedInterfaceOrientations<\/key>[\s\S]*?<\/array>/)?.[0]
  const tabletOrientations = plist.match(/<key>UISupportedInterfaceOrientations~ipad<\/key>[\s\S]*?<\/array>/)?.[0]
  assert.match(phoneOrientations, /UIInterfaceOrientationPortrait/)
  assert.doesNotMatch(phoneOrientations, /Landscape/)
  assert.match(tabletOrientations, /UIInterfaceOrientationLandscapeLeft/)
  assert.match(tabletOrientations, /UIInterfaceOrientationLandscapeRight/)
  assert.match(activity, /smallestScreenWidthDp >= TABLET_SMALLEST_WIDTH_DP/)
  assert.match(activity, /SCREEN_ORIENTATION_SENSOR_PORTRAIT/)
  assert.match(activity, /SCREEN_ORIENTATION_FULL_USER/)
  assert.match(manifest, /android:appCategory="game"/)
  assert.equal(JSON.parse(webManifest).orientation, 'any')
  assert.match(index, /viewport-fit=cover/)
})
