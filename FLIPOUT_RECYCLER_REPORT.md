# Flip-Out Duplicate Card Recycler Report

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
