# Flip-Out continuation report

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
