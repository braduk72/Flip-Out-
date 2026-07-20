# Flip-Out continuation report

## Exchange commission update - 20 July 2026

Changed the Exchange commission from 10% to 20% in the shared `auctionAmounts` rule. Marketplace settlement still uses the existing server-side flow: the buyer pays Coins, the seller receives the gross amount, the Exchange fee is deducted, the buyer receives the item, and the listing is marked sold atomically.

Updated player-facing Exchange copy to say sellers receive 80% and the Exchange fee is 20%. Updated local and Preview DB settlement expectations to `{ gross: 101, fee: 20, net: 81 }`.

Verification:

- Focused Node: `node --test tests\progression.test.js tests\game-services.test.js tests\game-services-db.test.js` - **14 passed / 0 failed / 1 Preview DB skip**.
- Focused lint: `npx.cmd eslint api\_progressionRules.js api\_operations.js src\screens\Marketplace.jsx tests\progression.test.js tests\game-services-db.test.js` - passed.
- Production build: `npm.cmd run build` - passed; main JS `412.66 kB / 130.49 kB gzip`.
- No schema migration was required. Production was not touched.

## Preview Developer Toolkit - 20 July 2026

Added the first restricted QA toolkit for Preview only. The hidden `?dev=toolkit` route lets an authenticated Preview player inspect authoritative state, grant catalogue items, grant one full Normal Theme into Inventory, grant authorised promotional Coins via the protected Coin ledger, and reset their own Inventory, Theme Album entries/collector records or Exchange listings. It is not linked from player navigation.

Security boundary: `/api/fo-game?service=dev-tools` returns 404 outside Preview, requires a configured `DEV_TOOLKIT_SECRET`, requires the normal Bearer player session, and never exposes a client-authoritative balance path. Coin creation uses the existing `promotional-grant` ledger route. Item grants use `applyReward`, preserving transaction IDs, Inventory-capacity checks and duplicate protection.

Foil grants and achievement resets remain prepared but inactive because the repository still has no authoritative Foil item definitions or achievement tables. `DEV_TOOLKIT_SECRET` is configured as a Vercel Sensitive Preview env var for branch `dev` and saved locally in ignored `.dev-toolkit-secret.local`. No schema migration was added and Production was not touched.

Verification:

- Focused Node: `node --test tests\dev-tools.test.js` - **4/4 passed**.
- Focused UI: `npx.cmd vitest run --config vitest.config.js tests-ui\dev-toolkit.test.jsx` - **2/2 passed**.
- Focused lint: `npx.cmd eslint api\_foDevTools.js api\fo-game.js src\utils\gameApi.js src\ui\devToolkitAccess.js src\screens\DevToolkit.jsx tests\dev-tools.test.js tests-ui\dev-toolkit.test.jsx` - passed.
- Production build: `npm.cmd run build` - passed; main JS `412.66 kB / 130.50 kB gzip`; toolkit lazy chunk stayed independently split at `5.32 kB / 1.88 kB gzip`.
- Deployment: toolkit commit `e093a6a` and report/env trigger commit `6575843` were pushed to `dev`; Vercel Ready Preview `https://flip-6axzz5ohh-chattocal.vercel.app` updated `https://dev.flipout.gizmogames.uk`.
- Live verification: permanent and generated URLs returned HTTP 200 with matching ETag `"859865aa8a9dc13357b1cd0adc3896e7"`; permanent bundle `/assets/index-BHpPfOdN.js` contained `1.10.0-preview-dev-toolkit`; dev-tools API with the saved local secret and no Bearer session returned HTTP 401.

## Official Theme Album Collection UI — 20 July 2026

The first working Official Theme Album presentation is implemented and deployed to development Preview. The previous generic album/set presentation has been replaced by themed album covers, reusable theme presentation metadata, a Collector Card pyramid page, numbered album pages with paired Normal/Foil slots, rarity stars with text labels, and title plaques. Inventory ownership is now clearly separate from permanent Official Album completion.

Stick placement is wired to the existing authoritative `stick-in-album` operation: eligible inventory copies show the exact `Stick in Album` wording, a confirmation explains permanence/trade/shred/capacity consequences, transaction IDs are generated client-side for retry safety, and successful placement reloads authoritative state before showing the slot-fill highlight. No new migration or new API was added. Collector Card awarding remains the existing server-authoritative/idempotent backend behaviour from the Theme Album boundary. Personal Albums are visible from Albums and reuse the existing 10-album/500-Coin/create/add/remove organisational backend; membership still does not consume inventory or affect Official Album progress.

Files changed: `src/ui/collectionData.js`, `src/screens/Inventory.jsx`, `src/screens/Collection.module.css`, `src/version.js`, `tests/collection-data.test.js`, `tests-ui/collection.test.jsx`.

Verification:

- Focused Node: `node --test tests\collection-data.test.js tests\theme-albums.test.js tests\theme-albums-db.test.js tests\personal-albums.test.js tests\personal-albums-db.test.js` — **16 passed / 0 failed / 2 Preview DB skips**.
- Focused UI: `npx.cmd vitest run --config vitest.config.js tests-ui\collection.test.jsx tests-ui\collection-responsive.test.js` — **10/10 passed**.
- Focused lint: `npx.cmd eslint src\screens\Inventory.jsx src\ui\collectionData.js tests\collection-data.test.js tests-ui\collection.test.jsx` — passed.
- Production build: `npm.cmd run build` — passed; main JS `412.07 kB / 130.29 kB gzip`, Inventory JS `45.86 kB / 13.15 kB gzip`.
- Full suite: `npm.cmd test` — Node **138 passed / 0 failed / 15 Preview DB skips**; UI **52/52 passed**.
- Preview DB attempt: relevant `*-db` tests remained skipped because the local Preview env file does not contain `DATABASE_URL`.

Deployment: code commit `7fdb453` was pushed from `dev`. Vercel Ready Preview `dpl_8zVSfKKKkKVJjiVvhpCb3VtJWd91` (`https://flip-fh7x3wnkw-chattocal.vercel.app`) is assigned to `https://dev.flipout.gizmogames.uk`. The permanent URL returned HTTP 200, identical HTML/ETag `"0b98da1361681ff70cc9997521afd2ef"` to the generated Preview, and served `/assets/index-Bw3DN3ii.js` containing `1.9.0-theme-albums-ui`. Production was not touched.

Manual Preview acceptance confirmed the Theme Album landing, variable theme totals, Super Cars Collector pyramid, numbered Normal/Foil paired spaces, rarity stars/text, title plaques, album navigation and responsive behaviour at 360x740, 820x1180 and 1280x900 with no horizontal overflow or undersized visible buttons. A live Stick placement could not be completed in the disposable browser guest because it had no eligible card inventory and there is no approved dev-only card grant UI; automated UI/action and server idempotency tests cover that path until a QA inventory seed exists.

## Mobile UX polish package — 19 July 2026

Phone shells now use portrait orientation, while tablets retain portrait/landscape at the 600 dp smallest-width boundary. The web uses progressive Screen Orientation support plus an accessible portrait guard, and the shell consumes runtime safe-area insets on all four edges. Phone-landscape presentation CSS was removed instead of maintaining compressed layouts.

The Home carousel now provides native finger scrolling, momentum and snapping, autoplay, indicators and non-overlay controls. Daily Reward collection remains server-authoritative, blocks immediate duplicate taps, keeps its pending button semantics and displays only the confirmed reward. Shared coarse-pointer targets have a 44 x 44 CSS-pixel minimum. Full technical evidence and physical-device limitations are in `FLIPOUT_MOBILE_UX_REPORT.md`; no economy or gameplay balance was altered.

The first real Preview claim exposed a pre-existing cross-account collision in the date-only Daily transaction ID. The ID now includes the authenticated player ID; same-account retries remain idempotent and different accounts can claim independently.

Final result: Node 108 total / 100 passed / 0 failed / 8 restricted Preview-database skips; UI 20/20; focused lint clean; both builds passed. API verification used Ready Preview `dpl_JAn3NGNQJSLttPuV2x5krL5JwWD2`; `https://dev.flipout.gizmogames.uk` returned HTTP 200 and version `1.2.1-mobile-ux`. A disposable guest claim changed Stars from 0 to exactly 50; the immediate retry returned duplicate with the same claim ID and no second grant. Production remained untouched.

> **Development deployment URL:** Future verification and handover reports use `https://dev.flipout.gizmogames.uk`. Vercel-generated `*.vercel.app` addresses below are preserved only as historical deployment evidence, not as user-facing development URLs.

## Match-3 card-art token package — 19 July 2026

The six geometric Match-3 placeholders were replaced across both the real board and Home engine preview by hand-framed circular crops of existing card artwork. Explicit metadata preserves each source card ID/path, focal point, zoom, rotation, accessible label, fallback and review status; a deterministic Sharp script produces the 256 px transparent WebPs and 32 px quality signals. The gated development review route `/?dev=match3-tokens` presents all assets at full, board, smallest-phone and reduced-vision sizes.

All six crops passed actual-size visual inspection. Regeneration was byte-stable; token Node tests passed **3/3**, focused token/preview UI tests **6/6**, full Node tests **82 passed / 0 failed / 8 Preview-only skipped**, full UI tests **19/19**, focused lint passed, and both production and Preview builds passed. Commit `9ad2af5` deployed as Ready Preview `dpl_FdZJ9q6EkfNTtR3nJ6pwQKxZHa3X`; `https://dev.flipout.gizmogames.uk` returned 200, served the same HTML/ETag as the generated deployment, exposed all six token assets and the quality report at 200, and reported `1.1.1-card-tokens`. No Match-3 rules, progression, economy, database or production environment was changed.

## Concept 4D Home implementation — 19 July 2026

The approved permanent Home direction is implemented in one pass: original layered SVG/WebP assets, a tokenised reusable React component system, data-driven/swipeable promotions, safe-area fixed player/economy header, real-engine animated Match-3 preview, signature purple Play control, contextual Daily Reward, collection/Foil/season progress, modal/loading/error/empty states and four-item navigation. Existing game modes and economy/authentication boundaries were retained.

Verification: UI **15/15 passed**; full local Node discovery **87 total / 79 passed / 0 failed / 8 Preview-only skipped**; focused lint **0 errors / 0 warnings**; production and Preview builds passed with 128 modules, main JS **412.01 kB / 129.33 kB gzip** and main CSS **95.44 kB / 20.15 kB gzip**. Commit `c4e34bc` is live at `https://dev.flipout.gizmogames.uk`; page and new UI assets return 200 and the bundle reports `1.1.0-ui4d`. Vercel confirms the custom domain is attached to the Ready Preview deployment and correctly configured. The Preview DB-only suite remains unexecuted because sensitive database/HMAC values are intentionally unavailable to Vercel CLI execution; browser visual screenshots remain blocked by the user-level browser privacy rule. Full detail: `FLIPOUT_UI_IMPLEMENTATION_REPORT.md`; assets: `UI_ASSET_MANIFEST.md`. Production was not touched.

## Match-3 balancing and device-preparation package — 18 July 2026

Implemented deterministic random-legal, greedy-score and objective-aware full-level play; aggregation/difficulty tools; baseline and tuned simulations; small recorded level tuning; development-only local feedback export; real-device checklist; performance scripts; and lazy-loaded Match-3/Game/Shop/Lucky Spin/Inventory/Marketplace/Reveal routes. No final art/audio, Reward Theatre, TCG, new levels or production deployment was added.

Local verification discovered 87 tests: 79 passed, 0 failed and 8 Preview-only skipped. The final focused Match-3/code-split set discovered 30: 29 passed with one Preview-only skip. Preview database verification passed 87/87 in 45.675 seconds. Main JS fell from 501.09 KB to 390.07 KB and no longer triggers Vite's 500 KB warning. Ten Preview moves averaged 707.4 ms, making latency perceptible; prediction remains deliberately postponed. Exact results are recorded in `MATCH3_BALANCING_REPORT.md`.

Final balancing Preview: `https://flip-ocz8184ts-chattocal.vercel.app`; page HTTP 200, unauthenticated Match-3 API HTTP 401. Production was not touched.

## Match-3 vertical slice completion — 18 July 2026

The primary Match-3 development slice is complete in Vercel Preview. Added a shared deterministic engine, 20 validated data levels, authoritative session/action/power-up/completion API, additive migration 009, main navigation entry, level map, briefing, game, pause/loss/win flows, Stars and safe advert-double handling. Memory/AI/Season/Gauntlet were retained.

Final results: local 75 tests / 67 pass / 0 fail / 8 Preview-only skip; Preview PostgreSQL 75/75 pass; 2,000 seeded board simulation with 0 initial matches and 0 dead starts; focused lint passed; local and Preview production-mode builds passed. Migration 009 applied at `2026-07-18T18:29:52.884Z` to `railway/public` Preview. Final ready URL: `https://flip-ky8oc33rz-chattocal.vercel.app`. Production was not touched. Full details and remaining risks are in `MATCH3_VERTICAL_SLICE_REPORT.md`.

> Subsequent currency authority: premium Coins are protected by migration 008's immutable HMAC chain; gameplay rewards use Stars at 10× the former Coin amounts. `FLIPOUT_DESIGN_DIRECTION.md` is authoritative for the approved policy.

> Final currency verification: migration 008 applied to Preview at `2026-07-18T17:52:39.594Z`; 56/56 Preview database tests passed, the administrative verifier found all 17 Preview chains valid, and cross-account provenance brought local coverage to 57 tests. Final code Preview: `https://flip-45w824r5q-chattocal.vercel.app`. Production was not touched.

Date: 18 July 2026. Environment: Vercel Preview only. Production was not targeted. Core matching, AI, Season, Gauntlet, decks and special-card rules were preserved.

## 1. Fully working systems

- Guest/platform account and account-owned purchase boundaries, including retry-safe purchase restoration.
- Append-only player value transactions with non-negative balances/inventory and duplicate transaction rejection.
- Daily-login server claim and daily wheel server roll. Free, advert and coin entitlements are independent; limits and timezone dates are database-authoritative. Existing weights remain `30/25/18/12/8/4/2/1`.
- Lockbox service: one standard box plus one standard key is consumed atomically; a versioned reward table is rolled server-side and an opening ID makes retries return the original result.
- Fixed-price marketplace service: eligible tradable inventory is escrowed; settlement is row-locked; seller receives 90%, fee is exactly 10%, buyer receives the item, and concurrent buyers cannot both win.
- Versioned cloud-save API with optimistic revision checking and stale-save rejection. Client keeps a per-account offline cache for non-economy progression/settings.
- Protected identity gate for marketplace and aggregate-only Preview analytics.

## 2. Partial systems

- Continuation and power-up services enforce server rules, ownership and one-use IDs, but `Game.jsx` does not yet create/update authoritative server matches or invoke them.
- Collection screen reads real inventory and transactions and groups cards, gold variants, decks, power-ups, boxes and keys. Existing local-only deck/gold flags have not been migrated into server inventory.
- Exchange screen lists and buys real listings; cancellation exists in the API but has no seller-management UI yet.
- Challenge, event-stage and annual-choice claim schemas/APIs exist. No approved live definitions/content are present, and trusted gameplay progress ingestion is not connected.
- Cloud save covers progression and settings. Economy balances/inventory remain separately server-authoritative by design; full mid-match state sync and save-migration version 2 are not implemented.
- Accessibility repairs from earlier work remain, and new screens use semantic headings, status/error regions and labelled controls. A complete device/contrast/modal/timer audit remains.

## 3. Blocked systems

- Rewarded adverts: provider abstraction exists but no provider/credentials are configured. Verification failure returns 503/403 and never grants value.
- Native Game Center: Swift bridge exists but requires macOS/Xcode, Apple capability setup and signed-device testing. Google Play Games requires its native SDK/plugin and credentials.
- Match, challenge and event reward authority: the repository has no trusted gameplay server. Accepting current client result events would permit forged rewards; none were added.
- Foil cards and sticker albums: no authoritative assets or metadata. No content was invented.
- Annual event stages/challenges: framework exists, but product definitions and canonical release content are required.

## 4. Exact files changed in this continuation

- Schema: `api/migrations/006_game_services.sql`.
- Backend: `api/_gameServices.js`, `_advertProvider.js`, `_operations.js`, `_foRewards.js`, `_foAdverts.js`, `_foActions.js`, `_foMarket.js`, `_foCloudSave.js`, `_foLiveOps.js`, `_foDevAnalytics.js`, and `api/fo-game.js`.
- Client: `src/utils/gameApi.js`, `src/utils/cloudSave.js`, `src/main.jsx`, `src/components/DailyBonus.jsx`, `src/screens/Home.jsx`, `LuckySpin.jsx`, `Inventory.jsx`, `Marketplace.jsx`, `Shop.jsx`, and `src/App.jsx`.
- Tests/config: `tests/game-services.test.js`, `tests/game-services-db.test.js`, `package.json`.
- Reports: this file, `FLIPOUT_CURRENT_STATE.md`, `FLIPOUT_OVERNIGHT_IMPLEMENTATION_REPORT.md`.

## 5. Database migrations

- `006_game_services.sql` committed at `2026-07-18T15:23:25.062Z` to PostgreSQL database `railway`, schema `public`, through the Vercel Preview environment.
- Adds `fo_reward_claims`, `fo_player_streaks`, `fo_challenge_definitions`, `fo_challenge_progress`, `fo_lockbox_openings`, `fo_rate_limits`; adds marketplace expiry/cancellation timestamps.
- Additive and transaction-wrapped by the migration runner. Repeat deployment reported migrations 001–006 already applied.

## 6. APIs added

- `/api/fo-game?service=rewards`: state, daily login and daily wheel.
- `service=adverts`: provider-verified advert receipts; currently safely unavailable.
- `service=actions`: continuation, power-up consumption and lockbox opening.
- `service=market`: browse/list/buy/cancel, protected accounts only.
- `service=cloud`: versioned read/write with stale revision rejection.
- `service=live-ops`: challenge reads/claims and annual choice claim.
- `service=analytics`: aggregate-only and Preview-only.

These share one function because Vercel Hobby permits 12 serverless functions. No paid upgrade was used.

## 7. Screens completed

- Lucky Spin now displays the server-selected result. Free and coin spins call the server; advert spins cannot fake completion. Unsupported legacy bonus spins are clearly disabled.
- Daily bonus is granted by the authenticated server claim and mirrored locally only for compatibility display.
- My Collection shows authoritative inventory and transaction history with loading, empty and error states; standard lockbox opening is connected.
- Exchange browses and purchases live listings and creates one-item duplicate listings; protected-identity errors are explained.

## 8. Tests and exact results

- Local: 44 tests discovered; 39 passed, 0 failed, 5 Preview-only skipped; 249.8779 ms.
- Preview PostgreSQL: 44 passed, 0 failed, 0 skipped; 19.405 seconds.
- Coverage includes duplicate grants/claims, wheel limits/boundaries, advert failure, continuation decisions, coin deductions, power-up validation, lockbox retry, escrow, exact fee, concurrent buyers, annual cutoff, streak reset, stale saves, identity switching, replay/tampering and rate-limit foundations.
- Deterministic simulations: 100,000 wheel rolls and 100,000 lockbox rolls. Lockbox results: 69,915 coin rewards, 25,047 Freeze, 5,038 Tiebreaker, consistent with 70/25/5.

## 9. Build and lint results

- Focused source/API/test lint: passed with no findings.
- Local build: passed, 118 modules; 484.02 KB JS / 147.42 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.35 seconds.
- Preview build: passed, 118 modules; 486.51 KB JS / 148.13 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.75 seconds.
- Smoke test: Preview page HTTP 200; unauthenticated game API HTTP 401.
- Final client-only Preview build after removing offline promo grants: passed in 1.64 seconds at `https://flip-qfgmlmwcd-chattocal.vercel.app`. One intervening full database run hit a transient Railway `ECONNRESET`; the earlier complete 44/44 Preview run remains the database result of record.
- Existing unrelated legacy component lint debt remains and was not broadly rewritten.

## 10. External credentials or native work still required

- Rewarded-ad provider SDK, signing/verifier credentials and sandbox callbacks.
- Apple Game Center entitlement/App Store Connect configuration, macOS/Xcode build and signed-device test.
- Google Play Games native SDK/plugin and Play Console credentials.
- Stripe sandbox manual checkout/restore exercise.

## 11. Security risks remaining

- Current match results and challenge progress originate in client gameplay; valuable match/event rewards must remain disabled until a trusted event path exists.
- Rate limits are database counters, not an edge/WAF substitute; retention cleanup is required.
- Marketplace needs moderation, price-policy review, expiry jobs and operational support before production.
- Offline promo grants have been removed. Some gameplay reward/local-value paths still predate the server boundary and require the authoritative match-session package.
- Cloud save does not encrypt arbitrary state client-side; only allowlisted non-sensitive fields are accepted.

## 12. Manual testing checklist

1. Exercise guest daily login, free spin and coin spin across a real local-midnight boundary.
2. Confirm advert buttons show unavailable and grant nothing.
3. Seed Preview inventory; open a box, reload and retry the same opening ID.
4. Use two protected Preview accounts to list/buy/cancel and inspect balances, inventory and fee.
5. Switch between guest and platform identities and verify separate collection/cloud caches.
6. Test My Collection and Exchange on small phones, tablets, portrait/landscape, keyboard and screen reader.
7. Run real Game Center and Stripe sandbox checks when credentials/devices are available.

## 13. Production-readiness checklist

1. Do not promote this Preview build yet.
2. Build trusted match lifecycle/result ingestion before enabling match/challenge/event rewards.
3. Select and integrate a verified advert provider.
4. Finish continuation/power-up wiring and automated Game state tests.
5. Approve challenge/annual-event definitions and missing catalogue release metadata.
6. Finish marketplace cancellation/expiry UI, moderation, policy and load testing.
7. Remove remaining offline/local grants of value and production debug paths.
8. Complete native, accessibility, payment sandbox and security reviews.
9. Clone/backup the intended production database, rerun migration precheck and obtain separate production approval.

## 14. Single best next action

The authoritative match-session API now exists and is Preview-verified. The next automatic package is exact rule parity: extract the existing `useGame.js` reducer into a shared deterministic module covering all 14 special cards, stopwatch, crown scoring, frozen/stunned/shield state, Joker and AI transitions. Only after parity tests pass should `Game.jsx` use server sessions and move match rewards off the legacy local path.

## 15. Authoritative match-session addendum

- Migration `007_authoritative_matches.sql` applied at `2026-07-18T15:41:11.782Z` in Preview only.
- New backend files: `api/_matchRules.js`, `_matchSessions.js`, `_foMatches.js`; dispatcher/client API updated.
- New tests: `tests/match-rules.test.js`, `tests/match-sessions-db.test.js`.
- Preview result: **48 passed, 0 failed, 0 skipped**, including replay/tamper/account-isolation and concurrent-completion verification.
- Preview deployment: `https://flip-ms2y25ven-chattocal.vercel.app`.
- Backend regular-match sessions are working. Live UI integration remains blocked on exact special-card reducer parity; this is a correctness/security boundary, not an external-service blocker.
## Match-3 gameplay completion addendum — 19 July 2026

Match-3's shared rules and board presentation have completed the requested modern-mechanics pass: full shape/special creation, seven special pairings, recursive chain reactions, cascade multipliers, event-rich server state, bounded move timing and motion-aware visual/haptic feedback. No economy value or level definition changed. Focused tests passed 39/39; the full local suite passed 95 Node tests plus 19 UI tests with only 8 expected Preview-database skips. A 20,000-board seeded sweep found no starting matches or dead starts. Full details: `MATCH3_GAMEPLAY_COMPLETION_REPORT.md`.

Gameplay commit `5a22617` is Ready in Vercel Preview as `dpl_L161cZ7Cqze89qSuKWj9dhkbJmwZ`. The permanent development URL returned HTTP 200, matched the generated deployment and reported `1.2.0-match3-gameplay`. No migration or production change occurred.

## UI consolidation addendum — 19 July 2026

The UI consolidation package replaced every reachable legacy/prototype route shell with the approved Concept 4D design language and removed the Season map completely. Shared safe-area, typography, panel, control, dialog and navigation contracts now cover the application while preserving game mechanics and economy balance. Local verification passed 100 Node tests and 25 UI tests with no failures; eight database tests skipped without local Preview credentials. Build passed and focused lint has zero errors. See `FLIPOUT_UI_CONSOLIDATION_REPORT.md` for the audited route matrix and exact remaining risks.

## Collection 2.0 addendum — 19 July 2026

Collection now provides the production album/set/card experience over the real 653-card catalogue and seven Gold Collector variants. Search, filters, missing/owned states, favourites, recent acquisitions, statistics and milestone progress are implemented without changing ownership or economy rules. Foils and milestone reward claims remain deliberately unavailable until authoritative definitions exist. See `FLIPOUT_COLLECTION_2_REPORT.md`.
## Duplicate Card Recycler addendum — 19 July 2026

The Collection duplicate-value floor is now implemented. Authenticated guest or protected accounts can recycle complete common-card batches without risking their final copy. Inventory deductions, transaction history, guaranteed Stars and the Recycler receipt are one PostgreSQL transaction; transaction IDs and input fingerprints protect retries, concurrency and account isolation.

Migration `010_duplicate_card_recycler.sql` is applied and verified in Preview only. Migration 011 reduces the provisional common recipe to exactly 1 Star per five-card batch. Focused Preview verification passed 10/10, focused Collection UI tests passed 6/6, focused lint passed and the Vite production build passed (139 modules). The first full Preview run passed 115/116; the sole failure was the pre-existing Vercel packaging omission of a gitignored Android native file, not a Recycler failure. Final balance-correction deployment: `https://flip-r2k6hd99c-chattocal.vercel.app` (`dpl_DNHovuYCSAC6VwmAXro8xr9rsPGS`). Full details: `FLIPOUT_RECYCLER_REPORT.md`.

## One-time nickname onboarding — 19 July 2026

First-time players now choose a case-preserving display nickname before Home; the permanent UUID `player_id`, not the display name, remains the identity for every future social, trade and moderation feature. The new nullable, non-unique `display_name` field is claimed once through the authenticated server boundary. It is never overwritten, while an interrupted retry with the same name is safe. Migration 012 committed to Preview Railway at `2026-07-19T14:54:07.959Z`; the Preview run passed 7/7 server/database tests and 9/9 focused UI tests, and its 142-module production build passed. The permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200 and served bundle `index-BzRAlMbJ.js`, which contains the nickname onboarding/API code. No authentication, economy or production system changed.

## One-time avatar onboarding â€” 19 July 2026

The nickname flow now continues to a required avatar choice before Home. Existing portrait artwork is registered once in `src/data/avatarCatalog.js`; profiles persist only an opaque `selected_avatar_id`, while UUID `player_id` remains the identity. The server permits starter IDs, blocks locked/unknown IDs, never overwrites a selected avatar and treats a same-ID retry safely. The Home header displays the selected asset. Migration 013 committed to Preview Railway at `2026-07-19T15:06:07.320Z`; Preview verification passed 11/11 server/database tests and 19/19 focused UI tests, focused lint passed and the 145-module production build passed. Ready Preview: `https://flip-9ul60548p-chattocal.vercel.app` (`dpl_78BWjkMnTLa5ptny8a3KjHfqbk5E`). One initial run hit a transient Railway connection termination after migration; the immediate serialised rerun passed cleanly. No authentication, economy or production system changed.

## Match-3 input and T-Rex token correction — 19 July 2026

The blocked-board defect was a stale presentation lock: the previous move’s presentation survived level transitions, and restart created a truthy presentation even when its duration was zero. Start/restart/next/map/quit now clear that state, and the board locks only while active API work, a pause/blocking dialog, a non-active game state or a positive-duration resolution is present.

The T-Rex crop remains `mastersOfTheLostWorld:1`, with focal point `(0.56, 0.26)` and zoom `4.2`. The regenerated token keeps the eye, brow, open mouth and teeth legible at gameplay sizes. Actual-size review and pairwise quality checks passed; closest 32px pair `leaf / drop` measured `0.1856` against the `0.16` minimum.

Verification passed: 32/32 focused Node engine/token tests, 8/8 focused Match-3 UI/token tests, focused lint and the 145-module production build. Preview `https://flip-6gkw201j4-chattocal.vercel.app` (`dpl_2iLM8jScemputLVFeE6zkwRs2bhj`) reached Ready. Production was not touched.

## Match-3 gameplay animation correction — 19 July 2026

Animation is now a deterministic view of the authoritative response. The board presents invalid swaps returning, token fall/refill and cascade sequencing, shuffle motion, special creation highlights, match clearing, combo banners, score pops, particles and special blast effects. A guarded in-flight move ref prevents duplicate submissions; visibility changes clear stale presentation, and reduced motion shortens timings without removing semantic feedback.

The prior level-start defect remains fixed: stale presentation state was the lock cause. T-Rex remains sourced from `mastersOfTheLostWorld:1` at focal `(0.56, 0.26)`, zoom `4.2`. Verification passed: 37/37 Node tests, 8/8 UI/token tests, focused lint and the 145-module production build. Preview `https://flip-azm52xj8g-chattocal.vercel.app` (`dpl_922goAdpMUfRjaCig1WEL81n9gtc`) reached Ready; production was not touched.

## Booster Store and special-art package — 19 July 2026

The supplied booster comparison image is bundled as an optimised WebP and shown on Shop. Both product panels are labelled exactly 500 Coins and five cards, but purchasing is disabled pending a server-authoritative booster receipt boundary and approved foil probabilities. Store navigation is global and Shop scroll padding respects safe areas. No production deployment was performed.

Store information polish is complete: “How Booster Packs Work” and “Collecting Every Card Has Its Rewards” sections are responsive, readable, accessible and dark-theme compatible. Purchase controls remain safely disabled until the backend is approved.

## Real-device gameplay repair revision — 19 July 2026

The prior animation pass was not accepted as visually proven. This revision makes swap motion explicit from opposite-cell offsets, adds pointer capture and drag handling, and adds diagnostics for phase, lock reason, duration and reduced motion. Preview `https://flip-4lw572b7k-chattocal.vercel.app` (`dpl_3tH1ZE26TtJ7ugCUA4pbQ1F5dy7H`) is Ready. Automated verification passed 37/37 Node tests, 8/8 UI/token tests and the 145-module build. Manual iPhone Safari, desktop visual observation and browser coordinate/trace tests remain unverified here; no completion claim is made until those checks pass.

## Deployed visible-drag verification — 19 July 2026

The previous revision did not contain a visual pointer-move render path. The actual defect was confirmed in source and the deployed bundle: pointer-down/up coordinates could submit a swipe, but no pointer-move state ever changed the visible tile. The idle animation also owned the tile transform. The corrected board now uses pointer capture plus React drag state, disables the idle transform while held, translates the source token with the pointer, moves the neighbour aside, commits a full two-cell exchange on release and returns invalid drags.

The new deployed-browser verifier records real bounding boxes before, during and after a held input, asserts pointer capture/threshold/transform diagnostics, checks that active dragging does not change page scroll, delays only the move request long enough to observe the committed exchange, and then waits for the authoritative result. Preview Edge passed with a 32.125 px half-drag and +63.865/−63.865 px release exchange; the board settled to 17 moves. A 390×844 Chromium touch-input pass also passed with a 22.488 px held movement, +44.785/−44.785 px release exchange and no scrolling. Physical iPhone Safari still requires a human device observation and is not claimed by emulation.

Focused tests passed 3/3; cloud verification passed 37/37 Node and 9/9 UI/token tests; focused lint and production build passed. Final dev-branch Preview: `https://flip-lyw0sei3q-chattocal.vercel.app`, deployment `dpl_4XS8iNjXw9yAvjG4ters36txHMmJ`. The permanent development URL returned 200 and served byte-identical HTML with the same `assets/index-CgoQHe9q.js` entry. Browser artifacts: `artifacts/match3-drag-preview/`. Production was not touched.

## Audio, navigation and avatar catalogue polish â€” 19 July 2026

This Preview-only pass leaves game economy and collection ownership unchanged. Test setup now forcibly suppresses music and SFX, cleans up created media, then restores the prior test audio state. Runtime UI/SFX APIs honour the same test-only guard, and the deployed Match-3 verifier uses it before it performs mouse and touch input.

Bottom navigation is permanently five columns wide with responsive labels/icons and safe-area padding, preventing the previous second-line wrap. The profile picker and onboarding picker now consume the exact same explicit 12-avatar registry under `public/images/avatars`; automatic discovery, promo entries, locked blanks and non-avatar UI graphics are excluded. Old Preview avatar IDs remain display-compatible through aliases while new server writes require curated IDs.

Two intentionally dormant contracts were added: starter collection policy (random Commons across all active themes, one random Foil Common, count not yet approved) and pack-opening presentation phases (enlarge/turn/tear/open/deal/fan/reveal). Neither grants cards, changes inventory, enables purchases or adds an animation.

Verification passed: **122 Node tests passed, 11 Preview-only database tests skipped; 47 UI tests passed; focused lint passed; production build passed with 146 modules.** The full `App.jsx` lint command still reports four pre-existing legacy state-in-effect errors outside this pass. Ready Preview: `https://flip-sgk5t9cs0-chattocal.vercel.app` (`dpl_4ZPfe5W6EbLsPNtbB9Mfw5W6Xe5C`). Permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200 and byte-identical HTML/ETag (`"1d0b0e5573ca0a445cb6cc2a06eb6032"), serving `assets/index-6JlVFdzD.js`. The deployed Match-3 verifier passed desktop and 390×844 touch drag, click/swap submission and authoritative resolution (18→17 moves) with no scroll. Physical iPhone Safari validation remains outstanding. Production was not touched.
## Booster pack opening animation — 19 July 2026

The approved 1024×571 transparent image strip was kept as the only art source. `scripts/slice-booster-animation.mjs` deterministically splits its actual 5×2 layout, preserves alpha, crops each frame to its visible content, centres it on a transparent 512×512 canvas and produces `booster_01.webp` to `booster_10.webp` plus an inspectable source-bounds manifest. The ten assets are 3.8–22.0 kB WebP files; no visual content was generated or replaced.

`BoosterPackOpening` is a reusable presentation component, not a purchase system. It preloads the reference frames, then uses composited GPU `translate3d`/rotation animations to carry the package through its physical opening stages. The cards do not rely on a copied strip pose: five cards procedurally separate, rotate, settle and bounce into their fan, then flip individually with `rotateY`; Reveal All queues unrevealed cards safely. Foil feedback is data-configurable (purple/gold smoke, sparkles, glow, bloom, haptic and sound hook), and an explicit interruption callback makes a future Gold Collector / collection-complete celebration pause safely after the last card.

A non-economic Preview button on Shop opens the animation with static sample cards. It is intentionally separate from disabled product purchase controls and cannot call a purchase, inventory or grant API. Automated coverage verifies source assets, required five-card input, timing/reduced-motion behaviour, individual reveal, queued Reveal All and interruption/resume. Results: **123 Node passed / 11 expected Preview-only skips; 50 UI passed; focused lint clean; production and Preview Vite builds passed with 149 modules.** Browser/device verification and final Preview deployment follow this report update; physical Android Chrome and iPhone Safari remain explicit manual acceptance checks. Production was not touched.

Preview deployment `dpl_7XrzvFkJsbmdg83KEVhAkTCTuEjF` is Ready at `https://flip-m65t6opwe-chattocal.vercel.app`. The permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200 with byte-identical HTML and the same `assets/index-DecrUWih.js`; the new first booster frame returned `200 image/webp` (22,026 bytes). The available browser pass reached Preview onboarding, but its existing avatar-save request did not complete, so Shop could not be entered for an end-to-end visual run. That is a separate verification block, not treated as a successful Android/iPhone acceptance. Physical Android Chrome and iPhone Safari remain manual checks. Production was not touched.

## Approved eleven-frame themed booster opening — 19 July 2026

The supplied master sheet replaced the previous booster source without generating, redrawing or modifying any art. `scripts/process-themed-booster-opening.mjs` uses strong alpha grouping for row detection and full alpha bounds for the final crops; it preserves Frame 10’s two separated components as one group. The source is `768×1376`, the layout is `3 / 3 / 3 / 2`, and the outputs are eleven centred `640×640` transparent WebPs at a shared register point `(320,320)`.

The opening component now uses the 11 approved key poses with physical CSS 3D movement rather than a slideshow: appear 180 ms, lift 220 ms, front/rear turning 220/220/160 ms, settle 150 ms, tear 180 ms, open 250 ms, uncover/exit 220/240/180/220 ms, then a 620 ms independent-card fan. The blue, red, green, purple and gold cards begin stacked, fan procedurally, and flip around the vertical axis on individual or queued Reveal All selection. Foil, haptic, sound and completion-interruption hooks remain optional and safe when disabled. A receipt ID can mark confirmed server content as reopenable; no client-side purchase, reward selection or inventory grant was introduced.

The Preview-only inspector at `?dev=booster-opening` was browser-checked on the deployed build: it displayed Frame 01 of 11 with the expected 640×640 canvas, `(320,320)` register point and exact crop metadata; HTTP checks returned 200 for the inspector, `frames.json` and Frame 10 (`image/webp`). Local verification: **124 Node passed / 11 expected Preview-only skips; 50 UI passed; focused lint passed; production and Preview builds passed (152 transformed modules).** The changed files are the deterministic processor, themed assets/manifest, flow/component/CSS, Preview-only review route and its tests. Full-App lint’s four legacy state-in-effect findings remain outside scope.

Preview deployment `dpl_6mi6fKuPFTg6EyTE9w32zWRGLJDZ` is Ready at `https://flip-modjhhhfr-chattocal.vercel.app`; permanent development URL `https://dev.flipout.gizmogames.uk` maps to it and returned HTTP 200 with entry `assets/index-ChIs5IAc.js`. Production was not touched. Human Android Chrome and iPhone Safari visual acceptance is still required.

## Theme Album ownership boundary - 20 July 2026

Milestone 1 of the Play / Collect / Trade / Achieve sprint is implemented locally. Official Theme Album sticking now has a server boundary: a player can spend one unbound Inventory card copy into an immutable Theme Album slot using the approved **Stick in Album** wording/action. The mutation is transactional, idempotent, account-isolated and irreversible. Duplicate transaction IDs return the prior receipt only when the input matches; conflicting reuse is rejected. A second attempt to fill the same Theme/card/variant slot is rejected.

The additive schema is `api/migrations/014_theme_albums.sql`. New code is `api/_themeAlbums.js`, plus `stick-in-album` routing in `api/_foActions.js`, player-state readback in `api/_playerState.js`, and Theme Album-aware collection read modelling in `src/ui/collectionData.js`. The app build marker is now `1.6.0-theme-albums`.

Collector achievement logic is present for Bronze, Silver and Gold and uses actual Theme card totals rather than equal-size assumptions. Only normal card sticking is enabled in this milestone. Foil slots and Silver/Gold completion remain blocked until Foil cards exist as authoritative inventory items; the service deliberately rejects fake Foil sticking from normal base cards.

Local verification passed: focused Theme Album/Collection Node tests **10 passed / 1 Preview DB skip**, focused Collection UI **8 passed**, full local suite **129 Node passed / 12 expected Preview-only skips** and **50 UI passed**, changed-file lint passed and production build passed with **152 transformed modules**.

Preview migration `014_theme_albums.sql` committed at `2026-07-20T00:07:32.319Z` against Railway Preview `railway/public` on `yamanote.proxy.rlwy.net`. The focused remote Preview verification build passed **11/11** Theme Album and Collection tests with no skips, including the database test for first stick, retry, cross-account transaction rejection, idempotency conflict and filled-slot rejection. Final Ready Preview: `https://flip-p36h9raqr-chattocal.vercel.app`, deployment `dpl_3M3Uzqbjwk89718krBfbAnwWYbWt`. The permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200, served `assets/index-CA3iEtWW.js`, and that bundle contains `1.6.0-theme-albums`.

The first all-tests remote migration deployment applied the migration but failed later on the existing Vercel packaging omission of `android/app/src/main/java/uk/gizmogames/flipout/MainActivity.java` in `tests/mobile-ux.test.js`. That failure is outside the Theme Album code path; the final focused remote verification passed. Production was not touched.

## Personal Album ownership boundary - 20 July 2026

Milestone 2 is implemented and Preview-verified. Players can now create organisational Personal Albums through a server boundary. Creation costs **500 Coins**, is paid via the existing Coin ledger, is limited to **10 albums** per account, and is protected by transaction IDs plus input fingerprints. Retrying the same create request returns the same album without charging again; reusing the transaction ID for a different name is rejected.

Personal Album names reuse the server-side suitability/profanity/reserved-name filter and allow simple names with spaces such as `Black Cats`. Card membership is a bookmark of an Inventory-owned card SKU: adding a card requires that it exists in Inventory, but does not decrement quantity, bind ownership, affect official Theme completion, change Recycler eligibility or move the card out of Inventory. Remove is idempotent.

New code is `api/_personalAlbums.js`, migration `api/migrations/015_personal_albums.sql`, action routing in `api/_foActions.js`, player-state readback in `api/_playerState.js`, shared name suitability validation in `api/_nickname.js`, and Personal Album-aware collection modelling in `src/ui/collectionData.js`. The app build marker is now `1.7.0-personal-albums`.

Local verification passed: focused Personal Album/Collection/Nickname Node tests **17 passed / 1 Preview DB skip**, full local suite **134 Node passed / 13 expected Preview-only skips** and **50 UI passed**, changed-file lint passed and production build passed with **152 transformed modules**. Preview migration `015_personal_albums.sql` committed at `2026-07-20T00:34:00.384Z` against Railway Preview. Focused remote verification passed **18/18** with no skips and built 152 modules. Final Ready Preview: `https://flip-e5h8vfaq9-chattocal.vercel.app`, deployment `dpl_6ccL6Ax8ruuTcQ4EsaygnxnKbyoy`; permanent development URL `https://dev.flipout.gizmogames.uk` returned HTTP 200 and served `assets/index-kPR7Ipt_.js` containing `1.7.0-personal-albums`. Production was not touched.

## Inventory capacity boundary - 20 July 2026

Milestone 3 is implemented and Preview-verified. Code commit `e9659ae` and report commit `496f301` were pushed to `dev`.

The implementation adds additive migration `016_inventory_capacity.sql`, per-player Inventory capacity settings, readback in player state, Collection model exposure and a shared card-grant guard inside `applyReward()`. Capacity defaults to 1,000 card/card-variant Inventory slots. Only Inventory copies count; Official Theme Album entries do not. Positive card grants are transaction-safe and serialised on the account row before Inventory is counted, so concurrent new-card grants cannot overfill an empty account.

Local verification passed: focused Inventory/Collection tests **10 passed / 2 expected Preview DB skips**, focused changed-file lint passed, full local suite **137 Node passed / 15 expected Preview-only skips** and **50 UI passed**, and production build passed with **152 transformed modules**.

Preview verification passed on focused deployment `dpl_25Up7bWqFHdTdKTwuihHWM991L52` at `https://flip-i960o2j5u-chattocal.vercel.app`. The build command applied migrations, committed `016_inventory_capacity.sql` to Railway Preview at `2026-07-20T01:31:19.497Z`, ran the focused Inventory/Collection database tests **12/12 passed / 0 skipped**, then built 152 modules. The migration output confirmed `fo_player_inventory_settings` and `fo_player_inventory_settings_pkey`.

Permanent development URL status: `https://dev.flipout.gizmogames.uk` returns HTTP 200 and serves the same ETag `"2e3dd0f773c9aa762d8f80c044472f14"` and `assets/index-Bpenq1xH.js` as the focused Preview URL; the bundle contains `1.8.0-inventory-capacity`. Production was not touched.

Deployment note: earlier focused deploy attempts got stuck in Vercel `QUEUED` state and were removed. A Git-triggered Preview build reached Ready before the final focused build, but it only ran the default app build and was superseded by the focused verification deployment above.
