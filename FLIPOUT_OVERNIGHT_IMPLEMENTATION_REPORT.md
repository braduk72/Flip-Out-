# Flip-Out! progression/economy implementation report

> Post-implementation direction for Reward Theatre, Stars/Coins, seasonal returns, the Exchange, creator gifts and shop characters is recorded in `FLIPOUT_DESIGN_DIRECTION.md`. No part of that design update was implemented during this report.

> Later currency package: migration 008 adds the Preview-only HMAC-chained premium Coin ledger and converts earned reward tables to Stars. Exact verification is recorded at the end of this report.

Date: 18 July 2026. Environment: `dev` / Vercel Preview only. Production was not changed.

## 1. Executive summary

This pass established and deployed the secure database foundations for authenticated accounts, server-owned balances/inventory, idempotent transactions, daily actions, advert receipts, matches, lockboxes, marketplace escrow records, annual-event claims, cloud saves, and audit events. It also created a canonical collectible catalogue, preserved the existing wheel weights in a deterministic reward engine, removed the fake advert-success path, repaired `APP_VERSION`, and made cards keyboard-focusable with reduced-motion handling.

This is a foundation pass, not a claim that every requested product feature is complete. Authentication APIs and authoritative mutation/read APIs exist. Marketplace settlement, reward claims, lockbox opening, annual-event claims, challenges, and cloud sync currently have schemas and tested domain rules but still need complete authenticated endpoints and client screens before they are usable.

## 2. Work completed by stage

1. **Authenticated identity — foundation complete, client UI partial.** Added accounts, opaque hashed sessions, password hashing, registration/login, authenticated state access, retry-safe device linking, and cross-account rejection. Existing device registry remains untouched.
2. **Server-authoritative state — foundation complete.** Added balances, inventory, transaction ledger, atomic mutations, non-negative checks, idempotency, and client-grant rejection.
3. **Canonical items — foundation complete.** Generated stable deck/card/gold/power-up/lockbox/key IDs from existing content; added rarity, assets, release dates, tradability, availability, and annual eligibility validation. Foil schema is supported as a variant concept but no foil assets/content were invented.
4. **Rewards — foundation complete.** Preserved wheel weights exactly, added deterministic weighted selection, validation, seeded simulation, and 100,000-roll test. Claim endpoints/persistence integration remain partial.
5. **Continuation/adverts — partial.** Added tested continuation and daily-wheel rules; removed fake successful adverts. Real provider verification is blocked on provider choice/credentials.
6. **Power-ups — partial.** Added server-side consumption rules and inventory representation; existing gameplay buttons are not fully connected to authenticated APIs.
7. **Inventory/collection screens — not completed.** Server read model exists; no misleading new screen was shipped without account UX and endpoint integration.
8. **Lockboxes — partial.** Tables, catalogue entries, reward table, and open rules exist; no opening endpoint/screen or odds presentation yet.
9. **Exchange — partial.** Listing schema, price/tradability/self-sale rules, and exact 10% fee calculation exist. Atomic escrow settlement endpoints and client screens remain unimplemented.
10. **Annual event — partial.** Stage/choice tables and exact preceding-year 1 January–25 December eligibility exist. Event content and claim endpoints remain unimplemented.
11. **Daily/challenges/events — partial.** Daily uniqueness and streak rules exist; trusted gameplay progress ingestion and challenge definitions remain unimplemented.
12. **Cloud persistence — partial.** Versioned save schema and stale-local rollback rules exist; sync endpoint/client caching integration remain unimplemented.
13. **Anti-cheat — partial.** Database constraints, replay-resistant IDs, audit schema, and anomaly hooks exist. Rate limiting and trusted match attestation remain.
14. **Analytics/tools — partial.** Machine-readable deterministic economy simulation exists. Production dashboards/event export do not.
15. **Accessibility — targeted repairs complete.** Cards support keyboard activation/focus, better labels, frozen/disabled semantics, and reduced motion. Full contrast/modal/text-scale audit remains.
16. **Build/tests/docs — completed for changed scope.** Automated tests, focused lint, build, migrations, simulation, and both reports are present.

## 3. Work not completed and exact reason

- Real advert verification: no advert provider or credentials are configured; successful completion is never faked.
- Full account screens and password-recovery/email verification: product/identity-provider decisions are required before exposing accounts publicly.
- Complete marketplace, lockbox, event, challenge, and cloud-save APIs/screens: the secure schema/rules are present, but implementing and manually validating every product workflow was not achievable without overstating untested interfaces.
- Foil art/items and sticker album content: no authoritative assets or design metadata exist; none were invented.
- Production deployment: expressly prohibited.

## 4. Database changes

- `001_fo_economy_transactions.sql` retained and migration-tracked.
- `002_player_progression_foundation.sql`: `fo_accounts`, sessions, device links, balances, inventory, player ledger, claims, and player link on historic economy transactions.
- `003_live_economy_systems.sql`: matches, daily actions, advert completions, market listings, event progress, annual choice claims, cloud saves, and audit log.
- Preview migration initially discovered a legacy `fo_players(device_uuid)` table. Migration 002 rolled back safely, was changed to additive `fo_accounts`, then committed. No legacy table was altered or deleted.

## 5. API changes

- Added `_db.js`, `_auth.js`, `_playerState.js`, `_rewards.js`, `_progressionRules.js`.
- Added `fo-register.js`, `fo-login.js`, and authenticated `fo-player-state.js`.
- Client calls cannot mint positive value through the generic mutation endpoint.

## 6. Client changes

- Fake advert close no longer grants a wheel spin.
- Cards now support Enter/Space, visible focus, clearer accessible state, and reduced motion.
- Bug reporting imports the defined application version.
- Core matching, AI, Season, Gauntlet, decks, and special-card behaviour were not redesigned.

## 7. Tests and exact results

Preview database run: **25 passed, 0 failed, 0 skipped**, 9.925 seconds. Coverage includes original economy restoration/concurrency, authentication helpers, account/device isolation, catalogue validation, annual cutoff, deterministic rewards, 100,000 rolls, real PostgreSQL duplicate grants, ten concurrent deductions, negative-balance rejection, cross-account transaction rejection, continuation, wheel limits/timezones, power-ups, lockboxes, fees, streaks, cloud conflict rules, and anomaly hooks.

## 8. Build and lint results

- Preview Vite build: **passed**, 111 modules, 467.62 KB JS / 141.75 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.61 seconds.
- Focused lint for new/changed foundation files: **passed with no findings**.
- Global legacy lint debt remains and was not broadly rewritten.

## 9. Security review

Strengths: server session hashes, account-scoped reads, unique transaction/claim keys, database non-negative constraints, row-locked atomic mutation pattern, advert receipt uniqueness, audit schema, and no fake advert success.

Remaining risks: registration lacks email verification/rate limiting; sessions need logout/revocation UI; purchase APIs still originate in the legacy device flow; generic spends need per-action allowlists; gameplay reward attestation is not server authoritative; marketplace settlement is not implemented; localStorage remains a compatibility cache.

## 10. Manual checks still required

- Register/login/link two test accounts in Preview and verify account switching.
- Exercise expired/revoked sessions and password recovery once specified.
- Verify native mobile keyboard/focus, text scaling, small screens, and reduced motion.
- Select an advert provider and test signed callback failures before enabling rewarded actions.
- Validate catalogue asset URLs in the deployed client.

## 11. Production deployment checklist

1. Brad approves account UX/provider and recovery policy.
2. Add rate limiting, email verification, logout/revocation, CSRF/origin policy, and security headers.
3. Complete action-specific reward/spend endpoints; remove remaining valuable local mutations.
4. Complete marketplace escrow integration and race tests.
5. Complete cloud-sync integration and rollback tests.
6. Run migrations on a production clone/backup, then a read-only schema diff.
7. Run full test/build/lint/native-device matrix.
8. Review legal/platform requirements for adverts and loot odds.
9. Only then schedule a separately approved production migration/deployment.

## 12. Decisions requiring Brad’s approval

- Account experience: first-party email/password versus managed identity provider.
- Email verification, password recovery, display names, age requirements, and account deletion policy.
- Advert provider and permitted placements.
- Exact coin continuation cost and coin-funded wheel cost.
- Foil/sticker content, release dates, rarity, pity rules, and lockbox odds.
- Marketplace minimum/maximum prices, expiry, self-purchase policy, and whether fees round down as implemented.
- Annual event content/stages and which item types are choice-box eligible.

## 13. Platform-native and guest identity package

The planned mandatory email/password experience has been superseded. `fo-register` and `fo-login` now return HTTP 410; no password UX was built. The app automatically creates or resumes a device-linked guest, then attempts `GKLocalPlayer` authentication on iOS. Declining Game Center leaves the guest playable.

The new backend verifier validates `static.gc.apple.com`, the Flip-Out bundle ID, timestamp freshness and Apple's SHA-256 identity signature before mapping `gamePlayerID`. Provider identities map to `fo_accounts` through `fo_account_identities`. A guest upgrade keeps the same account row and therefore preserves its progression. An identity already mapped elsewhere causes a clean switch or an explicit 409 upgrade conflict, never an automatic merge.

Google Play Games, Sign in with Apple, Google and email-link recovery share the provider abstraction/schema. Only Game Center verification is implemented in this package; the Android adapter intentionally reports unconfigured until its native SDK is added.

Files added/changed: `api/_platformIdentity.js`, `api/fo-identity.js`, `api/_auth.js`, disabled password endpoints, `api/migrations/004_platform_guest_identity.sql`, `src/utils/platformIdentity.js`, `src/main.jsx`, `ios/App/App/GameCenterIdentityPlugin.swift`, the Xcode project source list, and platform identity unit/integration tests.

Local result before deployment: **33 tests total; 30 passed, 0 failed, 3 Preview database tests skipped** in 233.3566 ms. Focused lint passed. Vite build passed with 113 modules in 2.38 seconds. Migration 004 subsequently committed to the Vercel Preview database at `2026-07-18T14:57:34.329Z`; its schema and live identity test passed as part of the final 40-test Preview run. No production deployment target was used.

Native checks still required: enable Game Center entitlement/capability, configure App Store Connect, compile with Xcode on macOS, test on a signed device/sandbox Game Center account, validate real Apple certificates, add the Google Play Games native implementation, and verify account switching/recovery on two physical devices.

## 14. Account-owned purchases

New purchases now require an authenticated Flip-Out account session, with guest accounts explicitly supported. Checkout records `player_id` in Stripe metadata and `fo_purchases`; verify and webhook processing carry the same owner into `fo_economy_transactions`. The stable transaction ID remains `purchase:<stripe_session_id>`. A duplicate callback for the same account is a no-op, while reuse by another account is rejected.

Guest-to-platform upgrades preserve purchases naturally because platform identity attaches to the same account row. Restoration is scoped to the authenticated account and its linked legacy devices, uses stable transaction IDs, and no longer treats Stripe email as ownership. The Shop restore UI therefore no longer asks for an email.

Migration `005_account_purchase_ownership.sql` adds nullable account ownership and two indexes without rewriting legacy rows. A small `linkLegacyTest` action is restricted to Vercel Preview, requires the device to belong to the current account, is retry-safe and refuses conflicting ownership. No broad production backfill was created.

Files changed: `api/_economy.js`, `fo-checkout.js`, `fo-verify.js`, `fo-webhook.js`, `fo-restore.js`, migration 005, `src/utils/foShop.js`, the Shop restore controls, existing economy tests, and new purchase identity unit/database tests.

Final local result: **40 tests; 36 passed, 0 failed, 4 Preview-only skipped** in 216.3105 ms. Focused package lint passed. Vite build passed with 113 modules in 1.35 seconds (474.12 KB JS / 144.31 KB gzip; 155.77 KB CSS / 30.17 KB gzip). Full-file Shop lint still reports five pre-existing unused legacy variables not changed by this package.

Preview deployment succeeded at `https://flip-q0wxad5d9-chattocal.vercel.app`. Migration 005 committed at `2026-07-18T14:57:34.653Z`; the `fo_purchases.player_id` foreign key and `fo_purchases_player_idx` / `fo_purchases_legacy_device_idx` were verified, and the final run reported migrations 001-005 already applied. Preview tests: **40 passed, 0 failed, 0 skipped** in 13.755 seconds, including duplicate restoration and the full account-purchase/legacy-link lifecycle. Preview build passed in 933 ms with 113 modules (476.57 KB JS / 145.01 KB gzip; 155.77 KB CSS / 30.17 KB gzip).

The first post-migration run found an integration-test cleanup-order bug, not an application defect: foreign-key child rows were not removed before test accounts, leaving connections open. Cleanup was corrected in `tests/economy-db.test.js` and `tests/purchase-identity-db.test.js`; the replacement Preview deployment passed. No production deployment target was used. Stripe sandbox end-to-end checkout remains a manual Preview check.

Exact final verification commands:

```text
npm.cmd test
npx.cmd eslint api/_economy.js api/fo-checkout.js api/fo-verify.js api/fo-webhook.js api/fo-restore.js src/utils/foShop.js tests/economy.test.js tests/economy-db.test.js tests/purchase-identity.test.js tests/purchase-identity-db.test.js
npm.cmd run build
npx.cmd --yes vercel@latest deploy --yes --logs --scope chattocal --target preview --local-config vercel.migration-apply.json
```

## 15. Server game-services continuation

Migration `006_game_services.sql` was committed to the Preview database at `2026-07-18T15:23:25.062Z`. It adds idempotent reward claims, daily streak state, data-driven challenge definitions/progress, lockbox opening receipts, request-rate windows, and marketplace expiry/cancellation fields. All changes are additive.

Daily login and daily wheel now execute on the server. Wheel weights remain exactly `30/25/18/12/8/4/2/1`; free, verified-advert and coin spins each have an independent daily database key. Advert success is impossible without a registered verifier. Lockboxes consume box/key and grant the versioned server roll in one transaction. Fixed-price exchange uses escrow, row locks and atomic buyer/seller/item settlement with an exact 10% fee.

My Collection and Exchange screens were added, cloud save now has revision/version conflict protection and a per-account offline cache, and a Preview-only aggregate analytics endpoint reports sources/sinks, wheel/lockbox outcomes, market fees, challenges and continuation usage without player-level tracking.

Vercel initially rejected the output because the Hobby plan permits 12 serverless functions. No upgrade was purchased: the new handlers were consolidated behind `fo-game.js`, leaving exactly 12 public functions. Final Preview deployment: `https://flip-qfgmlmwcd-chattocal.vercel.app`.

Exact final results: **44 Preview tests passed, 0 failed, 0 skipped** in 19.405 seconds; local run **39 passed, 0 failed, 5 database-only skipped** in 249.8779 ms. Focused source lint passed. The deterministic simulation completed 100,000 wheel and 100,000 lockbox rolls. Preview Vite build passed with 118 modules in 1.75 seconds. HTTP smoke test returned 200 for the app and 401 for an unauthenticated game API call.

The remaining work is not concealed: current local gameplay is not a trusted match-event source, so match/challenge/event reward issuance is not connected; continuation and purchased power-up endpoints are not wired into `Game.jsx`; advert/native credentials are absent; live challenge/annual content is absent; and the new screens still need physical-device accessibility/UX validation. See `FLIPOUT_COMPLETION_REPORT.md`.

The insecure offline promo fallback was removed. A later full build attempt hit one transient Railway `ECONNRESET` after the complete 44/44 database run had already passed. The final change was client-only, so it was deployed using `vercel.preview-code.json` without touching the database; that Preview build passed in 1.64 seconds.

## 16. Authoritative match-session foundation

Migration `007_authoritative_matches.sql` committed to Preview at `2026-07-18T15:41:11.782Z`. It additively versions and timestamps match rows and adds ordered match-event and trusted-progress-event tables. No production target was used.

`memory-v1` creates unguessable authenticated sessions, enforces account isolation, monotonic sequences and unique event IDs, validates regular flips/resolution/scores/moves/timers, preserves resumable state, records state hashes/audit events, rate-limits calls and grants one fixed 10-coin reward after validated completion. Concurrent completion callbacks are row-locked and idempotent.

Files: `api/migrations/007_authoritative_matches.sql`, `api/_matchRules.js`, `api/_matchSessions.js`, `api/_foMatches.js`, the `fo-game.js` dispatcher, `src/utils/gameApi.js`, `tests/match-rules.test.js`, and `tests/match-sessions-db.test.js`.

Exact results: local **42 passed, 0 failed, 6 database-only skipped** out of 48 in 237.8106 ms. Preview **48 passed, 0 failed, 0 skipped** in 27.048 seconds. Focused lint passed. Preview build: 117 modules, 925 ms, 486.41 KB JS / 148.10 KB gzip. Deployment: `https://flip-ms2y25ven-chattocal.vercel.app`.

The live game was not connected prematurely. Its reducer includes 14 special cards and several timing/score transitions not yet represented in `memory-v1`. Until those rules are extracted into a shared deterministic reducer, attaching this service would either redesign the game or falsely claim authoritative validation.

## 17. Post-package cleanup and verification

Only directly related, behavior-neutral cleanup was performed after the authoritative-match package: unused Shop/wheel/game helpers were removed, optional audio catches were made explicit, the local Joker action alias was clarified, and the AI move callback now declares its difficulty dependencies. No mechanics, rewards, schema or production resources were changed.

Exact local results: `npm.cmd test` reported **48 total, 42 passed, 0 failed, 6 Preview-only skipped** in 202.6737 ms. The focused match/economy/game lint command completed with zero warnings. `npm.cmd run build` passed with 117 modules in 1.43 seconds (483.61 KB JS / 147.30 KB gzip; 155.77 KB CSS / 30.17 KB gzip).

Full-project lint is not clean and is not represented as clean. Remaining failures are predominantly the React 19 `set-state-in-effect` rule applied to the pre-existing timer/animation orchestration plus unused legacy screen props. With that incompatible rule excluded, `Game.jsx` retains six hook-dependency warnings. Resolving those properly belongs with the shared reducer extraction, where behavior can be protected by parity tests rather than changed as incidental lint work.

Final Preview verification deployment: `https://flip-ba3jkkws1-chattocal.vercel.app` (deployment `dpl_HjVewn2bz1Qa2TMpobbaMk7aSYYp`). It targeted only Vercel Preview and the Railway development database `railway` / `public` at `yamanote.proxy.rlwy.net`; the migration runner refused non-Preview environments. Migrations 001-007 were reported already applied. All **48 database and unit tests passed, 0 failed, 0 skipped** in 31.075 seconds, including repeated purchase restoration and duplicate callback/concurrency cases. Preview build passed in 912 ms. Smoke checks returned app HTTP 200 and unauthenticated match API HTTP 401. Production was not touched.

## 18. Premium Coin ledger and Stars conversion

Migration `008_tamper_evident_coin_ledger.sql` committed to Railway Preview at `2026-07-18T17:52:39.594Z`. It adds `fo_coin_ledger`, per-account sequence/hash uniqueness, a unique purchase-reference index, source/account indexes and a trigger rejecting updates/deletes. Existing development Coin balances were reset to zero; there are no real users. A sensitive `COIN_LEDGER_HMAC_SECRET` was generated directly in Vercel Preview and never written to source or exposed to the client.

`api/_coinLedger.js` provides canonical HMAC-SHA256 chaining, full-chain verification, transaction-safe append, creation allowlists, purchase replay rejection, atomic 1:10 Coin-to-Star conversion, purpose-specific creator gifts, authorised grants/refunds and FIFO creation-source tracing. Purchase grant, Coin spends and Exchange settlement now use it. Exchange settlement records buyer gross spend, seller gross receipt and the exact 10% fee as distinct entries under one reference. Gameplay sources were converted to Stars.

Local verification after full cross-account provenance coverage: **57 total, 50 passed, 0 failed, 7 Preview-only skipped** in 286.839 ms; focused lint zero warnings; production build 117 modules in 1.50 seconds (483.64 KB JS / 147.35 KB gzip). Preview database verification: **56 passed, 0 failed, 0 skipped** in 38.479 seconds; build 117 modules in 1.29 seconds (486.14 KB JS / 148.06 KB gzip). Railway produced intermittent connection terminations on other repeat runs; these are recorded rather than concealed. The final tracing-only change was deployed code-only after its local test passed.

The Preview-only administrative verifier checked all 17 ledger accounts: every chain was valid and balances recalculated successfully. Final code deployment `https://flip-45w824r5q-chattocal.vercel.app`; verifier deployment `https://flip-4tl7z3wpi-chattocal.vercel.app` returned app HTTP 200 and unauthenticated action API 401. Production was not touched.

Remaining risks: O(n) full-chain verification needs signed checkpoints before high volume; HMAC rotation/disaster recovery is not yet specified; payment-provider refund wiring and creator-gift UI/policy remain absent; old wheel/daily Coin-number artwork needs new Star assets; localStorage remains only a compatibility/display cache and must not be used for valuable decisions.
