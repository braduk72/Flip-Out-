# Flip-Out Duplicate Card Recycler Report

## Card Shredder replacement - 20 July 2026

**Status:** Implemented and verified on development Preview. The old duplicate-only Recycler is now superseded by the approved Card Shredder.

The active Preview recipes are now data-driven:

- `shredder-normal-cards-v1`: 5 unbound normal Inventory cards -> 10 Coins.
- `shredder-foil-card-v1`: 1 unbound Foil Inventory card -> 25 Coins.

Duplicates are no longer required. Bound Theme Album cards are protected by `bound_quantity`; Collector Cards are rejected; Exchange escrow remains protected because listed cards are not in Inventory. The Shredder never grants Stars and never bypasses the economy boundary: Coin rewards are written through the tamper-evident Coin ledger as `shredder-reward` transactions with the original Shredder transaction ID as the source reference.

Schema/migration:

- Added migration `api/migrations/018_shredder_recipes.sql`.
- Added `selection_type` to `fo_recycler_recipes`.
- Disabled legacy `common-stars-v1`.
- Relaxed `fo_recycler_recipes_batch_size_check` from `batch_size > 1` to `batch_size > 0` so a one-Foil recipe is valid.
- Inserted/updated the two active Shredder recipes above.

Files changed:

- `api/_coinLedger.js`
- `api/_foActions.js`
- `api/_recycler.js`
- `api/migrations/018_shredder_recipes.sql`
- `src/screens/Collection.module.css`
- `src/screens/Inventory.jsx`
- `src/ui/collectionData.js`
- `src/version.js`
- `tests-ui/collection.test.jsx`
- `tests/collection-data.test.js`
- `tests/recycler-db.test.js`
- `tests/recycler.test.js`
- `vercel.shredder-verify.json`

Verification:

- Focused local Node: `node --test tests/recycler.test.js tests/recycler-db.test.js tests/collection-data.test.js tests/coin-ledger.test.js` -> **22 passed / 1 expected Preview DB skip**.
- Focused Collection UI: `npx.cmd vitest run tests-ui/collection.test.jsx` -> **9/9 passed**.
- Project aggregate: `npm.cmd test` -> Node **152 passed / 16 expected Preview-only skips**, UI **58/58 passed**.
- Focused lint: changed JS/JSX/tests passed with no findings. A direct CSS filename passed to ESLint produced the expected config warning because CSS is not linted by ESLint in this repo.
- Production build: `npm.cmd run build` -> passed, **155 transformed modules**.
- Preview build: `npm.cmd run build:preview` -> passed, **155 transformed modules**.

Preview deployment and database verification:

- First Preview attempt `dpl_BfXUiBttQ13L84vomqz7TkoHP4ow` correctly failed before deploy because the old `batch_size > 1` constraint rejected the one-Foil recipe; the migration rolled back.
- Migration fix commit `0b40e21` applied `018_shredder_recipes.sql` to Railway Preview database `railway`, schema `public`, host `yamanote.proxy.rlwy.net`, user `postgres`, with `VERCEL_ENV=preview`; `fo_schema_migrations` records `018_shredder_recipes.sql` at `2026-07-20T11:55:00.592Z`.
- Two follow-up Preview failures were test-cleanup issues only: the test initially tried to delete ledger-backed accounts, then tried to delete immutable ledger rows. The final test now leaves unique Preview test ledger rows intact, matching the ledger security model.
- Final Ready Preview: `dpl_BoSaausQxUQHDTW8YXDLpiXiWVFu` at `https://flip-85kzpzdta-chattocal.vercel.app`.
- Remote Preview verification: migration already applied; Preview Shredder DB test passed; focused remote test command passed **23/23**; remote Vite build passed with **155 transformed modules** and main bundle `/assets/index-C_lvjHpx.js`.
- Permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"ba640f0ca9628d791acd6ffae3a8b096"`, served the same HTML as the generated Preview, contained app marker `1.15.0-shredder`, and lazy Inventory bundle `/assets/Inventory-DAzhP3w8.js` contained `shred-cards`, `Card Shredder` and Coin recipe copy.

Remaining risks:

- Foil inventory definitions are still not broadly available in the catalogue, so the Foil recipe is backend/UI-ready but normal play cannot yet generate real Foil Shredder candidates.
- Preview DB verification leaves unique test accounts/ledger rows in place because the Coin ledger is intentionally immutable. This is acceptable in development Preview and should be handled later with a dedicated test namespace/archive policy if needed.
- The API function name `recycleDuplicateCards` remains as a compatibility alias even though the player-facing feature is now Shredder.

**Date:** 19 July 2026  
**Environment:** local development and Vercel Preview only  
**Production:** not accessed or changed

## Outcome

The Duplicate Card Recycler is implemented as a server-authoritative Collection feature. Players can select eligible common-card duplicates in complete batches, permanently destroy them and receive the configured guaranteed reward. The final copy of every card is protected by both the client model and the database transaction; bound copies are protected as an additional floor.

The first development recipe is intentionally provisional and data-driven:

- Recipe: `common-stars-v1`
- Input: 5 common duplicate cards, which may be mixed across card IDs
- Reward: 1 Star
- Coins are never created, granted or moved by the Recycler

Changing the future reward does not require changing transaction logic. It requires an approved recipe/config update and balancing review.

## Server and economy behaviour

- `recycleDuplicateCards` accepts an authenticated account, caller-supplied transaction ID, recipe ID and explicit card quantities.
- Card IDs are checked against the authoritative item catalogue. Non-cards, wrong rarities, invalid quantities and incomplete batches are rejected.
- A PostgreSQL transaction and per-request advisory lock serialise concurrent retries.
- Selected inventory rows are row-locked. Every deduction must leave `max(1, bound_quantity)` copies.
- Each destroyed card quantity is written to `fo_player_transactions` as a negative immutable history entry using the shared Recycler reference.
- The guaranteed reward is granted through the existing idempotent reward boundary in the same database transaction.
- A Recycler receipt and its exact input rows are committed only when every deduction and the reward succeed. Any interruption before commit rolls back the complete operation.
- Repeating the same transaction ID and selection returns the stored receipt without changing inventory or reward balance. Reusing an ID with different input, or from another account, is rejected.

## Schema

Additive migration: `api/migrations/010_duplicate_card_recycler.sql`

Tables:

- `fo_recycler_recipes`: versioned server recipe configuration.
- `fo_recycler_transactions`: account-owned idempotent receipt, input fingerprint, batch count and reward snapshot.
- `fo_recycler_transaction_items`: exact card IDs and quantities destroyed by each receipt.

Verified indexes and constraints include all three primary keys, account/time receipt index, item/transaction trace index, account and recipe foreign keys, positive quantity/batch checks, rarity allowlist and JSON-object reward checks.

Migration 010 committed to the Railway Preview database at `2026-07-19T14:17:11.289Z`; migration 011 committed at `2026-07-19T14:37:25.075Z`. Target identity was `yamanote.proxy.rlwy.net`, database `railway`, user `postgres`, schema `public`, with `VERCEL_ENV=preview`. Migrations 001–010 were already applied before 011. No Production target was used.

## Collection experience

- Added a responsive `Recycle` Collection view using the existing Concept 4D components and tokens.
- Shows the active server recipe, available duplicates, exact owned/recyclable counts, batch progress and guaranteed reward.
- Quantity controls have 44-pixel touch targets and never allow the last copy to be selected.
- The machine uses motion-aware gears, steam, glow, reward tray and completion feedback. Reduced-motion mode removes continuous and result animations.
- Failed/interrupted requests retain the selection and reuse the same transaction ID on retry.
- Completion shows the authoritative server receipt, destroyed-card count, reward and whether a safe retry was detected.
- Exchange-listed cards are not selectable because listing escrow already removes them from player inventory.

## Files added

- `api/_recycler.js`
- `api/migrations/010_duplicate_card_recycler.sql`
- `tests/recycler.test.js`
- `tests/recycler-db.test.js`
- `vercel.recycler-verify.json`
- `FLIPOUT_RECYCLER_REPORT.md`

## Files changed

- `api/_gameServices.js`
- `api/_foActions.js`
- `api/_playerState.js`
- `src/screens/Inventory.jsx`
- `src/screens/Collection.module.css`
- `src/ui/collectionData.js`
- `src/ui/Icon.jsx`
- `src/version.js`
- `tests/collection-data.test.js`
- `tests-ui/collection.test.jsx`
- Flip-Out status/design/completion reports

## Exact verification

- Focused server/model tests: **7 passed, 0 failed**.
- Focused Collection UI tests: **6 passed, 0 failed**.
- Focused lint across all changed JavaScript/JSX and tests: **passed, 0 findings**.
- Full local Node suite: **116 discovered; 107 passed, 0 failed, 9 Preview-only skipped**.
- Full local UI suite: **33 passed, 0 failed**.
- Local production build: **passed**, 139 modules in 1.21 seconds, main JS 405.54 kB / 128.17 kB gzip and Collection chunk 31.34 kB / 9.18 kB gzip.
- Preview Recycler verification: **10 passed, 0 failed, 0 skipped**, including exact 1-Star reward, live PostgreSQL concurrency, idempotency, cross-account rejection and last-copy protection.
- Preview verification build: **passed**, 139 modules in 1.11 seconds.
- Ready verification deployment: `https://flip-2byq6y99m-chattocal.vercel.app` (`dpl_FHvohRLGLRDrPu2pm7byUoDeZXKt`).
- Final balance-correction Preview deployment: `https://flip-r2k6hd99c-chattocal.vercel.app` (`dpl_DNHovuYCSAC6VwmAXro8xr9rsPGS`), Ready after migration 011, the 10-test focused verification build and the singular Star-copy update.
- Dev-branch commit: `2d8eefb` (`Build secure duplicate card recycler`). Standard Vercel deployment `dpl_Pe11GoVn1HEQwY97ktuzYbWx74WW` reached Ready at `https://flip-8lnylx40e-chattocal.vercel.app`.
- Permanent development URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200, used the same `/assets/index-DHG-xlKH.js` bundle and ETag as the generated deployment, and contained build version `1.5.0-recycler`.

The first full Preview migration build applied migration 010 and passed **115 of 116** tests. Its only failure was unrelated to the Recycler: Vercel's source upload omitted the gitignored native Android `MainActivity.java` expected by `tests/mobile-ux.test.js`. The focused Preview verification was therefore run separately and passed. This packaging limitation remains recorded; mobile code was not changed as part of this package.

## Remaining risks and decisions

- The 5-common-to-1-Star recipe is a provisional development value, not approved final economy balance. It needs simulation against duplicate acquisition rates, Exchange prices and normal play rewards.
- Only the common recipe is enabled. Higher rarities, Gold Collector and future Foil cards must not be recycled until separate rules and values are approved.
- The Recycler records permanent receipts and source transactions, but an operational admin trace/export UI has not been added.
- The visual machine uses reusable CSS/SVG primitives. Final audio and haptic patterns need physical-device review; no new audio asset was invented.
- Vercel Preview packaging of gitignored native project files prevents the broad database build from running the native-file presence test. Local full tests remain green.

## Best next task

Run duplicate-acquisition and Exchange-value simulations before changing the provisional recipe. Measure how many recyclable commons a player earns per hour and ensure recycling remains a floor value below trading and normal play. Do not add new Recycler currencies until a broader crafting system actually needs one.
