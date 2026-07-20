import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Settings from '../src/screens/Settings.jsx'

const playerPayload = {
  state: {
    profile: {
      player_id: 'player-one',
      display_name: 'Brad',
      selected_avatar_id: 'clash-badger',
      selected_title_prefix_id: null,
      selected_title_suffix_id: null,
    },
    playerTitles: {
      selected: { prefixId: null, suffixId: null },
      display: 'Choose a title',
      available: {
        prefixes: [
          { id: 'title:prefix:captain', label: 'Captain', mode: 'before-name', source: 'starter' },
          { id: 'title:prefix:the-collector', label: 'The Collector', mode: 'standalone', source: 'starter' },
        ],
        suffixes: [
          { id: 'title:suffix:the-magnificent', label: 'the Magnificent', source: 'starter' },
        ],
      },
    },
  },
}

function renderSettings(overrides = {}) {
  return render(<Settings
    onBack={() => {}}
    onAbout={() => {}}
    onPrivacy={() => {}}
    onPatchNotes={() => {}}
    musicOn={false}
    sfxOn={false}
    onToggleMusic={() => {}}
    onToggleSfx={() => {}}
    difficulty="Medium"
    onDifficulty={() => {}}
    navProps={{}}
    {...overrides}
  />)
}

test('Settings lets players preview and save prefix plus suffix titles', async () => {
  const titleSaver = vi.fn().mockResolvedValue({
    selected: { prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' },
    display: 'Captain Brad the Magnificent',
    available: playerPayload.state.playerTitles.available,
  })
  renderSettings({ profileLoader: vi.fn().mockResolvedValue(playerPayload), titleSaver })

  expect(await screen.findByRole('heading', { name: 'Player Title' })).toBeInTheDocument()
  expect(screen.getByText('Choose a title')).toBeInTheDocument()
  const save = screen.getByRole('button', { name: 'Save Player Title' })
  expect(save).toBeDisabled()
  await userEvent.selectOptions(screen.getByLabelText('Prefix'), 'title:prefix:captain')
  await userEvent.selectOptions(screen.getByLabelText('Suffix'), 'title:suffix:the-magnificent')
  expect(screen.getByText('Captain Brad the Magnificent')).toBeInTheDocument()
  expect(save).toBeEnabled()
  await userEvent.click(save)
  expect(titleSaver).toHaveBeenCalledWith({ prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' })
  expect(await screen.findByRole('status')).toHaveTextContent('Player title saved.')
})

test('Settings reports title load failures without blocking other settings', async () => {
  renderSettings({ profileLoader: vi.fn().mockRejectedValue(new Error('Preview profile unavailable')) })
  expect(await screen.findByRole('alert')).toHaveTextContent('Preview profile unavailable')
  expect(screen.getByLabelText('Select difficulty')).toBeInTheDocument()
})

