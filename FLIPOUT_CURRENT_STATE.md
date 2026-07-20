# Flip-Out! current-state audit

## Season Journey architecture - 20 July 2026

- **Status: Implemented as a backend foundation and verified on development Preview.** The new Season Journey boundary separates earned **Season Score** from spendable **Season Tickets**. Match-3 completion now grants idempotent server-owned Season Score while leaving Coins, Reward Theatre cadence, revives and level balance unchanged.
- What changed: added data-driven season definitions, gameplay-only daily/weekly mission definitions, choice reward pages, post-100 supply definitions, two free rerolls/day policy, Mission Reroll Token catalogue item and Preview Season Collector Card catalogue item. Added `/api/fo-game?service=seasons` for authenticated season state, ticket choice claims and reroll receipts.
- Economy/progression boundary: Season Score is earned from gameplay events; Season Tickets are created only from journey level-ups; reward choices spend Tickets transaction-safely; the level-100 Collector Card is awarded once into a separate Season Archive and Inventory; mission rerolls are receipt-backed and can later fall back to tokens or Coin costs without direct player-to-player transfer.
- Schema: additive migration `020_season_journey.sql` adds `fo_seasons`, `fo_season_progress`, `fo_season_score_events`, `fo_season_ticket_transactions`, `fo_season_reward_claims`, `fo_season_missions`, `fo_mission_reroll_usage`, `fo_mission_reroll_transactions` and `fo_season_archive`, plus indexes/constraints. It seeds active Preview Season metadata only.
- Files changed: `src/data/seasonJourney.js`, `api/_seasonJourney.js`, `api/_foSeasons.js`, `api/_match3Sessions.js`, `api/fo-game.js`, `src/utils/gameApi.js`, `src/ui/homeData.js`, `src/data/itemCatalog.js`, `api/migrations/020_season_journey.sql`, `public/ui/icons/mission-reroll-token.svg`, `public/ui/icons/season-collector-card.svg`, `src/version.js`, Season tests and `vercel.season-journey-verify.json`.
- Verification: focused Season Node **7/7** passed; focused DB tests locally skipped without `DATABASE_URL`; focused lint on changed files passed. Aggregate local Node **171 passed / 20 Preview-only skips** and UI **63/63** passed. Production build passed with **158 modules**; Preview build passed with **158 modules**.
- Preview deployment: first focused deployment `dpl_H4f5ZAeCYzt3VwEn4arbd1T4EJcy` applied migration `020_season_journey.sql` but failed afterward because an unrelated legacy Match-3 DB cleanup attempted to delete an account referenced by immutable Coin ledger rows. The focused Season-only verifier then succeeded: `dpl_33P5ogFSFfRzUem391FhNBChyTL8`, generated URL `https://flip-h5thfjj6c-chattocal.vercel.app`, remote Season tests **8/8**, Vite build **158 modules**. Migration `020_season_journey.sql` is recorded in Railway Preview `railway/public` at `2026-07-20T14:36:50.243Z`.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"1982ad0a43e290de3c4d72422913c9cb"` and byte-identical HTML as the generated Preview. Main bundle `/assets/index-DOFOMsJ-.js` contains `1.20.0-season-journey` and `service=seasons`.
- Remaining risks: Season Journey UI pages, mission assignment/progress processing, post-100 supply claiming and premium-shop seasonal return rules are not built yet. The old Match-3 DB test has known cleanup debt against immutable ledger rows when run remotely. Production was not touched.

## Match-3 Effect Framework and Juice - 20 July 2026

- **Status: Implemented and verified on development Preview.** Match-3 now has a reusable presentation/effect planning layer separate from authoritative mechanics. The engine still decides matches, cascades, specials, scoring and board state; the client maps the resulting cascade data into presentation effects.
- What changed: added `src/match3/effects.js` with a classic effect pack, deterministic effect selection, cascade intensity, scalable particle counts, board-shake levels, rare announcer support and a future seasonal override template. Presentation now includes an `effectPlan` with per-cascade stages, multiplier display, created-special animation metadata and triggered-special impact metadata.
- Visual polish: normal clears have denser particles; special pieces now occupy most of the tile; four-match creation uses a rocket-impact treatment; five-match creation uses a sun-materialise treatment; square/T/L creations have distinct classes; special activations add impact pulses; cascades can show a large multiplier banner and rare announcer lines for exceptional cascades only.
- Reduced motion: semantic presentation remains, but heavy board shake, particle layers, creation shockwaves and special impacts are removed/shortened.
- Files changed: `src/match3/effects.js`, `src/match3/presentation.js`, `src/screens/Match3.jsx`, `src/screens/Match3.module.css`, `src/version.js`, Match-3 presentation/UI tests and `vercel.match3-juice-verify.json`.
- Verification: focused local Match-3 Node **36/36** passed; focused Match-3 UI **5/5** passed; focused JS/JSX/test lint passed, with one non-failing CSS-module warning when `Match3.module.css` was explicitly passed to ESLint; aggregate `npm test` Node **164 passed / 19 Preview-only skips** and UI **63/63**; production build passed with **157 modules**; Preview build passed with **157 modules**.
- Preview deployment: `dpl_HuFgbuFBBLVe1rrNeMBmRHkAWFRN` reached Ready at `https://flip-1zui1nn3z-chattocal.vercel.app`; Vercel verifier passed Match-3 Node **36/36**, Match-3 UI **5/5** and Vite build **157 modules**.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with the same ETag `"3967554339b4cca24ec1de6331f60dae"` and byte-identical HTML as the generated Preview. Main bundle `/assets/index-CVYgN8Tb.js` contains `1.19.0-match3-juice`; lazy Match-3 bundle `/assets/Match3-zXk2pYDe.js` contains `Cascade multiplier`, `FLIP OUT!!`, `sun-materialise` and `boardShake`; Match-3 CSS `/assets/Match3-sx1txtFF.css` contains `boardShake`, `multiplierBanner` and `creationShockwave`.
- Remaining risks: this is still CSS/DOM presentation polish rather than final art/audio/haptic production. Physical mobile QA is required to judge feel, screen shake strength and whether rare announcer text is too much. Production was not touched.

## Player Profile Header and Titles - 20 July 2026

- **Status: Implemented and verified on development Preview.** The shared player header now displays the selected curated avatar and a Player Title line instead of the old `Level not set` fallback.
- What changed: added a reusable Player Title catalogue supporting Prefix-only, Suffix-only and Prefix + Suffix display (`The Collector`, `Captain Brad`, `Brad the Magnificent`, `Captain Brad the Magnificent`). Settings now includes a responsive `Player Title` panel with live preview and server save. Starter titles are available immediately; title item IDs are also registered as non-tradable cosmetic catalogue items so future rewards/shop/season systems can unlock more titles without changing the header contract.
- Persistence: additive migration `019_player_titles.sql` adds nullable `selected_title_prefix_id` and `selected_title_suffix_id` to `fo_accounts` with format constraints. The server validates selections against the catalogue/owned title availability through `setPlayerTitle()`.
- Files changed: `src/data/playerTitles.js`, `api/_playerTitles.js`, `api/_playerState.js`, `api/fo-player-state.js`, `api/migrations/019_player_titles.sql`, `src/screens/Settings.jsx`, `src/screens/Settings.module.css`, `src/ui/components.jsx`, `src/ui/homeData.js`, `src/utils/gameApi.js`, `src/data/itemCatalog.js`, `public/ui/icons/player-title.svg`, title/header tests and `vercel.player-titles-verify.json`.
- Verification: focused local title/header Node **16/16** passed; focused local UI **15/15** passed; focused lint passed; project aggregate `npm test` Node **162 passed / 19 Preview-only skips** and UI **62/62**; production build passed with **156 modules**; Preview build passed with **156 modules** after rerunning serially because the first parallel attempt overlapped `dist` cleanup.
- Preview deployment: initial Vercel attempt was rejected because the inline verifier exceeded the 256-character build-command limit; fixed by `scripts/verify-player-titles-preview.mjs`. One retry then hit transient `fetch failed`; the next retry succeeded. `dpl_5B4cZL231eADQrg2JUViQiX7JRHY` reached Ready at `https://flip-gjswlf8v1-chattocal.vercel.app`; migration `019_player_titles.sql` committed to Railway Preview `railway/public` at `2026-07-20T13:53:44.127Z`; remote verifier passed Node **14/14**, UI **15/15** and Vite build **156 modules**.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with the same ETag `"e6ee00db494dd60d8afa88f68e83edd7"` and byte-identical HTML as the generated Preview. Main bundle `/assets/index-DsOxMNG0.js` contains `1.18.0-player-titles`, `Player Title`, `set-player-title` and `Choose a title`.
- Remaining risks: there is not yet a full title unlock/equip inventory UI beyond starter titles; future paid/achievement/season titles should grant the registered title item IDs before becoming selectable. Production was not touched.

## Coin-only Match-3 Revives - 20 July 2026

- **Status: Implemented and verified on development Preview.** The Match-3 loss flow now uses Coin-only Revives instead of the old loss-screen Extra Moves continuation. Advert revives are not used.
- What changed: added the approved three-attempt ladder: Revive One costs 25 Coins with 75% success, Revive Two costs 50 Coins with 50% success, and Revive Three costs 100 Coins with 25% success. The Match-3 loss modal displays the current cost/odds and an animated spinner, then either resumes the board with 5 moves on success or keeps the player in the lost state for the next attempt/retry.
- Economy boundary: the server rolls the revive odds, spends Coins through the tamper-evident ledger via `applyReward()`/`revive-cost`, stores the revive outcome in authoritative session state, and records an idempotent Match-3 action. Duplicate action IDs return the original result and cannot charge twice.
- Scope note: the normal `extra-moves` power-up remains a regular power-up, but it is no longer the loss-screen revive path. The older generic `continue` backend service has also been changed to Coin-only revive semantics so it no longer requires or consumes adverts.
- Files changed: `api/_progressionRules.js`, `api/_operations.js`, `api/_match3Sessions.js`, `api/_foMatch3.js`, `src/screens/Match3.jsx`, `src/screens/Match3.module.css`, `src/version.js`, `tests/progression.test.js`, `tests/match3-revive-db.test.js`, `tests-ui/match3-input.test.jsx`, `vercel.revives-verify.json`.
- Verification: focused Node **37 passed / 1 Preview-only skip** locally and **38/38 passed** during the Vercel Preview build with the live Preview DB revive spend/idempotency test enabled; focused Match-3 UI **4/4** locally and in Vercel; focused lint passed; project aggregate `npm test` Node **158 passed / 18 Preview-only skips** and UI **60/60**; production build passed with **155 modules**; Preview build passed with **155 modules**.
- Preview deployment: `dpl_A1obk4oMo5mLvruXJzY8RxpSm5UV` reached Ready at `https://flip-c4wrhmp54-chattocal.vercel.app`. Vercel inspect reported target `preview` and alias `https://dev.flipout.gizmogames.uk`.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with the same ETag `"2e02a61bd3eb33f948d10ecfce7624fd"` and byte-identical HTML as the generated Preview. Main bundle `/assets/index-JRly8bNa.js` contains `1.17.0-revives`; lazy Match-3 bundle `/assets/Match3-Bu_g7lyd.js` contains `Revive One`, `Reward Theatre` and the revive spinner UI.
- Remaining risks: the spinner needs physical mobile visual QA for feel and timing. No schema migration was required and Production was not touched.

## Reward Theatre milestone - 20 July 2026

- **Status: Implemented and verified on development Preview.** Reward Theatre now unlocks after every five completed Match-3 levels and uses server-committed rewards before any presentation plays.
- What changed: added reusable `reward-theatre-v1` reward table with Coins, Match-3 power-ups and stackable booster inventory rewards. Match-3 state/completion now reports pending 5/10/15/20 milestones. The authenticated Match-3 API can claim `reward-theatre` idempotently, and the result screen shows an animated three-reel presentation from the committed result.
- Economy boundary: Coin prizes are written through the tamper-evident Coin ledger as authorised `promotional-grant` entries with `source: reward-theatre`; item prizes go through `applyReward()`. Claim IDs are stable per player/milestone, duplicate/retry claims return the original prize, and presentation metadata is deterministic from the committed claim.
- Admin Toolkit: Preview toolkit Match-3 page can trigger a real pending Reward Theatre claim; Economy page can grant the new stackable booster inventory items for testing. Foil grants and Daily Wheel forcing remain intentionally unimplemented.
- Files changed: `api/_rewardTheatre.js`, `api/_rewards.js`, `api/_match3Sessions.js`, `api/_foMatch3.js`, `api/_foDevTools.js`, `src/data/itemCatalog.js`, `src/screens/Match3.jsx`, `src/screens/Match3.module.css`, `src/screens/DevToolkit.jsx`, `src/version.js`, `tests/reward-theatre.test.js`, `tests/reward-theatre-db.test.js`, `tests/foundation.test.js`, `tests-ui/dev-toolkit.test.jsx`.
- Verification: focused Reward Theatre/Foundation Node **14/14** passed; focused toolkit UI **6/6** passed; focused lint passed; project aggregate `npm test` Node **158 passed / 17 Preview-only skips** and UI **59/59**; production build passed with **155 modules**; Preview build passed with **155 modules** after rerunning serially because the first attempt overlapped `dist` cleanup with the production build.
- Preview deployment: `dpl_2Djfty34rSmqeSyQqDWV4xivzvcB` reached Ready at `https://flip-otq5c9ry4-chattocal.vercel.app`. The focused Vercel verifier ran live Preview DB Reward Theatre tests **15/15 passed**, including the every-fifth milestone claim, concurrent duplicate claim and later retry returning the original prize.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with the same ETag `"f1d3134bc090261407c2350510dc3a73"` and byte-identical HTML as the generated Preview. Main bundle `/assets/index-DjQjx2Sv.js` contains `1.16.0-reward-theatre`; lazy Match-3 bundle `/assets/Match3-BvBShpeZ.js` contains `Reward Theatre`, `Every 5 levels` and `reward-theatre`.
- Remaining risks: booster opening/purchase ownership is still not live, so Reward Theatre can award booster inventory items but they cannot yet be opened through the secure backend. The reel animation is CSS-based and needs physical mobile visual QA. No schema migration was required and Production was not touched.

## Card Shredder replacement - 20 July 2026

- **Status: Implemented and verified on development Preview.** The previous duplicate-only Recycler is superseded by the Card Shredder.
- What changed: `shredder-normal-cards-v1` destroys 5 unbound normal Inventory cards for 10 Coins; `shredder-foil-card-v1` destroys 1 unbound Foil Inventory card for 25 Coins. Recipes remain server data, not hard-coded payout logic. The Collection UI now shows a `Card Shredder` view and recipe selector. The public action accepts `shred-cards` while keeping the older recycler API name internally for compatibility.
- Economy boundary: Shredder Coin rewards go through the tamper-evident Coin ledger as `shredder-reward`; receipts remain idempotent by transaction ID and fingerprint; repeated/concurrent requests return one reward only. Collector Cards are rejected, bound Theme Album copies are protected by `bound_quantity`, and Exchange escrowed cards remain unavailable because they are outside Inventory.
- Schema: additive migration `018_shredder_recipes.sql` adds `selection_type`, disables `common-stars-v1`, relaxes `fo_recycler_recipes_batch_size_check` to `batch_size > 0`, and inserts/updates the two active Shredder recipes.
- Files changed: `api/_coinLedger.js`, `api/_foActions.js`, `api/_recycler.js`, `api/migrations/018_shredder_recipes.sql`, `src/screens/Inventory.jsx`, `src/screens/Collection.module.css`, `src/ui/collectionData.js`, `src/version.js`, Shredder/Collection tests and `vercel.shredder-verify.json`.
- Verification: focused local Node **22 passed / 1 Preview DB skip**; focused Collection UI **9/9**; project aggregate `npm test` Node **152 passed / 16 Preview-only skips** and UI **58/58**; focused lint passed for changed JS/JSX/tests; production build passed with **155 modules**; Preview build passed with **155 modules**.
- Preview deployment: first migration attempt rolled back because the old batch-size constraint rejected the one-Foil recipe; fixed in `0b40e21`. `018_shredder_recipes.sql` was committed to Railway Preview `railway/public` at `2026-07-20T11:55:00.592Z`. Final Ready Preview `dpl_BoSaausQxUQHDTW8YXDLpiXiWVFu` at `https://flip-85kzpzdta-chattocal.vercel.app` passed remote focused tests **23/23** and built `/assets/index-C_lvjHpx.js`.
- Permanent dev URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"ba640f0ca9628d791acd6ffae3a8b096"`, served the same HTML as the generated Preview, contained `1.15.0-shredder`, and lazy Inventory bundle `/assets/Inventory-DAzhP3w8.js` contained `shred-cards` and `Card Shredder`. Production was not touched.
- Remaining risks: Foil catalogue/inventory generation is still incomplete, so Foil shredding is ready but not normally reachable. Preview DB tests leave unique ledger-backed test rows because `fo_coin_ledger` is intentionally immutable.

## Authoritative Achievement framework - 20 July 2026

- **Status: Implemented and verified on development Preview.** Added persistent, server-authoritative achievement definitions, achievement event receipts, unlock receipts, player-state readback and Preview Admin Toolkit unlock/reset controls.
- What changed: migration `017_achievements.sql` adds `fo_achievement_events` and `fo_achievement_unlocks`. New service `api/_achievements.js` defines the framework, stable fingerprints, idempotent unlocks, event-driven progress evaluation, reset support and data-driven rewards. Coin rewards, if added to achievement definitions later, must be written through the tamper-evident Coin ledger as authorised promotional grants; item rewards go through the existing `applyReward()` boundary.
- Implemented achievements: `Unicorn Poop` tracks discovery of a Rare Foil card event; `Raider of the Lost Arc-hive` tracks opening boosters from five distinct Themes. These definitions currently have no automatic Coin rewards, preventing an unapproved economy balance change.
- Files changed: `api/_achievements.js`, `api/migrations/017_achievements.sql`, `api/_playerState.js`, `api/_foDevTools.js`, `src/screens/DevToolkit.jsx`, `src/version.js`, `tests/achievements.test.js`, `tests/achievements-db.test.js`, `tests/dev-tools.test.js`, `tests-ui/dev-toolkit.test.jsx`, `vercel.achievements-verify.json`.
- Verification: focused achievement/dev-toolkit Node **13 passed / 1 expected Preview DB skip** locally and **14/14 passed remotely against Preview DB**; focused toolkit UI **5/5** passed; full local Node **151 passed / 16 expected Preview-only skips**; full UI **58/58** passed; focused changed-file lint passed; production build passed with **155 transformed modules**; Preview build passed with **155 transformed modules**; app marker `1.14.0-achievements`.
- Preview migration/deployment: focused Preview deployment `dpl_4AKpTT81WGGxyzTisYVU8FaPPAar` reached Ready at `https://flip-n1hlqbpok-chattocal.vercel.app`. It applied `017_achievements.sql` to Railway Preview `railway/public` at `yamanote.proxy.rlwy.net`, committing `fo_schema_migrations` row at `2026-07-20T11:22:48.751Z`; verification output included tables `fo_achievement_events` and `fo_achievement_unlocks`.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"4547fddfdd032798d2820891bd0a9a92"`, served `/assets/index-BUBrTjkF.js` containing `1.14.0-achievements`, and served `/assets/DevToolkit-Dg4cfxj_.js` containing `achievement-unlock`. Production was not touched.
- Remaining risks: gameplay and booster systems do not yet emit achievement events automatically; the framework is ready, but normal event wiring is intentionally limited until those features are implemented.

## Preview Admin Toolkit expansion - 20 July 2026

- **Status: Implemented and deployed to development Preview.** The hidden `?dev=toolkit` route has been expanded from a small backend-capable utility into a responsive in-game Preview-only Admin Toolkit.
- What changed: the toolkit is still blocked outside Vercel Preview, still requires `DEV_TOOLKIT_SECRET`, and still requires the normal authenticated player session. It now exposes pages for Player, Match-3, Collection, Albums, Economy, Exchange, Achievements and Debug. Implemented actions include grant any catalogue card/item, grant complete Theme inventory, grant complete collection inventory, grant Collector Cards, authorised Coin grants through the Coin ledger, grant all defined power-ups, Match-3 level jump, mark level complete, unlock all Match-3 levels, reset Match-3 progress, reset Theme/Personal Albums, seed/expire/clear Exchange listings and inspect server player JSON, Coin ledger, inventory capacity and Exchange state.
- Deliberately not faked: Foil grants, booster grants, Reward Theatre forcing, Daily Wheel forcing and achievement unlock/reset remain labelled as prepared/unavailable until their authoritative persistence boundaries exist.
- Files changed: `api/_foDevTools.js`, `src/screens/DevToolkit.jsx`, `src/screens/DevToolkit.module.css`, `src/App.jsx`, `src/screens/Match3.jsx`, `src/version.js`, `tests/dev-tools.test.js`, `tests-ui/dev-toolkit.test.jsx`.
- Verification: focused backend toolkit tests **8/8** passed; focused toolkit UI tests **4/4** passed; full local Node **146 passed / 15 expected Preview-only skips**; full UI **57/57** passed; focused changed-file lint passed; production build passed with **155 transformed modules**; Preview build passed with **155 transformed modules**; app marker `1.13.0-preview-admin-toolkit`.
- Preview deployment `dpl_GDget3euUV6HNRmwzPe8JWVkM3Zd` reached Ready at `https://flip-4ghvxov8k-chattocal.vercel.app`. `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"8283466a5eaf4229a822faafbaeba260"`, served `/assets/index-KsKyQ1nQ.js` containing `1.13.0-preview-admin-toolkit`, and served lazy toolkit chunk `/assets/DevToolkit-BsOjrL_h.js` containing `Admin Toolkit`, `match3-unlock-all` and `exchange-clear`. Production was not touched.
- Remaining risks: live authenticated use of mutating toolkit actions still requires a Preview developer secret and a signed-in Preview player session. Full `App.jsx` lint remains blocked by pre-existing legacy `react-hooks/set-state-in-effect` issues outside this package; changed-file lint excluding those unrelated legacy blocks is clean.

## Match-3 Coin reward boundary - 20 July 2026

- **Status: Implemented and deployed to development Preview; focused Preview DB verification blocked by tool approval timeout.** Match-3 completion rewards now follow the approved sprint direction: a completed level grants **10 Coins**, and one verified advert double grants **10 more Coins** for **20 Coins** total.
- What changed: Match-3 rewards now use the tamper-evident Coin ledger through authorised server grants instead of generic Star balance writes. The existing database booleans `base_stars_granted` and `advert_stars_granted` are kept as legacy reward-claimed flags to avoid a risky rename migration. The client result screen and local Match-3 progress copy now show Coins rather than Stars.
- Files changed: `api/_match3Sessions.js`, `api/_foMatch3.js`, `src/screens/Match3.jsx`, `tests/match3-db.test.js`, `src/version.js`, `vercel.match3-coin-rewards-verify.json`.
- Verification so far: focused Node **45 passed / 1 expected Preview DB skip**; focused Match-3 UI **5/5** passed; full local Node **144 passed / 15 expected Preview-only skips**; full UI **55/55** passed; focused lint passed; production build passed with **155 transformed modules** and bundle marker `1.12.0-match3-coin-rewards`.
- Preview deployment `https://flip-49dscb8zb-chattocal.vercel.app` reached Ready from `dev`; `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"07732658a3c25d3c4c8160169cce5ee0"`, served `/assets/index-DBP55ZB2.js`, and the bundle contains `1.12.0-match3-coin-rewards`.
- Remaining risks: the end-to-end Coin ledger grant path still needs to run against the migrated Preview database because local tests skip Preview-only PostgreSQL checks and the focused Vercel verification deploy could not be launched after two approval-review timeouts. The legacy column names are intentionally left in place until a future additive cleanup is worth doing.

## Official Theme Album Collector Cards - 20 July 2026

- **Status: Implemented and verified on development Preview.** The Collection/Official Album first page now uses stable Collector Card read-model data for Gold, Bronze and Silver tiers instead of loose UI-only placeholders.
- What changed: Gold Collector catalogue variants are now non-tradable and non-stackable, Recycler selection explicitly rejects Collector cards, and each Official Theme Album exposes `collectorCards` with tier, label, requirement, earned state and available Gold artwork. The album first page renders these as card-shaped permanent trophies with premium placeholders until earned.
- Files changed: `src/data/itemCatalog.js`, `api/_recycler.js`, `src/ui/collectionData.js`, `src/screens/Inventory.jsx`, `src/screens/Collection.module.css`, `tests/foundation.test.js`, `tests/recycler.test.js`, `tests/collection-data.test.js`, `tests-ui/collection.test.jsx`, `src/version.js`.
- Verification: focused Node **31/31** passed; focused Collection UI **9/9** passed; full local Node **144 passed / 15 expected Preview-only skips** after rerunning with `node --test tests\*.test.js`; full UI **55/55** passed; focused lint passed; production build passed with **155 transformed modules** and bundle marker `1.11.0-theme-collector-cards`.
- Preview deployment `dpl_CUgp1W5L9sRmrt7m8tFNvAoUQTBQ` reached Ready at `https://flip-bu4xfy8ff-chattocal.vercel.app`; `https://dev.flipout.gizmogames.uk` returned HTTP 200 with matching ETag `"1b8311e87d1b5c98aba8818480eff402"`, served `/assets/index-D9qfM_MM.js`, and the bundle contains `1.11.0-theme-collector-cards`.
- Remaining risks: Bronze and Silver do not yet have bespoke final artwork, so earned states use premium tier placeholders. Foil item definitions remain the blocker for genuine Silver/Gold completion in normal play.

## Preview initial Exchange seed - 20 July 2026

- **Status: Implemented and verified on development Preview.** The Preview Developer Toolkit can now seed the initial Exchange market through `seed-initial-market`.
- The seed uses a deterministic protected market-maker account (`dev-market-maker@flipout.preview.invalid`) and one early card from each active theme, capped at 15 listings so it remains below the 20 active-listing limit. Prices start at 25 Coins and rise by 5 Coins per theme.
- The action is rerun-safe: if the market-maker already has active listings, it returns a duplicate response; if the original seed transactions were already consumed, it does not mint a second initial market.
- Files changed: `api/_foDevTools.js`, `src/screens/DevToolkit.jsx`, `tests/dev-tools.test.js`, `src/version.js`.
- Verification so far: focused dev-toolkit Node tests **5/5** passed; focused toolkit UI tests **2/2** passed; focused lint passed; production build passed. No schema migration was required and Production was not touched.
- Live Preview attempt on the first deployment exposed a backend client/pool bug in lazy expiry (`Client has already been connected. You cannot reuse a client.`). The fix now distinguishes checked-out PostgreSQL clients from pools and recovers from the partial seed by relisting already granted seed inventory instead of reminting it.
- Verification after fix: focused Node **20 passed / 0 failed / 1 Preview DB skip** across dev-tools/progression/game-services, focused UI **2/2** passed after rerunning from the real workspace, focused lint passed and production build passed.
- Preview deployment `dpl_5VayvBydRWKqECZyNdRBAWUMcwwg` reached Ready at `https://flip-ebi5cbb29-chattocal.vercel.app`; Vercel aliases included `https://dev.flipout.gizmogames.uk`. The permanent development URL returned HTTP 200 with the same ETag `"6a150a0c4ac2419f70e33c8c7bce90f5"` as the generated Preview and served `/assets/index--PY0bMfv.js`, whose bundle contains `1.10.3-market-seed`.
- Live Preview execution used authenticated guest `19080f5f-f2d6-4c62-9d26-0a1baedf41c7` and the local Preview developer secret. First call: `duplicate=false`, `listingsCreated=15`, `seedId=initial-v1`. Immediate retry: `duplicate=true`, `reason=seed-market-already-active`, `listingsCreated=0`. No schema migration was required and Production was not touched.
- Remaining risks: the seed is a development-only bootstrap action, not a seller management UI. Seller controls, richer market curation and scheduled expiry remain future work.

## Exchange listing rules - 20 July 2026

- **Status: Implemented and deployed to development Preview.** Exchange listings now enforce a 10 Coin minimum price, a maximum of 20 active listings per seller and a default seven-day expiry. There remains no maximum listing price.
- Expired active listings are processed lazily by the server when the Exchange is browsed or when a listing is touched. Expired escrowed items are returned automatically to the seller through a `market-return` transaction. Returns bypass Inventory-capacity checks because the card was already owned and escrowed by that seller.
- Buying an expired listing now marks it expired, returns the escrowed item and rejects the purchase with `EXCHANGE_LISTING_EXPIRED`.
- Player-facing Exchange copy now states the 20% fee, 80% seller receipt, 10 Coin minimum and seven-day expiry.
- Files changed: `api/_progressionRules.js`, `api/_operations.js`, `api/_foMarket.js`, `api/_gameServices.js`, `src/screens/Marketplace.jsx`, `tests/progression.test.js`, `src/version.js`.
- Verification: focused progression/game-services tests **14 passed / 0 failed / 1 Preview DB skip**; focused lint passed; production build passed with main JS `412.66 kB / 130.49 kB gzip`. Vercel Ready Preview `https://flip-686nznc9k-chattocal.vercel.app` updated `https://dev.flipout.gizmogames.uk`; both URLs returned HTTP 200 and ETag `"ff418892f441076e69cbb8be53496de6"`. The permanent URL served `/assets/index-f85Rls0H.js` at 412,665 bytes and contained `1.10.2-exchange-rules`. No schema migration was required and Production was not touched.
- Remaining risks: seller listing management UI and a scheduled expiry job remain future work; current expiry is automatic but lazy.

## Exchange commission update - 20 July 2026

- **Status: Implemented and deployed to development Preview.** Exchange settlement now uses the current sprint rule of a 20% commission instead of the previous 10% fee.
- The existing settlement boundary remains unchanged: buyer spend, seller gross receipt, Exchange fee and item receipt are still separate audited ledger/player transactions inside the locked listing settlement.
- Files changed: `api/_progressionRules.js`, `src/screens/Marketplace.jsx`, `tests/progression.test.js`, `tests/game-services-db.test.js`, `src/version.js`.
- Verification: focused progression/game-services tests **14 passed / 0 failed / 1 Preview DB skip**; focused lint passed; production build passed. Vercel Ready Preview `https://flip-5jmc7o4jw-chattocal.vercel.app` updated `https://dev.flipout.gizmogames.uk`; both URLs returned HTTP 200 and ETag `"e52b9c98d9ad03f3e4e3244725c35d49"`. The permanent URL served `/assets/index-DoyArEE8.js` at 412,663 bytes and contained `1.10.1-exchange-fee`. No schema migration was required and Production was not touched.
- Remaining risks: minimum listing price, maximum active listings, expiry return jobs and seller listing management remain future Exchange work.

## Preview Developer Toolkit - 20 July 2026

- **Status: Implemented and deployed to development Preview.** A hidden Preview-only developer toolkit has been added at `?dev=toolkit` so QA accounts can seed and inspect real player state before testing Official Theme Albums, Inventory, Exchange and Recycler flows.
- The backend service is `fo-game?service=dev-tools`; it returns 404 outside Vercel Preview, requires a configured `DEV_TOOLKIT_SECRET`, requires the normal authenticated player session, and routes all grants through existing server-authoritative boundaries.
- Implemented controls: inspect authoritative player state, grant catalogue items, grant complete Normal Theme inventory, grant authorised promotional Coins through the tamper-evident Coin ledger, reset the current player's Inventory, reset their Theme Album entries/collector records, and reset their Exchange listings.
- Foil grants and achievement resets are deliberately labelled prepared but unavailable because there are no authoritative Foil item definitions or achievement persistence tables yet.
- Files changed: `api/_foDevTools.js`, `api/fo-game.js`, `src/utils/gameApi.js`, `src/ui/devToolkitAccess.js`, `src/screens/DevToolkit.jsx`, `src/screens/DevToolkit.module.css`, `src/App.jsx`, `src/version.js`, `tests/dev-tools.test.js`, `tests-ui/dev-toolkit.test.jsx`.
- Verification: focused Node `4/4` passed; focused UI `2/2` passed; focused lint passed; production build passed with the toolkit split into its own lazy chunk. Commit `e093a6a` added the toolkit; commit `6575843` recorded the Preview secret setup and triggered Ready Preview `https://flip-6axzz5ohh-chattocal.vercel.app`.
- Live Preview verification: `https://dev.flipout.gizmogames.uk` returned HTTP 200, matched the generated Preview ETag `"859865aa8a9dc13357b1cd0adc3896e7"`, served `/assets/index-BHpPfOdN.js` at 412,670 bytes, and contained `1.10.0-preview-dev-toolkit`. With the saved local developer secret but no Bearer session, the dev-tools API returned HTTP 401, confirming the secret gate is configured and normal authentication still blocks access. Production was not touched.
- Remaining risks: `DEV_TOOLKIT_SECRET` is saved locally in ignored `.dev-toolkit-secret.local`; a signed-in Preview account is still needed for live grant/inspect acceptance. The complete-theme grant may still respect Inventory capacity, which is intentional because it uses the real grant boundary.

## Official Theme Album Collection UI — 20 July 2026

- **Status: Implemented and deployed to development Preview.** The Collection Albums view is now the first working Official Theme Album experience rather than a generic set grid. It uses existing Theme Album, Personal Album and Inventory-capacity boundaries without schema changes.
- The landing page shows all 15 themes as reusable themed album covers with variable card totals, Normal/Foil/Overall progress and Bronze/Silver/Gold Collector status. Theme presentation is data-driven through reusable metadata for accent, background, texture, motif, plaque and mood.
- Opening a theme shows a Collector Card page arranged as Gold over Bronze/Silver, then numbered album pages. Each card entry has independent Normal and Foil slots, card numbers in empty printed spaces, rarity stars plus text, and a title plaque spanning both slots. Inventory ownership alone no longer fills album slots.
- Existing server-authoritative `stick-in-album` is now wired into the UI with the required `Stick in Album` wording, confirmation copy, retry-safe transaction ID, success notice and a short 200-300 ms placement highlight. Personal Albums remain organisational-only and are reachable from the Albums area with create/add/remove controls wired to the existing backend.
- Files changed: `src/ui/collectionData.js`, `src/screens/Inventory.jsx`, `src/screens/Collection.module.css`, `src/version.js`, `tests/collection-data.test.js`, `tests-ui/collection.test.jsx`.
- Verification: focused Collection/Theme/Personal Node tests **16 passed / 0 failed / 2 Preview DB skips**; focused Collection UI tests **10/10 passed**; focused lint clean; production build passed. Full automated suite passed with Node **138 passed / 0 failed / 15 Preview DB skips** and UI **52/52 passed**. Vercel Preview build was Ready as `dpl_8zVSfKKKkKVJjiVvhpCb3VtJWd91`.
- Live Preview verification: `https://dev.flipout.gizmogames.uk` returned HTTP 200, matched generated Preview `https://flip-fh7x3wnkw-chattocal.vercel.app`, served ETag `"0b98da1361681ff70cc9997521afd2ef"` and bundle `/assets/index-Bw3DN3ii.js` containing `1.9.0-theme-albums-ui`. Browser acceptance confirmed onboarding to Home, Theme Album landing, Super Cars Collector page, numbered Normal/Foil slots, rarity stars/text and responsive layout at 360x740, 820x1180 and 1280x900 with no horizontal overflow or undersized visible buttons.
- Remaining risks: live manual Stick placement could not be exercised in the disposable Preview browser account because it had no eligible card inventory and the repository has no approved dev card-grant UI. The automated UI/action test and server idempotency tests cover the path; a future Preview QA account or dev-only grant utility would make this manually verifiable. Preview DB tests also remain skipped locally because `.env.preview.local` does not contain `DATABASE_URL`. Physical phone/tablet checks remain human.

## Mobile UX polish — 19 July 2026

- **Status: Implemented and deployed to development Preview.** Native iPhone orientation is portrait-only, Android phones request portrait, and tablets retain portrait/landscape through a 600 dp smallest-width policy. Web applies the same boundary progressively and presents a portrait guard where Safari or another browser refuses programmatic locking.
- Runtime safe-area variables now cover all four edges; compact phone-landscape layouts were removed from Home, shared components and Match-3.
- The promotional carousel now uses native touch/momentum scrolling and snap points, preserves autoplay/indicators/pause controls, and puts both arrows below rather than over the slide artwork or text.
- Daily Reward remains an authenticated server claim. The pending card stays a disabled semantic button, same-tick duplicate taps are blocked, the exact confirmed Star amount is displayed immediately, and Safari timezone detection has a safe UTC fallback. No placeholder reward animation or client-invented grant remains.
- Preview API verification exposed and repaired a pre-existing date-only Daily claim-ID collision. Claim IDs now include the authenticated player ID, remaining stable for retries without colliding across accounts.
- Coarse-pointer controls have a shared 44 x 44 CSS-pixel floor; carousel dots were enlarged to a full 44 x 44 target.
- Exact commands, files, limits and deployment evidence are recorded in `FLIPOUT_MOBILE_UX_REPORT.md`. Economy balance and gameplay rules were not changed.
- Final verification: Node 108 total / 100 passed / 0 failed / 8 local Preview-database skips; UI 20/20; focused lint clean; production and Preview builds passed. Permanent development URL HTTP 200 served `1.2.1-mobile-ux`. A fresh Preview guest received exactly 50 Stars once; the immediate retry was a duplicate and balance stayed 50. Native Android compilation remains blocked only by the missing local JDK, and physical Safari/Android device checks remain manual.

> **Development deployment URL:** Future verification and handover reports use `https://dev.flipout.gizmogames.uk`. Vercel-generated `*.vercel.app` addresses below are preserved only as historical deployment evidence, not as user-facing development URLs.

## Match-3 card-art tokens — 19 July 2026

- **Status: Implemented and deployed to development Preview.** All six temporary geometric tokens have been removed from the Home preview and real Match-3 board. They now use deterministic circular crops of existing Golden Retriever, Maine Coon, Tyrannosaurus rex, Saturn V, Strawberry and Bald Eagle card artwork.
- `src/match3/tokenCrops.js` records the source card ID/path, hand-authored focal point, zoom, rotation, accessible label, fallback and review decision for every token. `scripts/generate-match3-tokens.mjs` regenerates the 256 px transparent WebP derivatives and a machine-readable 32 px contrast/similarity report without altering source pixels.
- The development-only review surface is available at `https://dev.flipout.gizmogames.uk/?dev=match3-tokens`. It shows source artwork plus every crop at 256 px, 48 px board size, conservative 32 px phone size and a reduced-vision simulation. All six passed visual review; automated 32 px luminance deviation is **51.46–80.96**, and the closest pair difference is **0.1809** against the **0.16** rejection floor.
- Verification: deterministic regeneration passed; token Node tests **3/3**; focused token/preview UI tests **6/6**; full Node suite **82 passed, 0 failed, 8 Preview-only skipped**; full UI suite **19/19**; focused lint clean; production and Preview builds pass with the review route kept in its own lazy chunk. Commit `9ad2af5` produced Ready Preview `dpl_FdZJ9q6EkfNTtR3nJ6pwQKxZHa3X`; the permanent and generated URLs returned identical HTML/ETags, all six assets and the quality report returned 200, and bundle version `1.1.1-card-tokens` was present. No gameplay rules, economy, database or production system changed.

## Concept 4D design-system Home — 19 July 2026

- **Status: Implemented and deployed to development Preview.** The prototype Home has been replaced by the approved Concept 4D hierarchy using reusable React primitives and independent SVG/WebP layers. It has a safe-area fixed identity/economy header, data-driven promotional carousel, real-engine Match-3 preview, signature purple Play action, meaningful collection/Foil/season states and four-item bottom navigation.
- The fixed 390×844 shell has been removed. Responsive contracts cover 320px phones, common and tall phones, tablets, compact landscape, runtime safe-area insets, keyboard/focus, Reduced Motion and forced colours.
- Home now reads authenticated identity, authoritative Stars/Coins, Match-3 progress, inventory and live-ops data. Daily Reward availability is read without granting anything; claim remains an explicit server action. Missing XP/level and Foil foundations are reported honestly rather than fabricated.
- New reusable source lives under `src/ui/`; original layered assets live under `public/ui/`. Full results and remaining human checks are in `FLIPOUT_UI_IMPLEMENTATION_REPORT.md`; exact assets/statuses are in `UI_ASSET_MANIFEST.md`.
- Verification: UI **15/15 passed**; Node **79 passed, 0 failed, 8 Preview-only skipped**; focused lint clean; production and Preview builds pass at **412.01 kB / 129.33 kB gzip main JS** and **95.44 kB / 20.15 kB gzip main CSS**. Commit `c4e34bc` is live at `https://dev.flipout.gizmogames.uk`: HTTP 200 and bundle version `1.1.0-ui4d`. Vercel reports the custom domain correctly configured on Ready Preview deployment `dpl_Agvh9BKAVH1DCdzYP5pMMbvcjbDb`, with no issues or conflicts. The Preview DB-only suite could not connect because Vercel withholds its sensitive database/HMAC values from CLI execution; browser screenshots were blocked by the user-level browser privacy rule. No database or production system was changed.

## Match-3 balancing package — 18 July 2026

- **Status: Working in development/Preview.** Three deterministic auto-player strategies now play complete levels, aggregate reproducible results and classify outcomes against provisional bands. Raw unchanged and tuned outputs cover 14,000 full games; default balance runs use no power-ups.
- Small data-backed changes were applied to moves or one objective target on 18 levels. Levels 5 and 11 moved close to/inside their target ranges, while drop levels 9, 12, 16, 19 and 20 remain structurally below target and were not disguised with wholesale changes.
- A development-only, no-upload feedback JSON panel and `MATCH3_REAL_DEVICE_CHECKLIST.md` prepare iPhone/iPad/Android/keyboard/screen-reader testing. Engine move resolution averages 0.232 ms; ten Preview API moves averaged a perceptible 707.4 ms.
- Safe lazy routes reduced the main JS bundle from 501.09 KB/152.69 KB gzip to 390.07 KB/121.27 KB gzip in verified Preview. Full details: `MATCH3_BALANCING_REPORT.md`.
- Final balancing Preview: `https://flip-ocz8184ts-chattocal.vercel.app`; page smoke 200, unauthenticated Match-3 API 401. Production was not touched.

## Match-3 vertical slice update — 18 July 2026

- **Status: Working in Preview as a development vertical slice.** An 8×8, six-token, server-session Match-3 mode now includes valid swaps, cascades/refill, safe generation/shuffle, line/colour/bomb specials and combinations, score/moves/win/loss, four objective types, crates/ice/chains/holes/drops, five inventory-backed power-ups, 20 validated development levels, map/briefing/game/result screens, keyboard/touch support and resume.
- Migration `009_match3_vertical_slice.sql` added authoritative sessions/actions/progress to Preview PostgreSQL `railway/public` at `2026-07-18T18:29:52.884Z`. Completion grants exactly 30 Stars once; one provider-verified advert can add exactly 30 more. Match-3 cannot grant Coins.
- Exact final verification: local 75 total / 67 passed / 0 failed / 8 Preview-only skipped; Preview 75/75 passed; 2,000 simulated starting boards had zero initial matches and zero dead starts; focused lint and builds passed. Ready Preview: `https://flip-ky8oc33rz-chattocal.vercel.app`.
- **Remaining risks:** temporary CSS/Unicode art, no native advert/haptic proof, no full-level auto-player or production balance data, per-move network latency, and real-device accessibility/mobile checks remain. See `MATCH3_VERTICAL_SLICE_REPORT.md`.

> Current preferred future design direction is recorded in `FLIPOUT_DESIGN_DIRECTION.md`. It is design guidance only and does not change the implementation status recorded here.

> Currency update: premium Coins now use the additive tamper-evident server ledger in Preview; earned gameplay rewards use Stars at the approved 1 Coin = 10 Stars rate.

### Tamper-evident premium Coin ledger (18 July 2026)

- **Status: Working in Preview.** Migration `008_tamper_evident_coin_ledger.sql` committed at `2026-07-18T17:52:39.594Z`. It adds immutable per-account sequences, HMAC-linked hashes, unique purchase references and indexes. Development Coin balances were reset to zero because there are no users; migrations 001-008 subsequently verified as applied.
- Verified purchases and explicitly authorised promotional/refund grants are the only creation types. Sensitive spends verify the complete chain before using the balance. Exchange buyer spend, seller gross receipt and 10% fee are separately ledgered. Creator gifts have a purpose-specific atomic internal operation; no generic transfer API exists.
- Coin-to-Star conversion atomically deducts Coins, grants exactly 10 Stars per Coin and records one shared retry-safe reference. Stars cannot convert to Coins. Gameplay, daily, wheel, lockbox, promo and match-win rewards now use Stars at 10× their former Coin amounts.
- Local after cross-account provenance coverage: **57 total, 50 passed, 0 failed, 7 Preview-only skipped** in 286.839 ms; focused lint passed; build passed with 117 modules in 1.50 seconds. Preview database run: **56 passed, 0 failed, 0 skipped** in 38.479 seconds; build passed in 1.29 seconds.
- `scripts/verify-coin-ledger.mjs` recalculates balances, validates chains, identifies the first invalid entry and traces spends—including across Exchange settlement references—to original creation lots. It verified all 17 Preview ledger accounts as valid. Final code Preview `https://flip-45w824r5q-chattocal.vercel.app`; the prior verified deployment returned page 200 and unauthenticated API 401. Production was not touched.
- Remaining risks: full-chain verification is linear per sensitive action and will need authenticated checkpoints at scale; the current wheel/daily imagery still depicts old Coin-number art while awarding Stars; creator gift policy/UI and refunds from real payment-provider workflows remain future packages; HMAC rotation/recovery needs an operational policy before production.

Audit date: 18 July 2026. Scope: the complete repository at `dev` (1,444 files), including React/Vite source, serverless APIs, Capacitor shells, documentation, configuration, and assets. This is an orientation audit, not a redesign. Maurice/Sprocket material in `docs/` is treated as paused concept work, not the product centre.

## Executive assessment

Flip-Out! is a functioning, content-rich matching-game prototype with several playable modes, a large deck library, special-card mechanics, local progression, and a partly built Stripe/PostgreSQL layer. The core game should be retained. It is not yet a safe live economy: almost every gameplay reward, balance, unlock, spin, and progression value is client-authoritative and editable or repeatable locally. Collections, tradable items, auctions, lockboxes, sticker albums, rarity, annual rewards, and a proper inventory do not yet exist as systems.

The current architecture does **not** need a full rewrite. The matching engine and much of the presentation can remain. Before adding valuable or tradable items, selected foundations need refactoring: one typed player-state/inventory model, one economy transaction service, authenticated server ownership, server-authoritative reward rolls, and migrations away from scattered `localStorage` writes.

## System findings

### Core card flipping, matching, scoring, difficulty, timers, moves, and loss

- **Status: Working** (core matching); **Partial** (rules and modes)
- **What currently exists:** `useGame` builds paired boards, flips cards, resolves matches, changes turns, scores pairs, ends games, and implements 14 special-card types. Easy/Medium use 6 pairs; Hard/Lethal use 8. AI memory/knowledge scales by difficulty. VS/multiplayer have a 10-second player-turn timer; solo records elapsed time and local bests. Draws have coin-flip/tiebreaker handling.
- **Evidence from the code:** `src/hooks/useGame.js:16-80,115-285,293-565`; `src/screens/Game.jsx:124-145,276-303,410-485,795-856`.
- **Problems or risks:** there is no moves counter, move limit, round countdown, or loss condition other than losing on pair score. Difficulty changes board size and AI strength, not a coherent rule set. `Game.jsx` is a 76 KB orchestration/UI component with many interacting timers. No automated reducer tests cover special-card combinations or stale timers. Lint flags missing hook dependencies in the AI code (`useGame.js:675`) and many effect/ref issues.
- **Recommended next action:** retain the reducer and card UI; extract/test pure board, scoring, end-state, and special-effect transitions before changing rules. Define difficulty and loss conditions as data rather than scattered constants.

### Game modes and progression

- **Status: Partial**
- **What currently exists:** normal AI streak play, solo/time play, local pass-and-play logic, a five-opponent Gauntlet, a 32-step season map with boss, and Socket.io multiplayer client logic. Gauntlet and season progress persist locally.
- **Evidence from the code:** `src/App.jsx:394-604`; `src/screens/Gauntlet.jsx`; `src/screens/SeasonMap.jsx`; `src/hooks/useMultiplayer.js`; `src/data/seasonalOpponents.js:33-110`.
- **Problems or risks:** the current home screen exposes only Season, Gauntlet, and VS (`Home.jsx:156-173`). Online, Time Challenge, and Pass & Play have visual test icons whose clicks do nothing (`Home.jsx:178-189`). Multiplayer depends on an external server not present in this repository and is documented as untested. The season documentation says 30 steps while code uses 32. Season non-boss fights reuse one generic challenger. No server validation prevents progress editing.
- **Recommended next action:** retain all playable flows; formally mark hidden modes as internal/unfinished, test multiplayer against its server, and move mode definitions/progression rules into versioned data.

### Gold collector cards and foil variants

- **Status: Partial** (gold); **Missing** (foil variants)
- **What currently exists:** several deck folders have `gold.webp`; deck definitions expose some `goldFile` values. Gauntlet completion writes one global `fo_gold_card`; season completion writes `fo_season1_gold_card`. Deck purchase UI promises a deck-specific Gold Collector Card.
- **Evidence from the code:** `src/data/decks.js:7-280`; `src/App.jsx:71-80,545-554,583-599`; `src/screens/DeckPicker.jsx:159-168`; `src/screens/Gauntlet.jsx:61-86`.
- **Problems or risks:** there is no collection of owned gold cards, no deck-specific grant when a deck is bought with coins, and no ownership metadata. One global date flag cannot represent multiple cards. Normal foil variants, foil generation/odds, and foil inventory do not exist. Several decks have no gold asset.
- **Recommended next action:** postpone new foil types; represent every collector card as an inventory item with an immutable item definition and owned quantity/instance, then migrate the two existing completion flags.

### Deck/card collections and sticker albums

- **Status: Partial** (deck entitlements); **Missing** (card collection and sticker albums)
- **What currently exists:** `fo_owned_decks` unlocks whole decks; free decks are always playable; locked decks can be trialled or bought for 200 coins. The repository contains hundreds of card images and deck metadata.
- **Evidence from the code:** `src/data/decks.js`; `src/screens/DeckPicker.jsx:10-95`; `src/utils/foShop.js:14-19`.
- **Problems or risks:** individual cards are not owned, discovered, counted, or versioned. Trial play uses the locked deck but does not appear to restrict board selection to the advertised free-card count. No album, page, slot, completion, duplicate, or sticker data exists.
- **Recommended next action:** retain deck definitions/assets; design an item catalogue and collection schema before building any album UI.

### Rarity and random rewards

- **Status: Partial** (wheel only); **Missing** (collectible rarity)
- **What currently exists:** the daily wheel has explicit weights totalling 100: 1 coin 30%, 5 25%, 10 18%, 15 12%, 20 8%, 25 4%, 50 2%, 100 1%. Selection and animation agree on the selected segment.
- **Evidence from the code:** `src/screens/LuckySpin.jsx:52-71,171-221`.
- **Problems or risks:** the browser uses `Math.random`, awards itself, and stores counters locally; clock/storage editing gives unlimited rolls. No rarity model, reward table version, pity rule, eligibility filter, audit log, or balancing simulation exists.
- **Recommended next action:** keep the current weight table as a baseline, but execute valuable reward rolls server-side and record reward-table version and transaction ID.

### Coins, sources, sinks, and balances

- **Status: Partial / Broken for a live economy**
- **What currently exists:** sources include +10 for any win, +5–50 daily login, +1–100 wheel, promo codes, +100 Gauntlet boss, +150 season boss, and Stripe coin/bundle purchases. Sinks include 200-coin deck unlocks and 25-coin continue/retry. Trophies also accumulate but have no visible economic role.
- **Evidence from the code:** `Game.jsx:838-856,1331-1376`; `DailyBonus.jsx:3-52`; `LuckySpin.jsx:52-71,198-221`; `App.jsx:545-599`; `DeckPicker.jsx:72-95`; `api/_products.js`.
- **Problems or risks:** all gameplay sources/sinks are direct client writes with no ledger, bounds, atomicity, idempotency, or source IDs. The bug-report UI does **not** award the README's stated 50 coins. Daily rewards are granted before “Collect”. `todayKey()` in `Game.jsx` uses UTC despite the repository warning against it. Currency UI is inconsistently hidden. Balance inflation cannot be measured.
- **Recommended next action:** introduce one transaction API/service (`earn`, `spend`, `grantPurchase`) and an append-only ledger; route every existing source/sink through it before adding more.

### Rewarded adverts and continue-after-loss

- **Status: Placeholder** (ads); **Partial** (coin continue)
- **What currently exists:** wheel offers one “ad” spin per day. Streak and normal retry can cost 25 coins. A remove-ads product and UI assets exist but the purchase card is hidden.
- **Evidence from the code:** `LuckySpin.jsx:228-235,311-349`; `components/Interstitial.jsx`; `Game.jsx:1324-1376`; `Shop.jsx:193-205`.
- **Problems or risks:** `Interstitial` calls `onClose()` during render and immediately grants the rewarded spin; no advert is requested, watched, completed, or verified. Continue is coin-only, not rewarded-ad-based. Normal retry also adds a trophy on loss, which conflicts with trophy semantics. “Remove ads” uses both `fo_no_ads` and backup key `fo_remove_ads`.
- **Recommended next action:** disable/label rewarded spins until an ad provider callback exists; specify continue rules, then grant only from verified completion or an atomic coin spend.

### Daily wheel

- **Status: Partial**
- **What currently exists:** polished weighted wheel, local-midnight reset, one free spin, one nominal ad spin, promo bonus spins, prize animation, and coin award.
- **Evidence from the code:** `LuckySpin.jsx:7-71,142-221,224-349`.
- **Problems or risks:** client-authoritative timing and reward, fake advert, no interrupted-spin recovery/idempotency, and no telemetry. Reloading during the 7.1-second animation consumes the spin without granting the prize.
- **Recommended next action:** retain UI/weights; create a server-issued spin result with a claim ID, persist pending claims, and make animation a presentation of that result.

### Lockboxes and keys

- **Status: Missing**
- **What currently exists:** a real-money “Bonus Chest” product grants 400 coins and one Freeze extra; chest/key imagery exists.
- **Evidence from the code:** `api/_products.js`; `src/screens/Shop.jsx:197-215`.
- **Problems or risks:** this is a fixed bundle, not a lockbox system. There are no keys, loot tables, contents, ownership, opening flow, odds disclosure, duplicate handling, or age/territory considerations.
- **Recommended next action:** postpone until inventory, server rolls, economy policy, and compliance decisions exist.

### Inventory and consumable power-ups

- **Status: Broken / Missing foundation**
- **What currently exists:** Stripe bundles write `fo_extra_xray`, `fo_extra_freeze`, etc. A tiebreaker special increments `fo_tiebreakers`; Jokers derive from paid-deck count and a daily local counter.
- **Evidence from the code:** `foShop.js:26-31`; `useGame.js:537-565`; `Game.jsx:11-35,810-835`; `Shop.jsx:22-38,217-230`.
- **Problems or risks:** there is no unified inventory. Shop power-up cards have no purchase handler, and paid extras are never read/consumed by the game. The comment claiming a tiebreaker is awarded “to inventory” is only a local integer. Quantities are unbounded/editable.
- **Recommended next action:** build the item catalogue, inventory quantities/instances, and grant/consume transactions; do not sell more consumables until they are usable and restorable.

### Auction house, exchange, player sales, 10% fee, and pricing

- **Status: Missing**
- **What currently exists:** only design notes mentioning future avatar trading and a README reference to a trade board.
- **Evidence from the code:** no auction, listing, bid, sale, exchange, fee, price-history, escrow, or trade implementation exists under `src/` or `api/`.
- **Problems or risks:** local ownership cannot support scarcity or transfers. There is no account identity, item instance, atomic escrow, seller/buyer settlement, 10% fee calculation, cancellation, fraud control, pricing history, or moderation.
- **Recommended next action:** postpone UI. After authoritative inventory/accounts exist, specify a server-only double-entry transaction model and build fixed-price listing/settlement before auctions.

### Annual multi-stage event and annual choice box

- **Status: Missing**
- **What currently exists:** one static season map can serve as a visual/flow reference.
- **Evidence from the code:** no annual event schedule, release dates, item eligibility, 25 December cutoff, choice entitlement, or claim record exists.
- **Problems or risks:** eligibility cannot be calculated because item definitions have no release/retirement metadata and players have no server inventory.
- **Recommended next action:** postpone content; add `releasedAt`, `eligibleForAnnualChoice`, and item version metadata to the future catalogue, then define the event as server-configured stages and one idempotent entitlement.

### Daily rewards, streaks, challenges, and events

- **Status: Partial** (daily login and win streak); **Missing** (challenges/events framework)
- **What currently exists:** a seven-step daily login reward, Tuesday reset, consecutive-win streak/best streak, and partial server sync of best streak/PVP wins.
- **Evidence from the code:** `DailyBonus.jsx`; `App.jsx:111-115,394-484`; `api/fo-sync-stats.js`.
- **Problems or risks:** two unrelated meanings of “streak” coexist. Daily reward logic grants on page load and Tuesday forcibly resets even after a Monday claim. No challenge definitions, progress events, schedules, claim states, or live-ops configuration exist.
- **Recommended next action:** name the two systems explicitly, centralise local-date handling, and later add a generic objective/progress/claim model.

### Accounts, save data, and cloud persistence

- **Status: Broken / Partial**
- **What currently exists:** anonymous device UUID, localStorage, a one-year cookie mirror for selected keys, PostgreSQL purchases, email captured by Stripe, purchase restore endpoint, and best-stat sync.
- **Evidence from the code:** `utils/deviceId.js`; `utils/gameStorage.js`; `api/fo-checkout.js`, `fo-verify.js`, `fo-restore.js`, `fo-sync-stats.js`.
- **Problems or risks:** no authenticated player account exists. Cookie backup omits many keys and only snapshots on screen changes/explicit wrappers, while most code writes localStorage directly. Restore is currently broken: the client sends `{deviceUuid}` (`foShop.js:59-65`) but the API requires `email` (`fo-restore.js:13-17`); the Shop has no email input. Restoring purchased coins **adds the full historic purchased total again** on each successful restore. Gameplay progress and items are not cloud-saved.
- **Recommended next action:** fix the restore contract and idempotency immediately; then create account/session identity and a versioned server save with migration from legacy local keys.

### Anti-cheat, duplication, and economy protection

- **Status: Missing**
- **What currently exists:** Stripe verification checks paid status/source/device, purchase rows use Stripe session IDs, webhook signatures are verified, and promo redemption has a `(code, device_uuid)` uniqueness constraint.
- **Evidence from the code:** `api/fo-verify.js`; `api/fo-webhook.js`; `api/fo-redeem-code.js`.
- **Problems or risks:** arbitrary device UUIDs are accepted as identity. Stat sync accepts any increasing values. Promo codes fall back to a client-bundled table when the network fails, allowing new device IDs and repeated grants. Debug query `?unlock=gizmo` unlocks every paid deck in any build (`App.jsx:166-174`). All coins/progress/rewards can be edited locally. No nonce, signed session, ledger, rate limit, replay protection for reward claims, or anomaly detection exists.
- **Recommended next action:** remove production debug unlocks, stop offline grants of value, authenticate requests, validate progression server-side, and add idempotent transaction IDs/rate limits before trading.

### Monetisation

- **Status: Partial / Conflicted**
- **What currently exists:** Stripe Checkout products for selected decks, coins, remove-ads, chest, bundles, and launch offer; payment verification/webhook and local grant logic; promo codes.
- **Evidence from the code:** `api/_products.js`; `api/fo-checkout.js`; `api/fo-verify.js`; `api/fo-webhook.js`; `src/screens/Shop.jsx`; `components/SpecialOffer.jsx`.
- **Problems or risks:** product catalogue conflicts with game data: API sells `cats` and `dogs`, which `decks.js` marks free; many playable paid decks have no Stripe product. Native Apple/Google billing is absent. Remove-ads and some shop entries are hidden. Purchased consumables are disconnected. Checkout relies on database tables not created/migrated in this repo. The current Cloudflare hosting noted in `docs/HANDOVER.md` conflicts with Vercel-style `/api` functions and old README deployment instructions; actual API deployment must be verified.
- **Recommended next action:** reconcile one product catalogue with deck/item definitions and deployment reality; test purchase/verify/restore end to end in a sandbox before exposing products.

### Analytics, testing, and balancing tools

- **Status: Partial** (page analytics/dev helpers); **Missing** (game/economy QA)
- **What currently exists:** Vercel Analytics component, URL/dev helpers, and visual icon test views.
- **Evidence from the code:** `src/main.jsx`; `App.jsx:166-198`; `Home.jsx:174-195`; `Settings.jsx` dev season control.
- **Problems or risks:** no automated tests, test script, gameplay event analytics, economy telemetry, reward simulations, fixtures, schema migrations, or balancing dashboards. `npm run lint` scans generated `.vercel` output and reports 733 problems; source/API-only lint still reports 109 errors and 11 warnings.
- **Recommended next action:** make lint target source/config correctly, add unit tests for reducer/rewards/economy, and log a small stable event vocabulary with no personal data.

### Accessibility and mobile usability

- **Status: Partial**
- **What currently exists:** portrait-first layout, safe-area sizing, touch-focused controls, many button labels, reduced browser gestures, Capacitor Android/iOS projects, and a PWA manifest.
- **Evidence from the code:** `src/index.css`; `capacitor.config.json`; `public/manifest.json`; screen/component markup.
- **Problems or risks:** cards are non-focusable `<div role="button">` elements with no keyboard handler (`Card.jsx:13-28`); global `user-select: none`; focus outlines are removed; no reduced-motion mode; many icon-only/image controls and colour/state cues; fixed 390×844 presentation limits larger screens and text scaling; no accessibility tests. Settings offer sound/difficulty only.
- **Recommended next action:** add keyboard/focus semantics, reduced motion, scalable text/layout checks, contrast/label review, and device testing at small/large widths.

### Assets, configuration, unfinished and obsolete work

- **Status: Partial / Obsolete documentation present**
- **What currently exists:** extensive card, sound, music, opponent, UI, native icon, and video assets plus conversion scripts. Active source is relatively compact compared with assets.
- **Evidence from the code:** `public/`, `source-images/`, root conversion scripts, `scripts/`, `docs/old/`.
- **Problems or risks:** multiple root videos/source experiments and generated `dist`/`.vercel` outputs add noise. README says Vercel while handover says Cloudflare; roadmap says Maurice/Larry direction is definitive but that direction is now paused. Several assets and screens promise systems not wired to logic. `APP_VERSION` is referenced but not imported in `Home.jsx:222`, so submitting a bug report throws before the request. Asset provenance/licensing is not recorded in a manifest.
- **Recommended next action:** do not delete assets during feature work; first label authoritative docs/config, archive superseded direction, inventory runtime assets, and exclude generated outputs from lint.

## Immediate blockers

1. **No trustworthy economy/save authority.** Coins, unlocks, rewards, progress, and most inventory-like values are editable client storage.
2. **Restore Purchases is non-functional and non-idempotent.** Client/API request shapes disagree, and historic coin totals would be added repeatedly.
3. **Backend deployment/configuration is uncertain.** Current docs conflict between Cloudflare and Vercel functions; required database schema/migrations are absent from the repo.
4. **Rewarded advert flow is fake.** It grants immediately without an advert.
5. **No tests and a broken lint gate.** Build success cannot protect the timer-heavy reducer or economy.
6. **Bug reporting breaks at submission** because `APP_VERSION` is undefined in `Home.jsx`.
7. **Production debug/value paths exist,** including `?unlock=gizmo`, client promo fallback, and arbitrary stat submission.

## Existing strengths

- The core matching reducer, special-card variety, AI difficulty model, and board presentation are substantial and worth retaining.
- Season, Gauntlet, streak, solo, local, and multiplayer flows provide useful mode scaffolding.
- The deck catalogue and asset library are unusually rich for this stage.
- Stripe session verification and webhook signature checking are sensible beginnings.
- Local-time handling is correct in daily bonus/wheel code, and the wheel's weights are explicit and easy to balance.
- The UI is strongly mobile-oriented and has consistent visual identity.
- `npm run build` succeeds: 110 modules, 462.98 KB JS (140.02 KB gzip), 154.71 KB CSS (29.96 KB gzip). The only build warning is an ineffective dynamic import of `deviceId.js`.

## Architecture verdict

**Suitable with selected refactoring; no full rewrite recommended.** Keep React/Vite, Capacitor, the deck data, Card component, matching reducer, and most screens. Refactor the seams around them:

1. Split `Game.jsx` into tested game orchestration, mode rules, timers/effects, and presentation.
2. Replace scattered storage writes with a player-state repository and migration layer.
3. Add a server-authoritative item catalogue, inventory, wallet ledger, entitlements, and reward transactions.
4. Add authenticated player sessions/accounts before transfers or markets.
5. Keep UI optimistic where helpful, but make valuable grants/spends/ownership server-confirmed and idempotent.

The planned progression systems can grow on this structure. The planned player economy cannot safely grow on the current localStorage model.

## Recommended development sequence

1. **Baseline health:** fix bug-report version import, restore API mismatch, lint scope/config, and document the actual hosting/API path. Add a smoke-test command.
2. **Characterisation tests:** unit-test board creation, matching, scoring, every special, draws, timers, and game-over transitions without changing behaviour.
3. **Player-state boundary:** define a versioned `PlayerState`, storage repository, key migration, and single local-date utility; route all existing reads/writes through it.
4. **Economy ledger:** catalogue every coin source/sink; implement idempotent earn/spend/grant transactions and balance derivation. Remove debug/offline value grants from production.
5. **Accounts and cloud save:** authenticated identity, schema migrations, save/version conflict policy, device linking, and safe purchase restoration.
6. **Inventory foundation:** immutable item definitions plus stackable quantities/unique instances; migrate decks, gold cards, Jokers, tiebreakers, and paid extras.
7. **Repair existing loops:** make purchased power-ups usable, make gold-card grants deck-specific, restrict trials correctly, and reconcile trophy semantics.
8. **Reward service:** server-authoritative wheel/daily/event claims with claim IDs, pending recovery, weighted-table versioning, and telemetry.
9. **Mode completion:** expose and test Solo/Pass & Play/Online deliberately; verify two-device multiplayer; resolve season 30-vs-32-step data and generic opponents.
10. **Collections:** individual card ownership, duplicates, foil variants, gold cards, albums, completion rewards, and accessible collection UI.
11. **Live-ops framework:** daily challenges, streak naming, scheduled events, annual multi-stage event, release metadata, and annual-choice eligibility through 25 December.
12. **Trading/economy:** fixed-price player sales with escrow and atomic 10% fee, price history and abuse controls; add auctions only after fixed-price settlement is proven.
13. **Lockboxes/keys and further monetisation:** only after odds, inventory, recovery, account age/territory rules, native billing, and balancing tools are in place.
14. **Accessibility/performance release pass:** keyboard/screen-reader semantics, reduced motion, device matrix, bundle/asset loading, native-store compliance, and end-to-end tests.

Each package should ship with tests and migration/rollback notes before the next begins.

## First implementation task

**Create and test the player-state/economy boundary, beginning with the broken purchase restore path.** This comes first because every planned progression, collection, reward, and market feature depends on trustworthy ownership and balances, while the current restore flow can neither run successfully nor avoid duplicate currency grants.

Affected systems/files:

- `src/utils/gameStorage.js`: versioned state repository and legacy-key migration.
- `src/utils/foShop.js`, `src/screens/Shop.jsx`: make restore identity explicit and apply entitlements idempotently rather than adding historical coins.
- `api/fo-restore.js`, `api/fo-verify.js`, `api/fo-checkout.js`, `api/fo-webhook.js`: define one restore/entitlement contract and transaction IDs.
- New database migration(s): players, purchase entitlements, wallet ledger, unique constraints.
- New tests: repeated verify/restore, same purchase on a new device, partial local state, network retry, and mismatched identity.

This is deliberately a foundation repair, not a new feature or character-led redesign.

## Verification record and uncertainty

- `npm run build`: **passed** on 18 July 2026; warning about ineffective dynamic import only.
- `npm run lint`: **failed**, 733 problems because generated `.vercel` output is included. `npx eslint src api`: **failed**, 109 errors and 11 warnings.
- Automated tests: **none found**; `package.json` has no test script.
- Runtime/API integration: not fully verifiable locally from this repository because the multiplayer server is external and `.env` only supplies `VITE_SERVER_URL`; database/Stripe/advert credentials and DB migrations are not present locally.
- Native builds: not run; Android/iOS shells exist, but store billing and release validation are not implemented.
- Intent conflicts were not guessed: the Maurice/Sprocket puzzle-adventure documents, Vercel README, Cloudflare handover, 30-step prose, and 32-step code are recorded as conflicting historical/current sources.

## Implementation update — player-state/economy boundary (18 July 2026)

### What changed

- Added one controlled client transaction service in `src/utils/economyService.js`. Every transaction requires an ID, records that ID in `fo_economy_transactions`, applies bundled counter/entitlement changes together, rejects negative balances, and ignores retries of an applied ID.
- Routed all located writes for coins, trophies, owned decks, bonus spins, free unlocks, Jokers, tiebreakers, avatars, paid extras, gold-card flags, advert-removal entitlement, and daily-wheel usage through that service. Preferences and unrelated mode progress remain outside it.
- Purchase verification and Stripe webhooks now derive the same transaction ID: `purchase:<stripe_session_id>`. The database primary key makes concurrent callback/webhook inserts converge on one grant.
- Purchase restoration now requires the checkout email and returns individual transaction grants. It no longer returns an aggregated historic coin total. Repeating restore on the same local player state safely ignores every transaction already recorded.
- Restoration backfills stable transaction rows for purchases completed before this table existed.
- Promo grants now have stable IDs tied to device and code. Daily login uses `daily-login:<local date>`; game, wheel, continue, deck-unlock, completion, consumable, and developer grants also carry explicit IDs.
- Added the migration `api/migrations/001_fo_economy_transactions.sql` and excluded generated `.vercel` output from lint.

### Files affected

- Boundary/storage: `src/utils/economyService.js`, `src/utils/gameStorage.js`, `src/utils/foShop.js`.
- Existing mutation callers: `src/App.jsx`, `src/components/DailyBonus.jsx`, `src/components/RemoveAdsModal.jsx`, `src/hooks/useGame.js`, `src/screens/DeckPicker.jsx`, `src/screens/Game.jsx`, `src/screens/LuckySpin.jsx`, `src/screens/Shop.jsx`.
- Backend and schema: `api/_economy.js`, `api/fo-verify.js`, `api/fo-webhook.js`, `api/fo-restore.js`, `api/fo-redeem-code.js`, `api/migrations/001_fo_economy_transactions.sql`.
- Tests/configuration: `tests/economy.test.js`, `package.json`, `eslint.config.js`.

### Tests added and exact results

`npm test` uses Node's built-in test runner. Final result: **5 passed, 0 failed** in 77.2375 ms.

1. First-time purchase applies coins, deck entitlement, and power-up once.
2. Repeated restoration ignores both historic purchase transactions on the second pass.
3. Duplicate webhook and verification callback insert one server transaction.
4. Retry after an interrupted response does not reapply the client transaction.
5. Twenty-five concurrent duplicate grant attempts produce one insert and 24 duplicates.

`npm run build`: **passed** (110 modules; 464.49 KB JS / 140.80 KB gzip; 154.71 KB CSS / 29.96 KB gzip).

Focused lint for the newly added transaction service, backend helper/endpoints, migration-facing code, and tests: **passed with no findings**. Linting every touched legacy UI file still reports **44 errors and 10 warnings across 8 files**, all in previously identified code areas such as unused legacy UI state and React effect/ref rules; those unrelated issues were not broadly changed in this package.

### Remaining risks

- The SQL migration must be deployed before the updated endpoints receive traffic. Runtime database/Stripe integration could not be exercised without deployment credentials.
- Device UUID and email restore are not authentication. An account/session package is still required before valuable trading or a server-authoritative wallet.
- The client ledger prevents normal callbacks, restores, and retries from duplicating grants, while the database uniqueness constraint protects concurrent server callbacks. `localStorage` cannot provide a true cross-tab/database-grade lock; the later cloud-wallet package should make the server balance authoritative.
- Purchases made before the ledger existed have no client acknowledgement record. The first restore after this migration establishes their local transaction records; reconciling a heavily modified legacy local balance remains inherently ambiguous until server wallet history exists.
- Gameplay rewards now pass through one auditable boundary but are still decided by the client. Server-authoritative gameplay/reward validation remains a later package.
- The existing fake rewarded-ad completion and offline promo fallback were not redesigned in this package; their grants are now idempotent, but their trust model remains unsuitable for a valuable live economy.

### Development database migration (18 July 2026)

- Target: Vercel `chattocal/flip-out` **Preview** environment for Git branch `dev`; PostgreSQL at `yamanote.proxy.rlwy.net`, database `railway`, schema `public`. Production was not targeted or changed.
- Migration: `api/migrations/001_fo_economy_transactions.sql` (SHA-256 `90A1F4946AFF3D6210BAFAC241DEE498435CFE6A888909C0B71002C1D86361A7`).
- Precheck: `fo_economy_transactions` did not exist. The migration was applied inside `BEGIN`/`COMMIT`, with automatic `ROLLBACK` on error, and committed successfully.
- Verified: five expected columns; primary key/unique index on `transaction_id`; required `NOT NULL` constraints; and `fo_economy_transactions_device_idx` on `(device_uuid, created_at)`.
- Database-backed verification: **6 passed, 0 failed, 0 skipped**. This included the five economy tests plus a live Preview-database restoration test: the first purchase grant inserted/applied once, the repeated restoration was reported as a duplicate, the stored coin balance remained 100, and the test removed its own transaction row.
- Deployment helpers added: `scripts/run-economy-migration.mjs`, `tests/economy-db.test.js`, `vercel.migration-check.json`, and `vercel.migration-apply.json`. The runner refuses to apply unless `VERCEL_ENV=preview`.

## Progression/economy foundation continuation (18 July 2026)

### Completed foundations

- Added authenticated account/session foundations (`fo_accounts`) without altering the legacy device-keyed `fo_players` table. Device IDs are supporting links, not the ownership key. Account reads are scoped by bearer session; cross-account device takeover and transaction replay are rejected.
- Added server-owned balances, inventory and append-only transactions with database non-negative checks, idempotent IDs and transaction-safe concurrent mutation.
- Added a canonical item catalogue generated from existing decks/cards/specials, stable IDs, gold variants, rarity/release/tradability/status metadata, asset/reference validation, and annual-choice eligibility through 25 December.
- Added validated deterministic reward tables, preserving the existing daily-wheel weights exactly, plus seeded simulations.
- Added schema and tested rules for verified advert receipts, continuations, daily action limits, power-up consumption, lockboxes/keys, 10% marketplace fees, annual stages/choice claims, streaks, cloud save conflicts, audit records and anomaly flags.
- Removed the fake rewarded-ad success: an unavailable provider now grants nothing. Added card keyboard/focus/reduced-motion support and repaired the missing `APP_VERSION` import.

### Partial or blocked systems

- Account registration/login/state APIs exist, but public account UI, email verification, password recovery, logout/revocation and rate limiting remain.
- Reward, continuation, lockbox, marketplace, event/challenge and cloud-save schemas/rules exist; complete authenticated action endpoints and client screens remain. These systems must not be presented as finished merely because their tables and rules exist.
- Real advert completion is blocked on an approved provider/credentials. Foil/sticker content is blocked on authoritative assets/metadata. No success or content was invented.
- Existing purchase endpoints still use the legacy device purchase flow and need a deliberate authenticated-account migration in a later focused package.

### Migrations and Preview verification

- Added and deployed to Vercel Preview/Railway development only: `002_player_progression_foundation.sql` and `003_live_economy_systems.sql`.
- First migration attempt safely rolled back after discovering the existing `fo_players` schema. The compatible `fo_accounts` design then committed; legacy player/purchase rows were preserved.
- Migration history, new tables, columns, foreign keys, uniqueness/non-negative constraints and indexes were verified by `scripts/run-economy-migration.mjs`. Production was not targeted.

### Tests/build/lint

- Preview database suite: **25 passed, 0 failed, 0 skipped** in 9.925 seconds, including real PostgreSQL duplicate grants, concurrent deductions, negative-balance prevention and cross-account isolation.
- Reward simulation test: **100,000 deterministic wheel rolls passed** statistical sanity checks without changing configured probabilities.
- Preview build: **passed**, 111 modules; 467.62 KB JS / 141.75 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.61 seconds.
- Focused lint for the changed foundation files: **passed**. Existing global legacy lint debt remains.
- Full work/limitations/manual checklist: `FLIPOUT_OVERNIGHT_IMPLEMENTATION_REPORT.md`.

## Platform-native and guest identity package (18 July 2026)

- **Status: Implemented and verified in Preview.** Mandatory password registration/login was replaced at the public API boundary with automatic guest identity and platform identity. The old endpoints now return HTTP 410 and no registration/login screen was added.
- iOS uses a Capacitor bridge backed by `GKLocalPlayer`. It presents Game Center authentication when required and returns `gamePlayerID`, bundle ID, Apple public-key URL, signature, salt and timestamp. Declining or unavailable Game Center falls back to the already-created guest and never blocks play.
- The backend validates the Apple key URL, bundle ID and signature age, reconstructs Apple's signed byte payload, fetches the Game Center certificate and verifies the SHA-256 signature before trusting `gamePlayerID`.
- Added a provider-neutral identity mapping for Game Center, Google Play Games, Sign in with Apple, Google and email-link recovery. Google Play Games has an Android-ready adapter interface but its native SDK implementation remains pending.
- Guest upgrade attaches a new protected identity to the same `fo_accounts` row, preserving balances, inventory, saves and progress. If the identity already belongs to another account, the system switches without merging. Explicit upgrade conflicts return 409. Protected accounts cannot absorb another identity automatically.
- Protected identity can be required independently for trading, auctions and other high-value actions through `requireProtectedPlayer`; ordinary play remains available to guests.
- Added migration `004_platform_guest_identity.sql`: additive `account_kind`, `fo_account_identities`, uniqueness constraints and player index. It was committed to the Vercel Preview database at `2026-07-18T14:57:34.329Z` and verified by the migration runner.
- Local verification: **33 tests: 30 passed, 0 failed, 3 Preview-only skipped** in 233.3566 ms. Focused identity lint passed. Build passed: 113 modules, 474.15 KB JS / 144.34 KB gzip, 155.77 KB CSS / 30.17 KB gzip, 2.38 seconds.
- Remaining native work: enable the Game Center capability/entitlement in the Apple developer project, add the app in App Store Connect/Game Center, compile and exercise the Swift bridge on macOS/Xcode and a signed iOS device, add Google Play Games SDK/plugin on Android, and test real Apple certificate/signature verification in Preview.

## Account-owned purchase package (18 July 2026)

- **Status: Implemented and verified in Preview.** New checkout requests require an authenticated Flip-Out session, but guest sessions are valid purchasers. `player_id` is written to Stripe metadata, pending/completed purchase records and the idempotent purchase transaction.
- Verification rejects a Stripe session whose account metadata does not match the authenticated account. Webhooks use the server-created Stripe metadata and the existing `purchase:<stripe_session_id>` transaction ID. Replaying the transaction for another account returns `PURCHASE_ACCOUNT_MISMATCH`.
- Purchase ownership survives guest-to-platform upgrade without copying data because the identity is attached to the existing `fo_accounts` row. Identity-link retries and repeated restoration return the same ownership/transaction IDs and do not grant twice.
- Restore Purchases is now account-based and no longer asks for checkout email. It reads account-owned transactions plus unclaimed legacy transactions only from devices already linked to that account.
- Added a small Preview-only `linkLegacyTest` restore action. It can assign unowned development purchase/test transaction rows only when the requested device belongs to the authenticated account; retries are no-ops and conflicting ownership is rejected. No broad production backfill or migration process was created.
- Legacy `device_uuid` columns and records remain readable as compatibility metadata. New ownership authority is `player_id`.
- Added `005_account_purchase_ownership.sql`: nullable `fo_purchases.player_id` foreign key plus account/status and unclaimed-device indexes. It is additive so legacy rows remain intact.
- Local tests after the database-test cleanup fix: **40 total; 36 passed, 0 failed, 4 Preview-only skipped** in 216.3105 ms. Preview database/build run: **40 passed, 0 failed, 0 skipped** in 13.755 seconds. The new tests cover guest and protected purchases, upgrade preservation, repeated restoration, duplicate callbacks, link retry, legacy linking and cross-account rejection.
- Local build: **passed**, 113 modules; 474.12 KB JS / 144.31 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.35 seconds. Preview build: **passed**, 113 modules; 476.57 KB JS / 145.01 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 933 ms. Focused purchase lint passed. `Shop.jsx` still has five pre-existing unused-variable errors outside the changed restore path.
- `004_platform_guest_identity.sql` and `005_account_purchase_ownership.sql` were applied to the database exposed to Vercel Preview. Migration 005 committed at `2026-07-18T14:57:34.653Z`; its nullable `player_id` foreign key and both purchase indexes were verified. A second run reported all five migrations already applied. Ready deployment: `https://flip-q0wxad5d9-chattocal.vercel.app`. No production deployment target was used.
- The first post-migration build exposed only an integration-test cleanup defect: tests deleted parent account rows before dependent purchase/identity rows and left connections open. `tests/economy-db.test.js` and `tests/purchase-identity-db.test.js` now clean child rows first and always close connections. Application purchase logic was unchanged by this correction.
- Remaining risks: Stripe sandbox end-to-end checkout was not invoked; account switching intentionally does not transfer purchases between distinct accounts; legacy unowned rows require the explicit Preview-only link; old device/email restoration should be removed only after development compatibility is no longer needed.

## Server game-services continuation (18 July 2026)

- **Status: Partial, deployed and database-verified in Preview.** Daily login and the free/advert/coin daily-wheel paths now use authenticated, atomic server claims. Wheel weights remain exactly `30/25/18/12/8/4/2/1`; timezone date keys, one-per-day limits, stable claim IDs, coin deductions and retry recovery are server enforced. The advert path cannot succeed until a provider verifier is registered.
- Added atomic service foundations for continuation, power-up consumption, lockbox/key opening, fixed-price marketplace escrow/settlement/cancellation, annual choice claims, challenge claims, versioned cloud saves, rate limits and aggregate Preview analytics. Marketplace settlement charges `floor(gross * 10%)`, credits 90%, and locks listings against concurrent buyers.
- Added My Collection and Exchange screens with server inventory/transaction data and loading, empty, error and protected-identity states. Lockbox opening is connected. Foils/stickers remain explicitly deferred because authoritative assets/metadata do not exist.
- Added migration `006_game_services.sql`; committed to the Preview database at `2026-07-18T15:23:25.062Z`. Verified new reward, streak, challenge, lockbox and rate-limit tables plus marketplace expiry/cancellation columns. No production target was used.
- Vercel Hobby's 12-function cap initially rejected deployment. The seven new handlers were consolidated behind authenticated `fo-game.js`, keeping the public function count at exactly 12 without payment. Final Preview: `https://flip-qfgmlmwcd-chattocal.vercel.app`.
- Preview verification: **44 passed, 0 failed, 0 skipped** in 19.405 seconds, including real PostgreSQL duplicate wheel claims, lockbox retry, exact 10% fee and a concurrent two-buyer race. Local: **44 total; 39 passed, 0 failed, 5 Preview-only skipped** in 249.8779 ms. Economy simulations ran 100,000 wheel and 100,000 lockbox rolls. Focused source lint passed. Preview build passed with 118 modules; 486.51 KB JS / 148.13 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 1.75 seconds. HTTP smoke test: page 200; unauthenticated game API 401.
- Still partial: core match completion is not server-authoritative, so match/challenge/event rewards cannot safely trust current client gameplay; purchased power-ups and continuation APIs are not yet wired into the large `Game.jsx` state machine; no advert provider exists; annual/challenge content definitions are absent; marketplace and collection screens require device testing and visual integration; cloud authority currently covers progression/settings, not the economy ledger (which is already server-owned).
- The insecure client-side promo-code fallback was removed: network failure now grants nothing. A later full build experienced one transient Railway `ECONNRESET` after the complete 44/44 database pass. Because the last change was client-only, it was deployed with `vercel.preview-code.json` without rerunning or changing the database; the final Preview build passed in 1.64 seconds.
- Full handoff: `FLIPOUT_COMPLETION_REPORT.md`.

## Authoritative match sessions foundation (18 July 2026)

- **Status: Partial; backend working and Preview-verified, live game connection postponed for rule parity.** Authenticated guests/protected accounts can create unguessable match sessions, resume their own state, submit uniquely identified monotonic events, and complete a server-validated win exactly once.
- The `memory-v1` reducer validates regular flips, pair resolution, scores, move counts, elapsed time and server completion. It rejects impossible flips, score claims, timer manipulation, duplicate/reordered events and cross-account access. Match creation/event/completion are rate-limited and audited; accepted events store a resulting-state hash.
- Completion grants the fixed 10-coin match reward through the player transaction ledger and writes one trusted `match-win` progress event. Concurrent completion callbacks serialize on the match row and converge on one reward.
- Added migration `007_authoritative_matches.sql`, committed to Preview at `2026-07-18T15:41:11.782Z`. It additively extends `fo_matches` and adds `fo_match_events` plus `fo_match_progress_events` with primary/foreign/sequence constraints and indexes.
- Added the match service to the consolidated `/api/fo-game?service=matches` function, preserving the Vercel Hobby 12-function limit.
- Verification: local **48 total; 42 passed, 0 failed, 6 Preview-only skipped** in 237.8106 ms. Preview **48 passed, 0 failed, 0 skipped** in 27.048 seconds. Focused match lint passed. Preview build passed with 117 modules; 486.41 KB JS / 148.10 KB gzip; 155.77 KB CSS / 30.17 KB gzip; 925 ms. Preview: `https://flip-ms2y25ven-chattocal.vercel.app`.
- **Important boundary:** the live `useGame.js` reducer includes 14 special-card effects, stopwatch multi-flips, crown scoring, frozen cards, shields, stun, Joker and AI transitions. `memory-v1` intentionally does not pretend to validate those yet. Connecting it to the existing VS/Season/Gauntlet game now would change mechanics or leave validation gaps, so live match rewards remain on the legacy path until a shared pure reducer achieves exact rule parity.

### Post-package verification and safe cleanup (18 July 2026)

- Removed only behavior-neutral dead code directly encountered in the affected game/economy files: unused Shop import, unused wheel geometry helpers, unused game helper/state, and a disconnected interstitial render path. Optional Web Audio failures now have explicit no-op handling; the Joker callback was renamed locally to avoid a false hook-name lint error; AI difficulty inputs are now declared callback dependencies.
- Local verification after cleanup: **48 tests total; 42 passed, 0 failed, 6 Preview-database tests skipped** in 202.6737 ms. Focused package lint passed with zero warnings. Build passed with 117 modules in 1.43 seconds (483.61 KB JS / 147.30 KB gzip; 155.77 KB CSS / 30.17 KB gzip).
- Full source lint remains legacy debt: its strict React effect rule rejects the existing timer/animation state machine, and unrelated screens contain unused props/variables. Rewriting that orchestration is deliberately outside this package because it risks changing core gameplay. `Game.jsx` has six non-blocking hook-dependency warnings when the incompatible effect rule is excluded.
- The next safe implementation package remains exact special-card/timer/AI reducer parity. Live gameplay must not issue authoritative rewards until that parity is complete and tested.
- Final Preview verification deployment: `https://flip-ba3jkkws1-chattocal.vercel.app`. The active target was Vercel Preview backed by Railway database `railway`, user `postgres`, schema `public`, host `yamanote.proxy.rlwy.net`; `VERCEL_ENV=preview` was enforced. Migrations 001-007 were all already applied, so no schema change occurred. Database suite: **48 passed, 0 failed, 0 skipped** in 31.075 seconds, including duplicate purchase restoration, concurrent duplicate grants, identity/purchase linking, marketplace races and authoritative match completion. Preview build passed in 912 ms. HTTP smoke: app 200; unauthenticated match API 401. Production was not touched.
## Match-3 gameplay completion update — 19 July 2026

- **Status: Working, pending human device feel review.** Match-3 now implements four/five, T/L/cross, enabled 2x2 squares, wrapped specials, all seven relevant special pairings, recursive chain reactions, cascades and combo multipliers through the shared deterministic engine.
- The board consumes server-returned event detail for swap timing, combo labels, particles, beams, explosions, colour effects, special creation/trigger feedback, idle motion and haptics. It does not predict results or trust a client-computed board.
- Existing levels and economy values were preserved. The completion remains exactly 30 Stars, or 60 after one verified advert; Match-3 grants no Coins.
- Verification: focused gameplay **39/39**; full local Node **95 passed + 8 expected Preview skips**; UI **19/19**; 20,000 seeded boards with zero invalid starts; production and Preview builds passed; local HTTP smoke returned 200.
- Full-project lint still has 38 errors and 8 warnings in unrelated prototype files. Every changed file passes focused lint. See `MATCH3_GAMEPLAY_COMPLETION_REPORT.md`.
- Gameplay commit `5a22617` deployed Ready as Preview `dpl_L161cZ7Cqze89qSuKWj9dhkbJmwZ`. `https://dev.flipout.gizmogames.uk` returned 200, matched the generated deployment's HTML/ETag and served version `1.2.0-match3-gameplay`. Production and the database were untouched.

## UI consolidation update — 19 July 2026

- **Status: Working, pending physical-device accessibility review.** Every reachable route now uses the approved Concept 4D shell, typography, spacing, panels, controls, dialogs and four-destination navigation.
- The old Season map, game-show/scenic prototype shells, old image back controls and unused `AdBanner`, `DailyBonus` and `SpecialOffer` components were removed. Season progress remains informational only.
- Collection and Exchange were rebuilt from plain prototypes; More is now the durable secondary-destination hub. Mechanic-specific game boards remain intact inside the shared visual shell.
- Version: `1.3.0-ui-consolidation`. Local verification: 100 Node tests passed with 8 expected Preview-only skips; 25/25 UI tests passed; build passed; focused lint reported 0 errors and 4 pre-existing gameplay hook warnings.
- Full route matrix, removals and remaining risks: `FLIPOUT_UI_CONSOLIDATION_REPORT.md`.

## Collection 2.0 update — 19 July 2026

- **Status: Working, pending physical-device accessibility review.** The prototype Collection list is replaced by a premium album/set/card catalogue with search, filters, missing and owned states, account-scoped favourites, recent acquisitions, statistics, completion and milestone progress.
- It reads canonical catalogue metadata and authoritative player inventory/transactions. The existing lockbox and non-card inventory flow remains available in a secondary Items view.
- The route does not fabricate unavailable systems: there are currently no authoritative Foil definitions and no milestone reward catalogue/grant endpoint.
- Version: `1.4.0-collection2`. Full implementation, verification and remaining risks: `FLIPOUT_COLLECTION_2_REPORT.md`.
## Duplicate Card Recycler update — 19 July 2026

- **Status: Working in development/Preview; reward balance provisional.** Collection now includes a premium Recycler view for selecting common-card duplicates in complete server recipes.
- The server validates catalogue type/rarity, locks inventory, preserves at least one copy plus all bound copies, records every destroyed quantity, grants the reward and stores an account-owned receipt in one atomic transaction.
- Duplicate, concurrent and interrupted retries reuse the same transaction ID and cannot destroy or reward twice. Different input or cross-account replay is rejected.
- Additive migration `010_duplicate_card_recycler.sql` committed to Railway Preview at `2026-07-19T14:17:11.289Z`; the three Recycler tables, indexes and constraints were verified. Production was not touched.
- The provisional development recipe is 5 common duplicates to 1 Star. It is data-driven and requires balancing before release. Coins are not issued.
- Local verification: focused Recycler/model tests passed, 6 Collection UI tests passed, focused lint passed and production build passed. Focused Preview verification passed 10/10 including exact 1-Star reward, live database concurrency, duplicate/replay protection and last-copy protection.
- Migration 011 `recycler_common_reward_balance` committed to Preview at `2026-07-19T14:37:25.075Z`; no production target was used. Final balance-correction deployment: `https://flip-r2k6hd99c-chattocal.vercel.app` (`dpl_DNHovuYCSAC6VwmAXro8xr9rsPGS`).
- One broad Preview build test remains blocked by Vercel omitting a gitignored Android native file; this is unrelated to Recycler logic and is detailed in `FLIPOUT_RECYCLER_REPORT.md`.
- Commit `2d8eefb` deployed Ready as Preview `dpl_Pe11GoVn1HEQwY97ktuzYbWx74WW`; `https://dev.flipout.gizmogames.uk` returned HTTP 200, matched the generated deployment bundle/ETag and reported `1.5.0-recycler`.

## One-time nickname onboarding — 19 July 2026

- **Status: Implemented and verified in Preview.** First-time accounts without `display_name` are held on an accessible nickname screen before Home. Existing named accounts bypass it permanently.
- Migration `012_player_display_name.sql` adds a nullable, non-unique `fo_accounts.display_name` with a database format constraint. `player_id` remains the permanent UUID used for account, economy and future social identity.
- The server validates 3–12 ASCII letters/numbers, case-insensitive reserved names and the server-side profanity list. It only sets an empty display name, treats same-name retries as idempotent and rejects any different second claim. Duplicate display names across accounts are allowed.
- Migration 012 committed to Railway Preview at `2026-07-19T14:54:07.959Z`; `fo_accounts.display_name` was verified nullable and the format constraint was created. Preview verification passed 7/7 server/database tests and 9/9 focused UI tests; the Preview build passed with 142 modules. `https://dev.flipout.gizmogames.uk` returned HTTP 200 from the Ready Preview build and its bundle contained the nickname onboarding/API code. No authentication, purchase or economy behavior changed.

## One-time avatar onboarding â€” 19 July 2026

- **Status: Implemented and verified in Preview.** The profile now uses one reusable catalogue of existing `a*.webp` portrait assets. New players proceed nickname â†’ avatar â†’ Home; nickname-only accounts resume directly at avatar selection; profiles with both values bypass onboarding.
- The profile will persist the opaque `selected_avatar_id`, never an image path. The server accepts starter catalogue IDs only, allows a same-ID retry and prevents a different later overwrite. Promo-only avatars remain registered but unavailable during first-time setup.
- The Home header renders the selected catalogue asset inside the existing avatar frame. The avatar grid is safe-area aware, keyboard/touch accessible, screen-reader labelled and respects reduced motion.
- Migration 013 committed to Railway Preview at `2026-07-19T15:06:07.320Z`; `fo_accounts.selected_avatar_id` was verified nullable. Preview verification passed 11/11 server/database tests and 19/19 focused UI tests; focused lint passed and the 145-module production build passed. Ready Preview: `https://flip-9ul60548p-chattocal.vercel.app` (`dpl_78BWjkMnTLa5ptny8a3KjHfqbk5E`). A first verification attempt hit a transient Railway connection termination in the nickname DB test after migration; serialised DB tests passed on the immediate rerun. Production was not touched.

## Match-3 input and T-Rex token correction — 19 July 2026

- **Status: Implemented and verified in Preview.** The input defect was caused by stale `presentation` state surviving a level transition/restart. `GameBoard` treated any truthy presentation object as a permanent lock, including old move effects and zero-duration restart presentations.
- The fix clears presentation timers/state at level start, restart, quit, map and next-level transitions; only a positive-duration presentation is now a genuine resolving lock. Active boards are explicitly marked `data-input-locked="false"`. Tap/click, pointer swipe and keyboard selection are covered by regression tests.
- The T-Rex token remains sourced from `mastersOfTheLostWorld:1` and is now cropped at focal point `x=0.56, y=0.26` with zoom `4.2`. This tightly includes the eye, brow, open mouth and teeth while removing card text, fossil scenery and ambiguous body fragments. Deterministic regeneration updated the WebP and quality report; closest 32px pair is `leaf / drop` at `0.1856` (threshold `0.16`).
- Verification: 32/32 focused Node engine/token tests passed; 8/8 focused Match-3 UI/token tests passed; focused lint passed; production build passed with 145 modules. Preview `https://flip-6gkw201j4-chattocal.vercel.app` (`dpl_2iLM8jScemputLVFeE6zkwRs2bhj`) reached Ready. Production was not touched.

## Match-3 gameplay animation correction — 19 July 2026

- **Status: Implemented and verified in Preview.** Added deterministic presentation phases for invalid-swap return, resolving cascades/falls/refills, dead-board shuffle and special feedback. The authoritative board/session is still committed from the API before presentation; animation timing cannot change gameplay logic.
- Input remains locked only for busy requests, genuine presentation duration, pause, blocking dialogs or non-active state. Duplicate move submission is guarded in `GameBoard`; visibility changes clear presentation safely. Reduced motion preserves labels/effects with shortened timing.
- Focused verification passes 37/37 Node tests and 8/8 UI/token tests; focused lint and the 145-module production build pass. Preview `https://flip-azm52xj8g-chattocal.vercel.app` (`dpl_922goAdpMUfRjaCig1WEL81n9gtc`) reached Ready. T-Rex metadata remains `(0.56, 0.26)`, zoom `4.2`, source `mastersOfTheLostWorld:1`.

## Booster Store and special-art package — 19 July 2026

Supplied booster artwork is bundled as `public/ui/shop/booster-packs.webp` and displayed on Shop. Themed and Random panels show five cards and 500 Coins, but purchase controls remain disabled because no approved server-authoritative booster endpoint or foil probability configuration exists. Store is in global bottom navigation with safe-area scroll padding. Match-3 line specials now use Rocket artwork and wrapped/colour specials use a Sun graphic.

Store information polish adds accessible Concept 4D panels explaining pack contents, themed/random foil differences, discoverable titles/avatars, Exchange usage and Gold Collector Card rewards. Booster Buy controls remain disabled with a Coming Soon state.

## Real-device gameplay repair revision — 19 July 2026

- **Status: Preview deployed; manual acceptance still required.** Added per-token swap geometry, pointer capture, touch-action control, drag threshold handling, invalid swap return motion, and a development diagnostics overlay with a 25% slow-motion control.
- Preview: `https://flip-4lw572b7k-chattocal.vercel.app` (`dpl_3tH1ZE26TtJ7ugCUA4pbQ1F5dy7H`). Cloud build passed 37/37 Node tests, 8/8 UI/token tests and the 145-module production build. Browser-level coordinate/trace tests and real iPhone Safari/manual acceptance were not available in this environment and remain required before calling this complete.

## Deployed visible-drag correction — 19 July 2026

- **Status: deployed and browser-verified; physical iPhone Safari acceptance remains a human device check.** This supersedes the unverified visual-drag claims above.
- Exact root cause: the deployed tile had `pointerdown` and `pointerup` handlers that only stored and compared coordinates. It had no `pointermove` handler, no React drag render state, and no drag transform on the visible tile. In addition, the perpetual idle animation owned `transform`, so a non-prioritised transform would have been overridden.
- `GameBoard` now captures the pointer, updates deterministic drag state on every move, applies a high-priority `translate3d` to the held token, previews the neighbouring cell, commits both cells to opposite positions on release, and returns invalid/out-of-bounds drags. Stable cell keys are unchanged. `touch-action: none`, selection suppression and pointer capture prevent board drags from scrolling the page.
- A Preview-only diagnostic overlay is available with `?match3Diagnostics=1`; it reports pointer-down/current coordinates, delta, token ID, source/destination, capture, threshold, active transform, phase and lock reason.
- Deployed Edge verification passed against `https://flip-lyw0sei3q-chattocal.vercel.app`: held mouse travel **32.125 px**, neighbour preview **−6.905 px**, committed exchange **+63.865/−63.865 px**, capture `yes`, no scroll, and the authoritative board settled from 18 to 17 moves. A 390×844 Chromium touch pass measured **22.488 px** held travel and **+44.785/−44.785 px** committed exchange with no scroll. This is not represented as physical iPhone Safari proof.
- Trace and screenshots are in local `artifacts/match3-drag-preview/`. The browser trace includes DOM snapshots and screenshots while held and on release.
- Verification: focused UI **3/3**, cloud Match-3 Node **37/37**, cloud UI/token **9/9**, focused lint passed, and the 145-module production build passed. Final dev-branch deployment `dpl_4XS8iNjXw9yAvjG4ters36txHMmJ` is Ready. `https://dev.flipout.gizmogames.uk` returned HTTP 200 with identical HTML SHA-256 `96D36A9BF145EBB887ED34FE7B5C2BB9D942E3EC5AB4ED0390E93F8EA1320F38` and entry `assets/index-CgoQHe9q.js`. Production was not touched.

## Audio, navigation and avatar catalogue polish â€” 19 July 2026

- **Status: Working in Preview.** Automated UI tests now set both `fo_music` and `fo_sfx` to `off`, set a test-only audio guard, mock HTML media playback, pause/reset created media during cleanup, and restore the prior audio preferences/flag afterward. Runtime UI and legacy SFX paths honour the guard; the deployed Match-3 verifier runs in an isolated audio-off context and explicitly pauses any media before closing.
- Bottom navigation now has exactly five `minmax(0, 1fr)` columns with column flow, safe-area padding, clipped overflow protection, responsive icon/label sizing and a narrow-phone 360px rule. It cannot wrap to a second row.
- The only avatar catalogue is an explicit 12-item list mapped to `public/images/avatars/clash-*.webp`. Onboarding and profile picker read that same list; promo, locked and placeholder slots are no longer rendered. New server submissions reject legacy/UI asset IDs. Existing Preview IDs such as `starter-1` retain a display alias (for example, to `clash-badger`) rather than losing their portrait.
- Starter collection is **not implemented**. `src/data/starterCollectionPolicy.js` records an unconfigured future contract: random Common cards across all active themes, no fixed deck and exactly one random Foil Common. The card count remains `null` until approved.
- Pack opening is **not implemented**. `src/ui/packOpeningFlow.js` provides only a reusable phase/data contract for enlarge, turn, tear, open, deal, fan and individual/reveal-all actions; it cannot buy, grant or reveal cards.
- Verification: Node **122 passed / 11 Preview-only skipped**; UI **47 passed**; focused lint passed with zero errors/warnings on changed files; production build passed (146 modules). Full `App.jsx` lint remains blocked by four existing unrelated `react-hooks/set-state-in-effect` errors in its legacy multiplayer/query flow; no unrelated refactor was made.
- Ready Preview: `https://flip-sgk5t9cs0-chattocal.vercel.app` (`dpl_4ZPfe5W6EbLsPNtbB9Mfw5W6Xe5C`). `https://dev.flipout.gizmogames.uk` returned HTTP 200 with byte-identical HTML and ETag `"1d0b0e5573ca0a445cb6cc2a06eb6032"`; both served `/assets/index-6JlVFdzD.js`. Deployed Match-3 drag regression passed: desktop held movement **32.125px**, exchange **+63.865/−63.865px**; 390×844 touch held movement **22.488px**, exchange **+44.785/−44.785px**, no scroll; the authoritative board resolved from 18 to 17 moves. Physical iPhone Safari remains a human-device check. Production was not touched.
## Booster pack opening animation — 19 July 2026

- **Status: implemented for Preview; purchase and card grants remain deliberately disabled.** The approved supplied strip is the sole visual source. It is deterministically partitioned as its actual 5×2 source grid, tightly alpha-bounded, centred on 512×512 transparent canvases and exported to `public/ui/booster-animation/booster_01.webp` through `booster_10.webp`. The manifest records each exact source slice and content bounds; no art was regenerated.
- `BoosterPackOpening` uses those images as reference poses while CSS GPU transforms physically present the pack through appear, enlarge, lift, turn, settle, tear, open, deal and wrapper-uncover stages. The wrapper exits downward; five card positions then fan procedurally with staggered transform/rotation and a finish bounce. Images are preloaded before the action becomes available.
- Each card uses a transform-only vertical-axis flip. Players can reveal cards in any order or use the sequential Reveal All queue. Foil profiles are modular (purple/gold smoke, sparkles, glow, bloom, haptic duration and sound hook); collection-completion interruptions pause after the last reveal and resume through a supplied callback. The Preview entry point is an explicitly non-economic Shop preview control: it uses sample cards and does not buy, grant, persist or reveal inventory.
- Reduced/off motion shortens or removes non-essential movement while retaining the sequence and semantic status. Safe-area overlay sizing, keyboard-focusable card buttons and touch-friendly controls are included. Desktop browser and small touch viewport automation remain to be run against the deployed Preview; physical Android Chrome and iPhone Safari acceptance still requires device checks.
- Local verification: asset test **1/1**, new pack-opening UI tests **3/3**, full Node suite **123 passed / 11 expected Preview-only skips**, full UI suite **50/50**, focused lint clean, production and Preview builds passed (149 transformed modules). Production was not touched.
- Preview deployment `dpl_7XrzvFkJsbmdg83KEVhAkTCTuEjF` is Ready at `https://flip-m65t6opwe-chattocal.vercel.app`. Both that URL and `https://dev.flipout.gizmogames.uk` returned HTTP 200, served identical HTML and `assets/index-DecrUWih.js`; `booster_01.webp` returned `200 image/webp` (22,026 bytes). Browser automation reached the current Preview avatar onboarding, but its existing avatar-save step did not complete, preventing Shop navigation. This is recorded as a pre-existing verification block; it does not affect the local component/UI tests. Android Chrome and iPhone Safari still require physical-device acceptance. Production was not touched.

## Approved themed booster-opening replacement — 19 July 2026

- **Status: Working in Preview as a non-economic presentation.** The old ten-frame regular-grid interpretation is superseded. The newly approved `768×1376` transparent source sheet is retained privately under `assets/source/booster-opening/themed/` and deterministically detected as an irregular **3 / 3 / 3 / 2** layout with eleven visual groups.
- `public/ui/booster-opening/themed/` now contains `booster-open-01.webp` through `booster-open-11.webp`, each a visually-lossless alpha WebP on an identical `640×640` canvas with a shared `(320,320)` registration point and no per-frame scaling. Frame 10 explicitly includes the detached curved wrapper remnant; Frame 11 is the approved five-card fan pose.
- `BoosterPackOpening` uses these as key poses. CSS 3D `translate3d` / `rotateY` motion bridges front → edge → rear, wrapper opening and wrapper exit; five independent blue/red/green/purple/gold cards emerge stacked and then use staggered procedural transforms into the final fan. Individual reveal and Reveal All remain transform-only vertical flips; already revealed cards cannot flip twice.
- A Preview-only visual inspector is at `https://dev.flipout.gizmogames.uk/?dev=booster-opening`. It exposes one frame at a time, Previous/Next, autoplay, speed, centre crosshair, canvas/register point and the exact source alpha/crop coordinates. It is not a player route and does not purchase, roll, grant, persist or alter inventory.
- Receipt support is presentation-only: a `receiptId` marks a confirmed server-owned result as reopenable, while this client component never selects or grants cards. Secure booster purchase/receipt endpoints remain intentionally unimplemented.
- Verification: full local suite **124 Node passed / 11 expected Preview-only skips** and **50 UI passed**. New assets/UI tests cover 11-frame ordering, alpha, uniform canvas, Frame 10 remnant, neighbour-crop separation, timing, fan, individual reveal, Reveal All, interruption and reduced motion. Focused changed-file lint passed. The production and Preview Vite builds both passed with **152 transformed modules**. Running lint over the entire legacy `App.jsx` still reports four pre-existing multiplayer/query `react-hooks/set-state-in-effect` errors outside this package.
- Ready Preview: `dpl_6mi6fKuPFTg6EyTE9w32zWRGLJDZ` (`https://flip-modjhhhfr-chattocal.vercel.app`). The permanent development URL returned HTTP 200, served `assets/index-ChIs5IAc.js`, the 11-frame manifest, Frame 10 as `image/webp`, and the Preview-only review route. Vercel confirms the hostname aliases this Preview deployment. Production was not touched. Physical Android Chrome and iPhone Safari visual acceptance remain human-device checks.

## Economy, Theme Albums, Exchange, Rewards and Achievements design update — 20 July 2026

- **Status: recorded design direction only.** No implementation, schema migration, balance change, test run or deployment was performed.
- The approved direction replaces broad Collection ownership with permanent per-Theme Album placement: booster cards enter Inventory first; players explicitly **Stick in Album** or keep them tradeable/shreddable. Personal Albums are separate organisational folders (maximum ten; 500 Coins to create). Normal/Foil completion awards permanent Bronze/Silver/Gold Collector achievements.
- It also supersedes several current systems: Exchange commission becomes 20%; Recycler becomes Coin-producing any-five normal / individual-Foil shredding; Match-3 becomes 10 Coins plus a verified optional advert double; advert revives are removed in favour of a disclosed three-attempt Coin revive wheel; Reward Theatre is every fifth Match-3 completion.
- The current architecture can support this additively, but existing Recycler, Match-3 reward, continuation, broad collection read model and 10% Exchange settlement do **not** yet comply. The dependency-first plan and explicit unresolved Coin source/sink policy are recorded in `FLIPOUT_DESIGN_DIRECTION.md`.

## Theme Album ownership boundary - 20 July 2026

- **Status: implemented and verified in Preview.** Additive migration `014_theme_albums.sql` creates immutable official Theme Album entries, collector-achievement records and idempotent album transaction receipts.
- New service `api/_themeAlbums.js` implements the server-authoritative **Stick in Album** mutation. It validates the card catalogue, rejects collector/gold/non-card items, decrements exactly one unbound Inventory copy, inserts one permanent slot and returns duplicate-safe receipts for interrupted retries. A reused transaction ID with different input is rejected; a filled slot cannot be filled again.
- `api/_foActions.js` exposes action `stick-in-album`. `api/_playerState.js` now returns `themeAlbums.entries` and `themeAlbums.collectors`. `src/ui/collectionData.js` counts stuck normal Theme Album entries as collected without treating them as Inventory quantity, recyclable stock or tradeable stock.
- Collector completion support is data-driven by variable Theme size. Bronze is granted when the normal Theme is complete; Silver/Gold logic exists in the server boundary, but Foil sticking is deliberately rejected until authoritative Foil inventory item definitions exist. This prevents a base card from being falsely stuck as a Foil.
- Verification: focused Theme Album/Collection Node tests **10 passed / 1 Preview DB skip** locally; focused Collection UI tests **8 passed**; changed-file lint passed; full local suite **129 Node passed / 12 expected Preview-only skips** and **50 UI passed**; production build passed with **152 transformed modules**. Preview migration `014_theme_albums.sql` committed at `2026-07-20T00:07:32.319Z` against Railway Preview `railway/public` on `yamanote.proxy.rlwy.net`; focused remote verification passed **11/11** with no skips, including the new Preview DB stick/retry/account-isolation test. Final Preview deployment `dpl_3M3Uzqbjwk89718krBfbAnwWYbWt` is Ready at `https://flip-p36h9raqr-chattocal.vercel.app`; `https://dev.flipout.gizmogames.uk` returned HTTP 200, served `assets/index-CA3iEtWW.js`, and the bundle contains `1.6.0-theme-albums`. Production was not touched.
- Note: the first all-tests remote migration deployment applied the migration successfully but failed after that on the pre-existing Vercel packaging omission of `android/app/src/main/java/uk/gizmogames/flipout/MainActivity.java` in `tests/mobile-ux.test.js`. The final focused Theme Album verification deployment avoids that unrelated Android packaging blocker.
- Remaining risks: Personal Albums are not implemented; Inventory capacity is not enforced; boosters do not yet grant cards to Inventory; Recycler/Exchange still rely on Inventory quantities and have not yet been upgraded to the new shredding/20% fee rules; Foil item definitions remain the blocker for real Silver/Gold collector completion.

## Personal Album ownership boundary - 20 July 2026

- **Status: implemented and verified in Preview.** Additive migration `015_personal_albums.sql` creates organisational Personal Albums, card membership rows and idempotent album creation receipts.
- New service `api/_personalAlbums.js` implements album creation at **500 Coins**, enforces the **10 album** limit, validates names with the shared suitability/profanity/reserved-name filter and spends Coins through the existing tamper-evident Coin ledger. A retry with the same normalised name returns the same album; a transaction ID reused for a different name is rejected.
- Personal Album card membership is deliberately organisational only: adding a card requires that the card is currently in Inventory, but it does **not** decrement quantity, bind the card, change Theme completion, affect Recycler eligibility or create ownership. Remove is idempotent. The Collection read model exposes `personalAlbumIds` per card and `personalAlbums` metadata.
- `api/_foActions.js` exposes `create-personal-album`, `add-personal-album-card` and `remove-personal-album-card`; `api/_playerState.js` now returns Personal Album state.
- Verification: focused local Personal Album/Collection/Nickname Node tests **17 passed / 1 Preview DB skip**; changed-file lint passed; full local suite **134 Node passed / 13 expected Preview-only skips** and **50 UI passed**; production build passed with **152 transformed modules**. Preview migration `015_personal_albums.sql` committed at `2026-07-20T00:34:00.384Z`; focused remote verification passed **18/18** tests with no skips, including the new Preview DB test for one-time Coin charge, retry, card add/remove and no Inventory binding. Final Preview deployment `dpl_6ccL6Ax8ruuTcQ4EsaygnxnKbyoy` is Ready at `https://flip-e5h8vfaq9-chattocal.vercel.app`; `https://dev.flipout.gizmogames.uk` returned HTTP 200, served `assets/index-kPR7Ipt_.js`, and the bundle contains `1.7.0-personal-albums`. Production was not touched.
- Remaining risks: Personal Albums currently operate through API/read-model only; no production Collection UI controls have been added yet. Foil membership remains rejected until authoritative Foil inventory item definitions exist. Inventory capacity, booster grants, Recycler rewrite and Exchange upgrade remain future milestones.

## Inventory capacity boundary - 20 July 2026

- **Status: implemented and verified in Preview.** Commit `e9659ae` adds the additive migration `016_inventory_capacity.sql`, service `api/_inventoryCapacity.js`, shared reward-boundary enforcement in `api/_gameServices.js`, player-state readback in `api/_playerState.js`, Collection model readback in `src/ui/collectionData.js`, focused tests and `vercel.inventory-capacity-verify.json`.
- Inventory capacity defaults to **1,000 card slots** and can be configured through `FO_INVENTORY_CARD_CAPACITY` or per-player `fo_player_inventory_settings.card_capacity`. Only `card` and `card_variant` inventory quantities count. Official Theme Album entries do not count because they no longer remain in `fo_player_inventory`.
- Positive card grants now pass through one controlled boundary: `applyReward()` calls `enforceCardInventoryCapacity()` before changing Inventory. Non-card item grants, card spends/removals and currencies are unaffected. The capacity check serialises on the player account row before locking/counting Inventory rows, preventing brand-new accounts with no existing card rows from racing past capacity under concurrent grants.
- Local verification passed: focused Inventory/Collection tests **10 passed / 2 expected Preview DB skips**, focused changed-file lint passed, full local suite **137 Node passed / 15 expected Preview-only skips** and **50 UI passed**, and production build passed with **152 transformed modules**.
- Focused Preview verification deployment `dpl_25Up7bWqFHdTdKTwuihHWM991L52` is Ready at `https://flip-i960o2j5u-chattocal.vercel.app`. Its build command ran `node scripts/run-economy-migration.mjs --apply`, then `node --test tests/inventory-capacity.test.js tests/inventory-capacity-db.test.js tests/collection-data.test.js`, then `vite build`.
- Preview migration output targeted Railway Preview `railway/public` at `yamanote.proxy.rlwy.net` with `VERCEL_ENV=preview`; migration `016_inventory_capacity.sql` committed at `2026-07-20T01:31:19.497Z`. The table `fo_player_inventory_settings` and primary key index `fo_player_inventory_settings_pkey` were present in the verification output.
- Focused remote verification passed **12/12** tests with no skips, including over-capacity rejection, non-card item grant allowance, duplicate retry handling and concurrent card-grant serialisation.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200, served the same ETag `"2e3dd0f773c9aa762d8f80c044472f14"` and `assets/index-Bpenq1xH.js` as the focused Preview URL, and the bundle contains `1.8.0-inventory-capacity`. Production was not touched.
- Note: earlier focused deploy attempts were temporarily stuck in Vercel `QUEUED` state and were removed before the final successful verification deployment. A Git-triggered Preview build also reached Ready first but used the default app build only; it was superseded by the focused verification deployment above.
- Remaining risks: capacity controls are server/API/read-model only; no Collection UI has been added yet to display current capacity. Booster grants are still disabled, so this boundary is prepared for future booster implementation rather than exercised by live purchase/opening flows.

