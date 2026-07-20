import { ITEM_BY_ID } from '../src/data/itemCatalog.js'

export const DEFAULT_CARD_INVENTORY_CAPACITY = 1000

export function configuredCardInventoryCapacity(value = process.env.FO_INVENTORY_CARD_CAPACITY) {
  const capacity = Number(value ?? DEFAULT_CARD_INVENTORY_CAPACITY)
  if (!Number.isSafeInteger(capacity) || capacity < 1) return DEFAULT_CARD_INVENTORY_CAPACITY
  return capacity
}

export function countsTowardCardInventoryCapacity(itemId, catalog = ITEM_BY_ID) {
  const item = catalog.get(itemId)
  return item?.type === 'card' || item?.type === 'card_variant'
}

export function calculateCardInventoryUsage(rows = [], catalog = ITEM_BY_ID) {
  return rows.reduce((sum, row) => {
    if (!countsTowardCardInventoryCapacity(row.item_id, catalog)) return sum
    return sum + Math.max(0, Number(row.quantity) || 0)
  }, 0)
}

async function capacityFor(client, playerId) {
  const result = await client.query(`SELECT card_capacity FROM fo_player_inventory_settings WHERE player_id=$1`, [playerId])
  return Number(result.rows[0]?.card_capacity) || configuredCardInventoryCapacity()
}

export async function getInventoryCapacityState(db, playerId) {
  const [settings, inventory] = await Promise.all([
    db.query(`SELECT card_capacity FROM fo_player_inventory_settings WHERE player_id=$1`, [playerId]),
    db.query(`SELECT item_id,quantity FROM fo_player_inventory WHERE player_id=$1 AND quantity > 0`, [playerId]),
  ])
  const capacity = Number(settings.rows[0]?.card_capacity) || configuredCardInventoryCapacity()
  const used = calculateCardInventoryUsage(inventory.rows)
  return { cardCapacity: capacity, cardCount: used, remainingCardSlots: Math.max(0, capacity - used) }
}

export async function enforceCardInventoryCapacity(client, { playerId, itemId, additionalQuantity }) {
  const amount = Number(additionalQuantity)
  if (!Number.isSafeInteger(amount) || amount <= 0 || !countsTowardCardInventoryCapacity(itemId)) return null
  await client.query(`SELECT player_id FROM fo_accounts WHERE player_id=$1 FOR UPDATE`, [playerId])
  const capacity = await capacityFor(client, playerId)
  const inventory = await client.query(`SELECT item_id,quantity FROM fo_player_inventory WHERE player_id=$1 FOR UPDATE`, [playerId])
  const used = calculateCardInventoryUsage(inventory.rows)
  if (used + amount > capacity) {
    throw Object.assign(new Error('Inventory capacity exceeded'), { status: 409, code: 'INVENTORY_CAPACITY_EXCEEDED', capacity, used, requested: amount })
  }
  return { capacity, used, remainingAfterGrant: capacity - used - amount }
}
