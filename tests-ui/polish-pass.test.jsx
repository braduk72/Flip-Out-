import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { BottomNavigation } from '../src/ui/components.jsx'
import { AVATAR_CATALOG, ONBOARDING_AVATARS, getAvatarById, isCuratedAvatarId } from '../src/data/avatarCatalog.js'
import { STARTER_COLLECTION_POLICY, isStarterCollectionConfigured } from '../src/data/starterCollectionPolicy.js'
import { PACK_OPENING_PHASES, createPackOpeningPresentation } from '../src/ui/packOpeningFlow.js'
import { playUiAudio, UI_AUDIO_EVENTS } from '../src/ui/audio.js'

test('bottom navigation exposes all five permanent destinations in one navigation landmark', () => {
  render(<BottomNavigation active="home" onNavigate={() => {}}/>)
  const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
  expect(navigation.querySelectorAll('[data-nav-item]')).toHaveLength(5)
  expect(navigation).toHaveTextContent('Home')
  expect(navigation).toHaveTextContent('Collection')
  expect(navigation).toHaveTextContent('Rewards')
  expect(navigation).toHaveTextContent('Store')
  expect(navigation).toHaveTextContent('More')
})

test('the sole avatar catalogue is curated from public/images/avatars and preserves legacy display aliases', () => {
  expect(ONBOARDING_AVATARS).toBe(AVATAR_CATALOG)
  expect(AVATAR_CATALOG).toHaveLength(12)
  for (const avatar of AVATAR_CATALOG) {
    expect(avatar.asset).toMatch(/^\/images\/avatars\/clash-[a-z]+\.webp$/)
    expect(isCuratedAvatarId(avatar.id)).toBe(true)
  }
  expect(isCuratedAvatarId('starter-1')).toBe(false)
  expect(getAvatarById('starter-1')?.id).toBe('clash-badger')
  expect(getAvatarById('beta-tester')?.id).toBe('clash-robot')
})

test('starter collection remains an unconfigured all-active-theme contract', () => {
  expect(STARTER_COLLECTION_POLICY.commonCardCount).toBeNull()
  expect(STARTER_COLLECTION_POLICY.commonSelection).toMatchObject({ rarity: 'common', themes: 'all-active-themes', selection: 'random', fixedDeckIds: [] })
  expect(STARTER_COLLECTION_POLICY.guaranteedFoil).toMatchObject({ rarity: 'common', count: 1, themes: 'all-active-themes' })
  expect(isStarterCollectionConfigured()).toBe(false)
})

test('pack opening presentation is a dormant flow contract with five server-provided cards', () => {
  expect(PACK_OPENING_PHASES).toEqual(expect.arrayContaining(['enlarging', 'turning', 'tearing', 'opening', 'dealing', 'fan-ready', 'revealing']))
  const flow = createPackOpeningPresentation({ packId: 'preview-pack-1', cards: [{ id: 'one' }, { id: 'two' }, { id: 'three' }, { id: 'four' }, { id: 'five' }] })
  expect(flow.phase).toBe('idle')
  expect(flow.cards).toHaveLength(5)
  expect(flow.cards.every(card => !card.revealed)).toBe(true)
})

test('automated tests suppress UI audio centrally', () => {
  expect(playUiAudio(UI_AUDIO_EVENTS.BUTTON_PRESS)).toBe(false)
})
