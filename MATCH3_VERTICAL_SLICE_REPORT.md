# Flip-Out Match-3 vertical slice

## Revives addendum - 20 July 2026

Match-3 loss continuation now uses Coin-only Revives: 25 Coins at 75%, 50 Coins at 50%, then 100 Coins at 25%. The server spends Coins, rolls odds and stores the revive outcome in authoritative session state; duplicate action IDs do not charge twice. The loss modal presents the cost/odds and spinner and no longer offers advert or Extra Moves continuation. No level balance or Match-3 board rules changed.

Verification: focused local Node 37 passed / 1 Preview-only skip, focused Match-3 UI 4/4 passed, aggregate `npm test` Node 158 passed / 18 Preview-only skips and UI 60/60 passed. Vercel Preview `dpl_A1obk4oMo5mLvruXJzY8RxpSm5UV` at `https://flip-c4wrhmp54-chattocal.vercel.app` passed the live Preview DB revive spend/idempotency test during its 38/38 Node verifier run, and `https://dev.flipout.gizmogames.uk` serves the same build with `1.17.0-revives`. Production was not touched.

## Reward Theatre addendum - 20 July 2026

Match-3 completion now surfaces Reward Theatre eligibility after every five completed levels. The server owns milestone detection, commits the prize through a stable claim ID, writes Coin prizes through the authoritative Coin ledger, and returns deterministic reel metadata for the client animation. The UI result screen can spin animated reels only after the committed reward exists; presentation cannot reroll or upgrade the prize.

Verification: focused Reward Theatre/Foundation Node 14/14 passed, toolkit UI 6/6 passed, aggregate `npm test` Node 158 passed / 17 Preview-only skips and UI 59/59 passed. Vercel Preview `dpl_2Djfty34rSmqeSyQqDWV4xivzvcB` at `https://flip-otq5c9ry4-chattocal.vercel.app` passed remote Preview DB Reward Theatre tests 15/15, and `https://dev.flipout.gizmogames.uk` serves the same build with `1.16.0-reward-theatre`. Production was not touched.

## Gameplay completion addendum — 19 July 2026

The engine now supports four/five, T, L, cross and enabled 2x2-square special creation; all single-special activations; seven distinct special pairings; recursive chain reactions; richer deterministic cascade/combo scoring; and legacy `bomb` compatibility. The server-authoritative React board now renders bounded swap/resolution timing, combo labels, particles, beams, explosion rings, colour effects, special/idle animations and motion-aware haptics without client prediction. All 20 level definitions and the 30/60-Star reward path are unchanged. Exact results and files are in `MATCH3_GAMEPLAY_COMPLETION_REPORT.md`.

The prior difficulty percentages below predate square matching and the expanded scoring/combination rules. They remain historical evidence, not current balance claims; no silent level retuning was performed in this pass.

## Balancing-tool follow-up — 18 July 2026

The next development package added deterministic random, greedy-score and objective-aware full-level players; reproducible aggregation; provisional band comparison; 14,000 baseline/intermediate/final simulation games; a development-only local feedback export; a real-device checklist; engine/memory/API performance tools; and route-level code splitting. Small one-field level adjustments were recorded rather than replacing the level set. Drop levels remain the principal unresolved bottleneck. Final balancing Preview: `https://flip-ocz8184ts-chattocal.vercel.app`. See `MATCH3_BALANCING_REPORT.md` and `MATCH3_REAL_DEVICE_CHECKLIST.md`.

Date: 18 July 2026. Environment: local development and Vercel Preview only. Production was not accessed or deployed.

## 1. Playable features

The new mode is a playable 8×8, six-token Match-3 game. It supports tap selection, pointer swipes, mouse, keyboard arrows plus Enter/Space, invalid-swap rejection, matches, cascades, refill, deterministic starts, dead-board detection/shuffle, scoring, moves, objectives, win/loss, pause, restart, quit confirmation and interruption resume. Memory Match, AI, Season and Gauntlet remain available and were not redesigned.

Special pieces are line clearers from four in a line, colour clearers from five, and area bombs from T/L intersections. Special-to-special swaps and colour-special behaviour are resolved by the pure engine. Symbols, patterns and special markers distinguish pieces without relying only on colour. Rendering is immediate; reduced-motion CSS removes motion and also supplies the instant test presentation.

## 2. Screens and routes added

- Main-screen `PLAY MATCH-3` entry.
- Match-3 level map/development selector.
- Pre-level objective briefing.
- Play board with objective, score, move and power-up controls.
- Win panel with server-returned Stars and advert-double attempt.
- Loss panel with inventory-backed Extra Moves, retry and map exit.
- Local resume cache plus authoritative server-session resume.

## 3. Engine architecture

`src/match3/engine.js` is rendering-free and shared by the client and backend. It owns generation, match runs, legal moves, swaps, special creation/activation, blocker damage, gravity, refill, drops, cascade limits, objective evaluation and power-up application. `src/match3/levels.js` owns immutable token metadata, 20 level definitions and validation. React only displays server-returned state and sends intent actions.

The consolidated `/api/fo-game?service=match3` boundary owns start, move, restart, power-up, completion and advert-double actions. Each session and action belongs to the authenticated guest/platform account. `fo_match3_actions.action_id` provides replay safety and the session row is locked before mutation.

## 4. Level format and content

There are 20 development levels with `id`, board dimensions, move count, objective array, optional teaching text, holes, drops and data-driven blocker placements/layers. The curve introduces score, token collection, crates, ice, line specials, chains, double crates, falling objects, colour clearers, area bombs and mixed showcase objectives. `validateMatch3Levels()` rejects duplicate IDs, invalid targets/tokens, missing objectives and out-of-range cells.

## 5. Power-ups and blockers

Hammer, Shuffle, Line Blast, Colour Clear and Extra Moves are catalogue items under `powerup:match3-*`. The server checks account inventory and consumes exactly one inside the same transaction as the board mutation. Invalid targets are rejected before consumption; repeated action IDs return the original result. `MATCH3_UNLIMITED_POWERUPS=true` works only outside Vercel Production.

Crates support one or two layers and block swaps/falls. Ice overlays a token, chains prevent movement until damaged, and holes are unusable. Adjacent matches damage crates; matching/clearing covered tokens damages ice and chains. Drop objects follow gravity and leave through usable bottom exits.

## 6. Stars integration

A won server session grants exactly 30 Stars with transaction ID `match3-complete:<sessionId>`. Repeated or concurrent completion calls cannot duplicate the grant. The client supplies no reward amount and Match-3 never grants Coins. A verified `match3-double` advert completion grants one further 30 Stars, making exactly 60. With no provider configured, verification returns unavailable and grants nothing.

## 7. Tests and exact results

- Local full suite: 75 tests, 67 passed, 0 failed, 8 Preview-only skipped, 765.838 ms.
- Match-3 engine: 17/17 passed after final corrections.
- Vercel Preview full database suite: 75 passed, 0 failed, 0 skipped, 177,635.496 ms.
- Preview Match-3 integration covered retry-safe start/move, exactly-once power-up inventory, forged advert rejection, duplicate/concurrent completion, exact 30-Star base and exact 60-Star verified total.

The database fixture sets a session to a won state to isolate completion-ledger testing; live clients have no API that can make that direct database mutation.

## 8. Simulation results

`node scripts/simulate-match3.mjs 100` validated 2,000 boards (100 seeds across all 20 levels): zero starting matches, zero dead starts, 1 minimum legal move, 33 maximum, 11.85 average. Cascade resolution has a hard 50-step loop guard. A 500-seed run exceeded the local 60-second command window rather than returning a game-rule failure.

## 9. Migration, build and lint

Additive migration `009_match3_vertical_slice.sql` committed to PostgreSQL database `railway`, schema `public`, Vercel Preview at `2026-07-18T18:29:52.884Z`. It adds `fo_match3_sessions`, `fo_match3_actions`, `fo_match3_progress`, their primary/foreign/check constraints, and player/session indexes. Verification output confirmed all three tables and indexes.

Focused Match-3 source/API/test lint passed with no findings. Local production-mode build passed after the final swipe correction: 123 modules, 498.59 KB JS/151.98 KB gzip and 160.69 KB CSS/31.33 KB gzip in 1.12 seconds. The database-verification Preview built in 912 ms; the final code Preview built 123 modules, 501.09 KB JS/152.69 KB gzip and 160.69 KB CSS/31.33 KB gzip in 1.58 seconds. Vite warns that the main JS chunk is just over 500 KB. The database-verification Preview page returned HTTP 200 and its unauthenticated Match-3 API returned HTTP 401. Final ready Preview: `https://flip-ky8oc33rz-chattocal.vercel.app`.

## 10. Temporary assets used

Tokens use CSS colours, patterns and Unicode shape symbols. Existing Tiebreaker artwork is a temporary catalogue thumbnail for all five Match-3 power-ups. No purchased, generated or automatically cropped final artwork was added.

## 11. Missing graphics and audio

Final circular collectible-art token crops, bespoke blocker/power-up art, special-piece effects, cascade/celebration animations, Match-3 sound effects and native haptic patterns remain absent. Reward Theatre was not implemented and cannot alter results.

## 12. Manual mobile checks required

Test pointer capture/swipes, 320 px portrait layout, landscape/tablet layout, VoiceOver/TalkBack grid navigation, physical keyboard focus, colour/contrast, reduced motion and browser vibration on real devices. Native haptics and rewarded adverts are not claimed complete; both need real SDK/provider configuration and signed-device testing.

## 13. Known balancing concerns

- The 20 levels are development demonstrations, not proven difficulty-balanced content.
- The solver validates board starts and move availability but does not yet play entire levels to estimate completion probability; impossible objective tuning still needs automated play and human sessions.
- Server-authoritative moves add one network round trip per move; animation prediction/reconciliation may be desirable later.
- The loss continue UI uses the server-authoritative consumable boundary via Extra Moves. Advert/coin continuation policy for Match-3 is not exposed because no advert provider exists.
- Only one latest active session is resumed automatically. A session-history/abandon UI is postponed.
- Analytics are development-local event objects and session-state audit markers, not invasive tracking.

## 14. Single best next task

Run structured real-device playtesting and add a deterministic auto-player that estimates win rate and move pressure for every level. This should come before final art or more levels because it will expose rule/UI defects and turn the demonstration curve into measurable, testable balance data without changing the economy boundary.
## Gameplay animation correction addendum — 19 July 2026

The vertical slice now separates authoritative resolution from presentation. Server-returned cascades drive bounded swap, invalid-return, fall/refill, shuffle, special, clear, particle, combo and score effects. Input is guarded during only the necessary request/presentation window, with interruption recovery and reduced-motion timing. Verification passed 37/37 Node tests, 8/8 UI/token tests, focused lint and the 145-module production build. Preview: `https://flip-azm52xj8g-chattocal.vercel.app` (`dpl_922goAdpMUfRjaCig1WEL81n9gtc`).

## Real-device repair revision — 19 July 2026

The current revision adds explicit swap offsets, pointer capture and drag handling rather than relying on board replacement plus scale effects. Preview `https://flip-4lw572b7k-chattocal.vercel.app` (`dpl_3tH1ZE26TtJ7ugCUA4pbQ1F5dy7H`) passed 37/37 Node tests, 8/8 UI/token tests and production build. Real-device/browser trace acceptance remains outstanding.

## Visible drag correction and deployed trace — 19 July 2026

The preceding repair statement was source-level only and is superseded here. The board still lacked an `onPointerMove` render path, so a held token could not follow a pointer even though release could submit a move. The permanent idle animation also controlled `transform`. The fix adds captured-pointer drag state, per-frame CSS-variable transforms, neighbour preview, full opposite-cell release transforms, invalid return, click suppression and a Preview-only diagnostic overlay. No engine, level, reward or economy values changed.

An Edge test ran against the deployed Preview and measured the tile before pointer-down, halfway while the button remained held, immediately after release while the request was deliberately held for observation, and after authoritative settlement. Mouse results were 32.125 px held source motion, −6.905 px neighbour preview and +63.865/−63.865 px committed exchange; pointer capture and threshold both reported active, scroll remained zero, and the legal move settled to 17 moves. A 390×844 Chromium touch-input pass recorded 22.488 px held motion, +44.785/−44.785 px exchange and no page scroll. Physical iPhone Safari remains a manual acceptance item.

Preview `https://flip-lyw0sei3q-chattocal.vercel.app` (`dpl_4XS8iNjXw9yAvjG4ters36txHMmJ`) is Ready. Cloud verification passed 37/37 Node tests and 9/9 UI/token tests; focused lint and the production build passed. The permanent development URL served the identical HTML and `assets/index-CgoQHe9q.js` entry. Trace JSON, four desktop frames, two mobile-touch frames and `browser-trace.zip` are stored under `artifacts/match3-drag-preview/` locally.
