import assert from 'node:assert/strict'
import test from 'node:test'
import { playerTitleState, setPlayerTitle } from '../api/_playerTitles.js'
import { formatPlayerTitle, normaliseTitleSelection, availablePlayerTitles } from '../src/data/playerTitles.js'

function createTitleDb() {
  const account = {
    player_id: 'player-one',
    display_name: 'Brad',
    selected_title_prefix_id: null,
    selected_title_suffix_id: null,
  }
  const inventory = new Map()
  return {
    account,
    inventory,
    async query(sql, params) {
      if (sql.includes('SELECT player_id, display_name, selected_title_prefix_id')) {
        return { rowCount: 1, rows: [{ ...account }] }
      }
      if (sql.includes('SELECT item_id, quantity')) {
        return { rows: [...inventory.entries()].map(([item_id, quantity]) => ({ item_id, quantity })) }
      }
      if (sql.includes('UPDATE fo_accounts')) {
        account.selected_title_prefix_id = params[1]
        account.selected_title_suffix_id = params[2]
        return { rowCount: 1, rows: [{ ...account }] }
      }
      throw new Error(`Unexpected SQL: ${sql}`)
    },
  }
}

test('player title formatting supports prefix, suffix and combined titles', () => {
  assert.equal(formatPlayerTitle({ playerName: 'Brad', prefixId: 'title:prefix:the-collector' }), 'The Collector')
  assert.equal(formatPlayerTitle({ playerName: 'Brad', prefixId: 'title:prefix:captain' }), 'Captain Brad')
  assert.equal(formatPlayerTitle({ playerName: 'Brad', suffixId: 'title:suffix:the-magnificent' }), 'Brad the Magnificent')
  assert.equal(formatPlayerTitle({ playerName: 'Brad', prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' }), 'Captain Brad the Magnificent')
  assert.equal(formatPlayerTitle({ playerName: 'Brad' }), 'Choose a title')
})

test('title validation rejects unknown prefixes and suffixes', () => {
  assert.deepEqual(normaliseTitleSelection({ prefixId: '', suffixId: null }), { prefixId: null, suffixId: null })
  assert.throws(() => normaliseTitleSelection({ prefixId: 'admin' }), error => error.code === 'INVALID_TITLE_PREFIX')
  assert.throws(() => normaliseTitleSelection({ suffixId: 'title:prefix:captain' }), error => error.code === 'INVALID_TITLE_SUFFIX')
})

test('starter titles are available without inventory and future owned title items can unlock later', () => {
  const titles = availablePlayerTitles([])
  assert.ok(titles.prefixes.some(title => title.id === 'title:prefix:captain'))
  assert.ok(titles.suffixes.some(title => title.id === 'title:suffix:the-magnificent'))
})

test('server persists selected player title and returns display state', async () => {
  const db = createTitleDb()
  const result = await setPlayerTitle(db, { playerId: 'player-one', prefixId: 'title:prefix:captain', suffixId: 'title:suffix:the-magnificent' })
  assert.equal(db.account.selected_title_prefix_id, 'title:prefix:captain')
  assert.equal(db.account.selected_title_suffix_id, 'title:suffix:the-magnificent')
  assert.equal(result.display, 'Captain Brad the Magnificent')
  assert.deepEqual(playerTitleState({ profile: db.account, inventory: [] }).selected, {
    prefixId: 'title:prefix:captain',
    suffixId: 'title:suffix:the-magnificent',
  })
})

