import crypto from 'node:crypto'
import { ITEM_BY_ID } from '../src/data/itemCatalog.js'
import { applyReward, enforceRateLimit } from './_gameServices.js'

const SAFE_REQUEST_ID = /^[a-z0-9][a-z0-9:_-]{0,79}$/i

function fail(message, status = 400, code = 'RECYCLER_INVALID') {
  throw Object.assign(new Error(message), { status, code })
}

function requestId(value) {
  const id = String(value ?? '')
  if (!SAFE_REQUEST_ID.test(id)) fail('Invalid recycler transaction ID')
  return id
}

export function normaliseRecyclerItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) fail('Select at least one duplicate card')
  const combined = new Map()
  for (const entry of items) {
    const itemId = String(entry?.itemId ?? '')
    const quantity = Number(entry?.quantity)
    if (!/^[a-z0-9][a-z0-9:_-]{0,127}$/i.test(itemId) || !Number.isSafeInteger(quantity) || quantity < 1) fail('Invalid recycler card selection')
    combined.set(itemId, (combined.get(itemId) ?? 0) + quantity)
  }
  return [...combined].map(([itemId, quantity]) => ({ itemId, quantity })).sort((a, b) => a.itemId.localeCompare(b.itemId))
}

export function validateRecyclerSelection(items, recipe, catalog = ITEM_BY_ID) {
  const selection = normaliseRecyclerItems(items)
  if (!recipe?.enabled) fail('Recycler recipe is unavailable', 409, 'RECYCLER_RECIPE_UNAVAILABLE')
  const batchSize = Number(recipe.batch_size ?? recipe.batchSize)
  if (!Number.isSafeInteger(batchSize) || batchSize < 2) fail('Recycler recipe is invalid', 500, 'RECYCLER_RECIPE_INVALID')
  let cardsConsumed = 0
  for (const entry of selection) {
    const card = catalog.get(entry.itemId)
    if (!card || !['card', 'card_variant'].includes(card.type)) fail('Only collectible cards can be recycled')
    if (card.variant === 'gold') fail('Collector cards cannot be recycled', 409, 'RECYCLER_COLLECTOR_CARD')
    if (card.rarity !== recipe.rarity) fail(`This recipe accepts ${recipe.rarity} cards only`, 409, 'RECYCLER_RARITY_MISMATCH')
    cardsConsumed += entry.quantity
  }
  if (cardsConsumed % batchSize !== 0) fail(`Select a complete batch of ${batchSize} cards`, 409, 'RECYCLER_INCOMPLETE_BATCH')
  return { selection, cardsConsumed, batches: cardsConsumed / batchSize }
}

export function recyclerFingerprint(recipeId, items) {
  const selection = normaliseRecyclerItems(items)
  return crypto.createHash('sha256').update(JSON.stringify({ recipeId, selection })).digest('hex')
}

function multiplyReward(reward, batches) {
  const currencyId = reward?.currencyId ?? null
  const itemId = reward?.itemId ?? null
  const amount = Number(reward?.amount)
  if (Boolean(currencyId) === Boolean(itemId) || !Number.isSafeInteger(amount) || amount < 1) fail('Recycler reward is invalid', 500, 'RECYCLER_REWARD_INVALID')
  const total = amount * batches
  if (!Number.isSafeInteger(total)) fail('Recycler reward is too large', 500, 'RECYCLER_REWARD_INVALID')
  return { ...(currencyId ? { currencyId } : { itemId }), amount: total }
}

async function priorReceipt(client, transactionId) {
  const receipt = await client.query(`SELECT transaction_id,player_id,recipe_id,input_fingerprint,cards_consumed,batches,reward,created_at FROM fo_recycler_transactions WHERE transaction_id=$1`, [transactionId])
  if (!receipt.rowCount) return null
  const inputs = await client.query(`SELECT item_id,quantity FROM fo_recycler_transaction_items WHERE transaction_id=$1 ORDER BY item_id`, [transactionId])
  return { ...receipt.rows[0], items: inputs.rows.map(row => ({ itemId: row.item_id, quantity: Number(row.quantity) })) }
}

function receiptResult(row, duplicate) {
  return {
    duplicate,
    transactionId: row.transaction_id,
    recipeId: row.recipe_id,
    cardsConsumed: Number(row.cards_consumed),
    batches: Number(row.batches),
    reward: row.reward,
    items: row.items,
    createdAt: row.created_at,
  }
}

export async function recycleDuplicateCards(db, { playerId, transactionId: suppliedId, recipeId, items }) {
  const transactionId = requestId(suppliedId)
  const safeRecipeId = String(recipeId ?? '')
  if (!/^[a-z0-9][a-z0-9:_-]{0,127}$/i.test(safeRecipeId)) fail('Invalid recycler recipe')
  const selection = normaliseRecyclerItems(items)
  const fingerprint = recyclerFingerprint(safeRecipeId, selection)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`recycler:${transactionId}`])
    const prior = await priorReceipt(client, transactionId)
    if (prior) {
      if (String(prior.player_id) !== String(playerId)) fail('Recycler transaction belongs to another account', 403, 'RECYCLER_ACCOUNT_CONFLICT')
      if (prior.input_fingerprint !== fingerprint) fail('Recycler transaction ID was already used for a different selection', 409, 'RECYCLER_IDEMPOTENCY_CONFLICT')
      await client.query('COMMIT')
      return receiptResult(prior, true)
    }

    await enforceRateLimit(client, { playerId, action: 'recycler', limit: 20 })
    const recipeResult = await client.query(`SELECT recipe_id,rarity,batch_size,reward,enabled,config_version FROM fo_recycler_recipes WHERE recipe_id=$1`, [safeRecipeId])
    if (!recipeResult.rowCount) fail('Recycler recipe not found', 404, 'RECYCLER_RECIPE_NOT_FOUND')
    const recipe = recipeResult.rows[0]
    const validated = validateRecyclerSelection(selection, recipe)
    const inventory = await client.query(`SELECT item_id,quantity,bound_quantity FROM fo_player_inventory WHERE player_id=$1 AND item_id=ANY($2::text[]) ORDER BY item_id FOR UPDATE`, [playerId, validated.selection.map(entry => entry.itemId)])
    const owned = new Map(inventory.rows.map(row => [row.item_id, row]))
    for (const entry of validated.selection) {
      const row = owned.get(entry.itemId)
      const quantity = Number(row?.quantity ?? 0)
      const floor = Math.max(1, Number(row?.bound_quantity ?? 0))
      if (quantity - entry.quantity < floor) fail(`Keep at least one copy of ${ITEM_BY_ID.get(entry.itemId)?.name ?? entry.itemId}`, 409, 'RECYCLER_LAST_COPY')
    }

    for (const [index, entry] of validated.selection.entries()) {
      await applyReward(client, {
        playerId,
        transactionId: `${transactionId}:card:${index}`,
        source: 'card-recycler-consume',
        reward: { itemId: entry.itemId, amount: -entry.quantity },
        minimumRemaining: 1,
        metadata: { sourceReferenceId: transactionId, recipeId: safeRecipeId },
      })
    }
    const reward = multiplyReward(recipe.reward, validated.batches)
    await applyReward(client, {
      playerId,
      transactionId: `${transactionId}:reward`,
      source: 'card-recycler-reward',
      reward,
      metadata: { sourceReferenceId: transactionId, recipeId: safeRecipeId, batches: validated.batches },
    })
    await client.query(`INSERT INTO fo_recycler_transactions(transaction_id,player_id,recipe_id,input_fingerprint,cards_consumed,batches,reward) VALUES($1,$2,$3,$4,$5,$6,$7)`, [transactionId, playerId, safeRecipeId, fingerprint, validated.cardsConsumed, validated.batches, reward])
    for (const entry of validated.selection) await client.query(`INSERT INTO fo_recycler_transaction_items(transaction_id,item_id,quantity) VALUES($1,$2,$3)`, [transactionId, entry.itemId, entry.quantity])
    await client.query('COMMIT')
    return receiptResult({ transaction_id: transactionId, recipe_id: safeRecipeId, cards_consumed: validated.cardsConsumed, batches: validated.batches, reward, items: validated.selection, created_at: new Date().toISOString() }, false)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getRecyclerRecipes(db) {
  const result = await db.query(`SELECT recipe_id,rarity,batch_size,reward,config_version FROM fo_recycler_recipes WHERE enabled ORDER BY rarity,recipe_id`)
  return result.rows.map(row => ({
    recipeId: row.recipe_id,
    rarity: row.rarity,
    batchSize: Number(row.batch_size),
    reward: row.reward,
    configVersion: Number(row.config_version),
  }))
}
