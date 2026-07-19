import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from 'vitest'

const workspace = (file) => join(process.cwd(), file)

const productionScreens = [
  'AboutUs',
  'AvatarPicker',
  'DeckPicker',
  'Game',
  'Gauntlet',
  'Home',
  'Inventory',
  'Leaderboard',
  'LuckySpin',
  'Marketplace',
  'Match3',
  'MultiplayerLobby',
  'PatchNotes',
  'PrivacyPolicy',
  'RevealGame',
  'RoundStart',
  'Settings',
  'Shop',
]

test('every production screen opts into the approved Concept 4D language', async () => {
  const sources = await Promise.all(
    productionScreens.map((name) => readFile(workspace(`src/screens/${name}.jsx`), 'utf8')),
  )
  for (const [index, source] of sources.entries()) {
    expect(source, productionScreens[index]).toMatch(/data-concept-screen|data-screen="home"/)
  }
})

test('the old Season map and prototype presentation paths are gone', async () => {
  const [app, allScreens] = await Promise.all([
    readFile(workspace('src/App.jsx'), 'utf8'),
    Promise.all(productionScreens.map((name) => readFile(workspace(`src/screens/${name}.jsx`), 'utf8'))),
  ])
  expect(app).not.toMatch(/SeasonMap|seasonmap|seasongame/)
  expect(allScreens.join('\n')).not.toMatch(/gameshowStages|back_button\.webp/)
  await expect(access(workspace('src/screens/SeasonMap.jsx'))).rejects.toThrow()
  await expect(access(workspace('src/screens/SeasonMap.module.css'))).rejects.toThrow()
})

test('route navigation exposes only the four approved permanent destinations', async () => {
  const source = await readFile(workspace('src/components/BottomNav.jsx'), 'utf8')
  expect(source).toMatch(/onCollection/)
  expect(source).toMatch(/onRewards/)
  expect(source).toMatch(/onMore/)
  expect(source).not.toMatch(/SHOP|RANKS|SPIN|PLAY/)
})

test('prototype Collection and Exchange screens use shared production panels', async () => {
  const [collection, exchange] = await Promise.all([
    readFile(workspace('src/screens/Inventory.jsx'), 'utf8'),
    readFile(workspace('src/screens/Marketplace.jsx'), 'utf8'),
  ])
  expect(collection).toMatch(/CardPanel/)
  expect(exchange).toMatch(/CardPanel/)
  expect(collection).toMatch(/BottomNav/)
})

test('the shared route layer owns responsive safe areas and typography', async () => {
  const [main, routes, screens] = await Promise.all([
    readFile(workspace('src/main.jsx'), 'utf8'),
    readFile(workspace('src/ui/route-consolidation.css'), 'utf8'),
    Promise.all(productionScreens.map((name) => readFile(workspace(`src/screens/${name}.module.css`), 'utf8').catch(() => ''))),
  ])
  expect(main).toMatch(/route-consolidation\.css/)
  expect(routes).toMatch(/var\(--fo-safe-top\)/)
  expect(routes).toMatch(/min-height: 44px/)
  expect(routes).toMatch(/@media \(min-width: 768px\)/)
  expect(screens.join('\n')).not.toMatch(/Arial|gameshowStages/)
})
