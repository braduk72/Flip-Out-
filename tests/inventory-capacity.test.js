import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateCardInventoryUsage,
  configuredCardInventoryCapacity,
  countsTowardCardInventoryCapacity,
  DEFAULT_CARD_INVENTORY_CAPACITY,
} from '../api/_inventoryCapacity.js'

test('Inventory capacity default is configurable and safe', () => {
  assert.equal(DEFAULT_CARD_INVENTORY_CAPACITY, 1000)
  assert.equal(configuredCardInventoryCapacity('250'), 250)
  assert.equal(configuredCardInventoryCapacity('bad'), DEFAULT_CARD_INVENTORY_CAPACITY)
})

test('Inventory capacity counts card quantities only', () => {
  assert.equal(countsTowardCardInventoryCapacity('card:cats:1'), true)
  assert.equal(countsTowardCardInventoryCapacity('inventory:lockbox:standard'), false)
  assert.equal(calculateCardInventoryUsage([
    { item_id: 'card:cats:1', quantity: 2 },
    { item_id: 'inventory:key:standard', quantity: 99 },
    { item_id: 'card:woof:1', quantity: 3 },
  ]), 5)
})
