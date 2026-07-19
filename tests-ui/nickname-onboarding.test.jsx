import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Home from '../src/screens/Home.jsx'
import NicknameOnboarding from '../src/components/NicknameOnboarding.jsx'
import AvatarOnboarding from '../src/components/AvatarOnboarding.jsx'

const onboardingData = {
  profile: { accountKind: 'guest', displayName: null, playerName: 'Guest Player', level: null, xp: null, xpTarget: null },
  currencies: { stars: 0, coins: 0 },
  match3: { level: 1, completed: 0, resume: null },
  collection: { owned: 0, total: 1, newest: null },
  foil: { owned: 0, target: 10, available: false },
  season: { current: 0, total: 32, label: 'Season 1' },
  dailyLogin: { available: false },
  community: null,
}

test('nickname onboarding accepts a valid nickname and enables Continue', async () => {
  const submit = vi.fn().mockResolvedValue({ displayName: 'CatFan99' })
  render(<NicknameOnboarding onSubmit={submit}/>)
  const input = screen.getByLabelText('Nickname')
  const continueButton = screen.getByRole('button', { name: 'Continue' })
  expect(continueButton).toBeDisabled()
  await userEvent.type(input, 'CatFan99')
  expect(continueButton).toBeEnabled()
  await userEvent.click(continueButton)
  expect(submit).toHaveBeenCalledWith('CatFan99')
})

test('nickname onboarding gives immediate client feedback for invalid names', async () => {
  render(<NicknameOnboarding onSubmit={vi.fn()}/>)
  const input = screen.getByLabelText('Nickname')
  await userEvent.type(input, 'A!')
  expect(screen.getByText(/use 3–12 characters/i)).toBeInTheDocument()
  await userEvent.clear(input)
  await userEvent.type(input, 'Brad SC')
  expect(screen.getByText(/use letters and numbers only/i)).toBeInTheDocument()
})

test('avatar grid selects a starter avatar and enables Continue', async () => {
  const submit = vi.fn().mockResolvedValue({ avatarId: 'clash-badger' })
  render(<AvatarOnboarding onSubmit={submit}/>)
  const continueButton = screen.getByRole('button', { name: 'Continue' })
  expect(continueButton).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: 'Select Badger' }))
  expect(continueButton).toBeEnabled()
  await userEvent.click(continueButton)
  expect(submit).toHaveBeenCalledWith('clash-badger')
})

test('Home resumes nickname then avatar onboarding and persists each step once', async () => {
  const saver = vi.fn().mockResolvedValue({ displayName: 'Gizmo' })
  const avatarSaver = vi.fn().mockResolvedValue({ avatarId: 'clash-badger' })
  render(<Home dataLoader={vi.fn().mockResolvedValue(onboardingData)} nicknameSaver={saver} avatarSaver={avatarSaver} onMatch3={() => {}} sfxOn={false}/>)
  await screen.findByRole('heading', { name: 'Choose your nickname' })
  expect(screen.queryByRole('heading', { name: 'MATCH-3' })).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Nickname'), 'Gizmo')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(saver).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('heading', { name: 'Choose your avatar' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Select Badger' }))
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(avatarSaver).toHaveBeenCalledWith('clash-badger')
  expect(await screen.findByRole('heading', { name: 'MATCH-3' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Choose your nickname' })).not.toBeInTheDocument()
})

test('existing players bypass nickname onboarding', async () => {
  render(<Home dataLoader={vi.fn().mockResolvedValue({ ...onboardingData, profile: { ...onboardingData.profile, displayName: 'Brad', avatarId: 'clash-blackhole', playerName: 'Brad' } })} onMatch3={() => {}} sfxOn={false}/>)
  expect(await screen.findByRole('heading', { name: 'MATCH-3' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Choose your nickname' })).not.toBeInTheDocument()
})

test('nickname-only players resume directly at avatar selection', async () => {
  render(<Home dataLoader={vi.fn().mockResolvedValue({ ...onboardingData, profile: { ...onboardingData.profile, displayName: 'Brad', playerName: 'Brad' } })} onMatch3={() => {}} sfxOn={false}/>)
  expect(await screen.findByRole('heading', { name: 'Choose your avatar' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Choose your nickname' })).not.toBeInTheDocument()
})
