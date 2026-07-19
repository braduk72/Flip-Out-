import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { legalMoves } from '../src/match3/engine.js'
import { MATCH3_TOKENS } from '../src/match3/levels.js'

const previewUrl = process.argv[2]
if (!/^https:\/\/flip-[a-z0-9-]+\.vercel\.app\/?$/.test(previewUrl ?? '')) {
  throw new Error('Pass the exact https://flip-*.vercel.app Preview URL to verify.')
}

const outputDirectory = resolve(process.argv[3] ?? 'artifacts/match3-drag-preview')
const edgePath = process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const targetUrl = new URL(previewUrl)
targetUrl.searchParams.set('match3Diagnostics', '1')
await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({ executablePath: edgePath, headless: process.env.HEADED !== '1' })
const context = await browser.newContext({ viewport: { width: 1180, height: 900 }, reducedMotion: 'no-preference' })
await context.addInitScript(() => {
  // Isolated automation storage only: the app guard suppresses all test audio.
  window.__FLIPOUT_TEST_AUDIO_DISABLED__ = true
  localStorage.setItem('fo_music', 'off')
  localStorage.setItem('fo_sfx', 'off')
})
await context.tracing.start({ screenshots: true, snapshots: true })
const page = await context.newPage()
let delayMoveRequest = false

await page.route('**/api/player-game*', async route => {
  const request = route.request()
  let action = ''
  try { action = request.postDataJSON()?.action ?? '' } catch { /* Non-JSON request. */ }
  if (delayMoveRequest && action === 'move') await new Promise(resolveDelay => setTimeout(resolveDelay, 450))
  await route.continue()
})

async function clickIfVisible(locator) {
  if (await locator.isVisible().catch(() => false)) await locator.click()
}

const center = box => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
const projection = (from, to, axis) => axis === 'x' ? to.x - from.x : to.y - from.y

let result
try {
  await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await clickIfVisible(page.getByRole('button', { name: 'Got it!', exact: true }))

  if (await page.getByRole('heading', { name: 'Choose your nickname', exact: true }).isVisible().catch(() => false)) {
    await page.getByLabel('Nickname', { exact: true }).fill('DragProof7')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
  if (await page.getByRole('heading', { name: 'Choose your avatar', exact: true }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Select Badger', exact: true }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }

  const homePlay = page.getByRole('button', { name: /Play Match-3, continue Level 1/i })
  await homePlay.waitFor({ state: 'visible', timeout: 20_000 })
  await homePlay.click()
  await page.getByRole('button', { name: /Level 1, unlocked/i }).click()
  await page.getByRole('button', { name: 'Play Match-3', exact: true }).click()

  const unlockedBoard = page.locator('[data-input-locked="false"]')
  await unlockedBoard.waitFor({ state: 'visible', timeout: 20_000 })
  const cells = await page.locator('[data-cell]').evaluateAll(elements => elements.map(element => ({
    cell: element.getAttribute('data-cell'),
    label: element.getAttribute('aria-label'),
  })))
  assert.equal(cells.length, 64, 'Level 1 should expose all 64 playable cells.')

  const tokenByLabel = new Map(MATCH3_TOKENS.map(token => [token.label, token.id]))
  const board = Array.from({ length: 8 }, () => Array.from({ length: 8 }))
  for (const entry of cells) {
    const [row, column] = entry.cell.split(':').map(Number)
    const label = entry.label.split(': ')[1].split(',')[0]
    const token = tokenByLabel.get(label)
    assert.ok(token, `Unknown deployed token label: ${label}`)
    board[row][column] = { token, special: null, ice: 0, chain: 0, crate: 0, drop: false }
  }

  const move = legalMoves(board)[0]
  assert.ok(move, 'The deployed board should contain at least one legal move.')
  const source = page.locator(`[data-cell="${move.from.r}:${move.from.c}"]`)
  const destination = page.locator(`[data-cell="${move.to.r}:${move.to.c}"]`)
  const beforeSource = await source.boundingBox()
  const beforeDestination = await destination.boundingBox()
  assert.ok(beforeSource && beforeDestination, 'Both move cells must be visible.')
  const sourceCenter = center(beforeSource)
  const destinationCenter = center(beforeDestination)
  const axis = move.from.c !== move.to.c ? 'x' : 'y'
  const direction = Math.sign(projection(sourceCenter, destinationCenter, axis))
  const scrollBefore = await page.evaluate(() => globalThis.scrollY)
  await page.screenshot({ path: resolve(outputDirectory, '01-before-drag.png') })

  await page.mouse.move(sourceCenter.x, sourceCenter.y)
  await page.mouse.down()
  await page.mouse.move(
    sourceCenter.x + (destinationCenter.x - sourceCenter.x) / 2,
    sourceCenter.y + (destinationCenter.y - sourceCenter.y) / 2,
    { steps: 10 },
  )
  await page.waitForTimeout(80)

  const heldSource = await source.boundingBox()
  const heldDestination = await destination.boundingBox()
  const heldStyle = await source.evaluate(element => ({
    phase: element.getAttribute('data-drag-phase'),
    inlineStyle: element.getAttribute('style'),
    transform: getComputedStyle(element).transform,
  }))
  const heldDiagnostics = await page.locator('aside[aria-label="Match-3 drag diagnostics"]').innerText()
  const scrollHeld = await page.evaluate(() => globalThis.scrollY)
  const heldSourceTravel = projection(center(beforeSource), center(heldSource), axis) * direction
  const heldDestinationTravel = projection(center(beforeDestination), center(heldDestination), axis) * direction
  assert.ok(heldSourceTravel > beforeSource.width * 0.25, `Held token moved only ${heldSourceTravel.toFixed(2)}px.`)
  assert.ok(heldDestinationTravel < -1, `Neighbour preview moved only ${heldDestinationTravel.toFixed(2)}px.`)
  assert.equal(heldStyle.phase, 'dragging')
  assert.notEqual(heldStyle.transform, 'none')
  assert.match(heldDiagnostics, /Capture: yes/)
  assert.match(heldDiagnostics, /Threshold: passed/)
  assert.equal(scrollHeld, scrollBefore, 'Dragging the board must not scroll the page.')
  await page.screenshot({ path: resolve(outputDirectory, '02-held-halfway.png') })

  await page.mouse.move(destinationCenter.x, destinationCenter.y, { steps: 8 })
  delayMoveRequest = true
  await page.mouse.up()
  await page.waitForTimeout(80)
  const releasedSource = await source.boundingBox()
  const releasedDestination = await destination.boundingBox()
  const releasedSourceTravel = projection(center(beforeSource), center(releasedSource), axis) * direction
  const releasedDestinationTravel = projection(center(beforeDestination), center(releasedDestination), axis) * direction
  assert.ok(releasedSourceTravel > beforeSource.width * 0.75, `Released source moved only ${releasedSourceTravel.toFixed(2)}px.`)
  assert.ok(releasedDestinationTravel < -beforeDestination.width * 0.75, `Released neighbour moved only ${releasedDestinationTravel.toFixed(2)}px.`)
  await page.screenshot({ path: resolve(outputDirectory, '03-release-exchange.png') })
  delayMoveRequest = false

  await unlockedBoard.waitFor({ state: 'visible', timeout: 20_000 })
  const afterSummary = await unlockedBoard.getAttribute('aria-label')
  assert.notEqual(afterSummary, 'Level 1. 18 moves left. Score 0.', 'The legal move must resolve authoritatively.')
  await page.screenshot({ path: resolve(outputDirectory, '04-after-settle.png') })

  await page.setViewportSize({ width: 390, height: 844 })
  const touchCells = await page.locator('[data-cell]').evaluateAll(elements => elements.map(element => ({
    cell: element.getAttribute('data-cell'),
    label: element.getAttribute('aria-label'),
  })))
  const touchBoard = Array.from({ length: 8 }, () => Array.from({ length: 8 }))
  for (const entry of touchCells) {
    const [row, column] = entry.cell.split(':').map(Number)
    const details = entry.label.split(': ')[1].split(',')
    const token = tokenByLabel.get(details[0])
    const specialDetail = details.find(detail => / special$/.test(detail.trim()))?.trim().replace(/ special$/, '') ?? null
    touchBoard[row][column] = { token, special: specialDetail, ice: 0, chain: 0, crate: 0, drop: false }
  }
  const touchMove = legalMoves(touchBoard)[0]
  assert.ok(touchMove, 'The settled mobile board should contain a legal move.')
  const touchSource = page.locator(`[data-cell="${touchMove.from.r}:${touchMove.from.c}"]`)
  const touchDestination = page.locator(`[data-cell="${touchMove.to.r}:${touchMove.to.c}"]`)
  await touchSource.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'center' }))
  await page.waitForTimeout(100)
  const beforeTouchSource = await touchSource.boundingBox()
  const beforeTouchDestination = await touchDestination.boundingBox()
  const touchSourceCenter = center(beforeTouchSource)
  const touchDestinationCenter = center(beforeTouchDestination)
  const touchAxis = touchMove.from.c !== touchMove.to.c ? 'x' : 'y'
  const touchDirection = Math.sign(projection(touchSourceCenter, touchDestinationCenter, touchAxis))
  const scrollBeforeTouch = await page.evaluate(() => globalThis.scrollY)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchSourceCenter.x, y: touchSourceCenter.y, id: 21, radiusX: 4, radiusY: 4, force: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchSourceCenter.x + (touchDestinationCenter.x - touchSourceCenter.x) / 2, y: touchSourceCenter.y + (touchDestinationCenter.y - touchSourceCenter.y) / 2, id: 21, radiusX: 4, radiusY: 4, force: 1 }] })
  await page.waitForTimeout(80)
  const heldTouchSource = await touchSource.boundingBox()
  const heldTouchDestination = await touchDestination.boundingBox()
  const touchDiagnostics = await page.locator('aside[aria-label="Match-3 drag diagnostics"]').innerText()
  const scrollHeldTouch = await page.evaluate(() => globalThis.scrollY)
  const heldTouchSourceTravel = projection(center(beforeTouchSource), center(heldTouchSource), touchAxis) * touchDirection
  const heldTouchDestinationTravel = projection(center(beforeTouchDestination), center(heldTouchDestination), touchAxis) * touchDirection
  assert.ok(heldTouchSourceTravel > beforeTouchSource.width * 0.2, `Touch-held token moved only ${heldTouchSourceTravel.toFixed(2)}px.`)
  assert.ok(heldTouchDestinationTravel < -1, `Touch neighbour preview moved only ${heldTouchDestinationTravel.toFixed(2)}px.`)
  assert.match(touchDiagnostics, /Capture: yes/)
  assert.equal(scrollHeldTouch, scrollBeforeTouch, 'Touch-dragging the board must not scroll the page.')
  await page.screenshot({ path: resolve(outputDirectory, '05-touch-held-halfway.png') })

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchDestinationCenter.x, y: touchDestinationCenter.y, id: 21, radiusX: 4, radiusY: 4, force: 1 }] })
  delayMoveRequest = true
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(80)
  const releasedTouchSource = await touchSource.boundingBox()
  const releasedTouchDestination = await touchDestination.boundingBox()
  const releasedTouchSourceTravel = projection(center(beforeTouchSource), center(releasedTouchSource), touchAxis) * touchDirection
  const releasedTouchDestinationTravel = projection(center(beforeTouchDestination), center(releasedTouchDestination), touchAxis) * touchDirection
  assert.ok(releasedTouchSourceTravel > beforeTouchSource.width * 0.7, `Released touch source moved only ${releasedTouchSourceTravel.toFixed(2)}px.`)
  assert.ok(releasedTouchDestinationTravel < -beforeTouchDestination.width * 0.7, `Released touch neighbour moved only ${releasedTouchDestinationTravel.toFixed(2)}px.`)
  await page.screenshot({ path: resolve(outputDirectory, '06-touch-release-exchange.png') })
  delayMoveRequest = false
  await unlockedBoard.waitFor({ state: 'visible', timeout: 20_000 })
  await cdp.detach()

  result = {
    status: 'passed',
    previewUrl,
    testedAt: new Date().toISOString(),
    browser: await browser.version(),
    move,
    before: { source: beforeSource, destination: beforeDestination, scrollY: scrollBefore },
    held: {
      source: heldSource,
      destination: heldDestination,
      sourceTravelPx: heldSourceTravel,
      neighbourTravelPx: heldDestinationTravel,
      style: heldStyle,
      diagnostics: heldDiagnostics.split('\n'),
      scrollY: scrollHeld,
    },
    released: {
      source: releasedSource,
      destination: releasedDestination,
      sourceTravelPx: releasedSourceTravel,
      neighbourTravelPx: releasedDestinationTravel,
    },
    afterSummary,
    mobileTouchEmulation: {
      note: 'Chromium touch input at a 390x844 mobile viewport; this is not a physical iPhone Safari claim.',
      move: touchMove,
      before: { source: beforeTouchSource, destination: beforeTouchDestination, scrollY: scrollBeforeTouch },
      held: {
        source: heldTouchSource,
        destination: heldTouchDestination,
        sourceTravelPx: heldTouchSourceTravel,
        neighbourTravelPx: heldTouchDestinationTravel,
        diagnostics: touchDiagnostics.split('\n'),
        scrollY: scrollHeldTouch,
      },
      released: {
        source: releasedTouchSource,
        destination: releasedTouchDestination,
        sourceTravelPx: releasedTouchSourceTravel,
        neighbourTravelPx: releasedTouchDestinationTravel,
      },
    },
  }
  await writeFile(resolve(outputDirectory, 'drag-verification.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result, null, 2))
} finally {
  await page.evaluate(() => document.querySelectorAll('audio, video').forEach(media => {
    try { media.pause(); media.currentTime = 0 } catch { /* already detached */ }
  })).catch(() => {})
  await context.tracing.stop({ path: resolve(outputDirectory, 'browser-trace.zip') })
  await context.close()
  await browser.close()
}
