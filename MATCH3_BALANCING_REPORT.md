# Flip-Out Match-3 balancing and device-preparation report

Date: 18 July 2026. Scope: deterministic auto-play, structured balancing, performance, development feedback, device-test preparation and route-level code splitting. Preview/development only; production was not touched.

Final ready Preview: `https://flip-ocz8184ts-chattocal.vercel.app`. HTTP smoke test returned page 200 and unauthenticated Match-3 API 401.

## 1. Auto-player strategies

`src/match3/autoplayer.js` plays the real pure engine until win, loss or a configurable safety limit.

- **random-legal:** deterministically selects from all legal moves using the run seed.
- **greedy-score:** simulates every legal move and chooses immediate score, cleared cells, cascades and specials.
- **objective-aware:** adds weighted progress for score, collection, blockers and drops, values downward drop movement, specials and cascades, and avoids moves with no comparative objective benefit.

Configured power-ups are optional. Near the move limit it can use Hammer, Colour Clear or Line Blast; Extra Moves can resume a loss. Inventory is copied per simulation and usage is reported. Default balance runs use no power-ups so level viability is not hidden by consumables.

## 2. Simulation methodology

All runs use the production rules module, deterministic level/run seeds based at `20260718`, full legal-move enumeration and a `moves + 20` safety limit. Raw reproducible outputs are `match3-baseline.json`, `match3-tuned.json` and `match3-final-simulation.json`.

The unchanged baseline ran 100 seeds × 20 levels × 3 strategies = 6,000 full games in 106.847 seconds. The final set repeated the same 6,000 games in 119.770 seconds; an intermediate objective-aware pass added 2,000 games. This is 14,000 full games total. A 1,000-per-level-per-strategy run was not practical in this local pass: measured throughput projects roughly 20 minutes for 60,000 full games and exceeded the tool's bounded interactive window. The raw runner supports `--runs 1000` for unattended execution. At 100 runs, win-rate sampling uncertainty is material (roughly ±10 percentage points near 50%), so these results are directional rather than final human targets.

Provisional target assignment: levels 1–3 Tutorial, 4–7 Easy, 8–13 Medium, 14–19 Hard, and 20 Showcase. Target bands are Tutorial 85–98%, Easy 70–90%, Medium 45–75%, Hard 20–50%, Showcase 10–35% objective-aware wins.

## 3. Per-level final results

Win columns are Random / Greedy / Objective-aware. Moves, remaining moves, score, longest cascade and bottleneck use objective-aware runs.

| Level | Target | Win R/G/O | Avg moves | Win moves left | Avg score | Longest cascade | Main bottleneck | Observed |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | Tutorial | 100/100/100% | 1.9 | 16.1 | 2,458 | 7 | — | above target |
| 2 | Tutorial | 72/99/100% | 7.1 | 12.9 | 8,369 | 8 | — | above target |
| 3 | Tutorial | 82/100/99% | 5.4 | 13.7 | 6,486 | 6 | Moon collection | above target |
| 4 | Easy | 47/90/94% | 4.8 | 9.8 | 5,402 | 9 | blockers | above target |
| 5 | Easy | 15/55/85% | 10.5 | 8.8 | 12,029 | 8 | blockers | within target |
| 6 | Easy | 100/100/100% | 3.6 | 18.4 | 4,630 | 8 | — | above target |
| 7 | Easy | 10/96/96% | 14.4 | 8.9 | 15,209 | 10 | Leaf collection | above target |
| 8 | Medium | 28/86/94% | 7.2 | 7.2 | 7,057 | 7 | blockers | above target |
| 9 | Medium | 2/10/9% | 27.4 | 6.6 | 21,439 | 8 | drops | below target |
| 10 | Medium | 93/100/100% | 5.6 | 16.4 | 7,310 | 9 | — | above target |
| 11 | Medium | 6/38/76% | 14.7 | 6.9 | 16,125 | 9 | blockers | just above target |
| 12 | Medium | 0/0/1% | 30.0 | 1.0 | 23,203 | 9 | drops | below target |
| 13 | Medium | 82/100/100% | 6.9 | 16.1 | 8,438 | 10 | — | above target |
| 14 | Hard | 16/75/76% | 10.5 | 7.3 | 10,796 | 10 | blockers | above target |
| 15 | Hard | 86/100/98% | 7.5 | 8.6 | 7,692 | 9 | Star collection | above target |
| 16 | Hard | 2/4/13% | 30.7 | 10.3 | 24,273 | 9 | drops | below target |
| 17 | Hard | 9/96/94% | 17.0 | 8.5 | 19,874 | 11 | Gem collection | above target |
| 18 | Hard | 25/75/83% | 11.4 | 7.9 | 11,990 | 7 | blockers | above target |
| 19 | Hard | 0/0/0% | 34.0 | 0.0 | 24,644 | 10 | drops | below target |
| 20 | Showcase | 0/6/4% | 33.4 | 14.5 | 23,820 | 8 | drops | below target |

Median moves, failure-reason counts, power-up use, dead-board shuffle totals and average cascade counts remain in the raw JSON to keep this table readable. Moves exhaustion is the dominant failure reason. Default simulations used no power-ups. Dead-board shuffle events were rare and safely recovered.

## 4. Levels changed

No layout, blocker placement or teaching purpose was replaced. One field per level was changed from the baseline where data showed a large mismatch:

- L1 score 900→1,500.
- L4 moves 20→14; L5 21→18.
- L6 score 1,600→3,500; L7 Leaf target 16→22.
- L8 moves 22→14; L9 24→28.
- L10 score 2,300→6,000; L11 moves 24→20; L12 25→30; L13 score 3,000→7,000.
- L14 moves 25→16; L15 24→16; L16 27→32.
- L17 Gem target 20→30; L18 moves 28→18; L19 28→34; L20 30→34.

Levels 2 and 3 were retained. These are development tuning values, not final player targets.

## 5. Before-and-after objective-aware win rates

| Level | Before | After | Change |
|---:|---:|---:|---:|
| 1 | 100% | 100% | 0 |
| 2 | 100% | 100% | 0 |
| 3 | 99% | 99% | 0 |
| 4 | 98% | 94% | −4 |
| 5 | 94% | 85% | −9 |
| 6 | 100% | 100% | 0 |
| 7 | 100% | 96% | −4 |
| 8 | 99% | 94% | −5 |
| 9 | 7% | 9% | +2 |
| 10 | 100% | 100% | 0 |
| 11 | 86% | 76% | −10 |
| 12 | 0% | 1% | +1 |
| 13 | 100% | 100% | 0 |
| 14 | 95% | 76% | −19 |
| 15 | 99% | 98% | −1 |
| 16 | 12% | 13% | +1 |
| 17 | 100% | 94% | −6 |
| 18 | 99% | 83% | −16 |
| 19 | 0% | 0% | 0 |
| 20 | 4% | 4% | 0 |

The changes successfully moved levels 5 and 11 close to/inside their bands and reduced several blocker levels without wholesale replacement. Simple move increases did not correct the drop levels, so no larger silent rebalance was attempted.

## 6. Remaining difficulty concerns

Drop layouts are the clear structural bottleneck. Levels 9, 12, 16, 19 and 20 need human observation plus focused solver work before further data edits. Several score/collection teaching levels remain too easy for their assigned bands because cascade scoring is generous. Objective-aware versus random gaps are very large on blockers/collections; this may be healthy teaching value, but it also means this solver is not a proxy for new players. No provisional band should be treated as a final player promise.

## 7. Performance measurements

`node --expose-gc scripts/measure-match3-performance.mjs 200` reported:

- Average board generation: 0.149 ms.
- Average move resolution: 0.232 ms.
- Average multi-cascade move resolution: 0.231 ms across 48 samples.
- Post-GC heap change after 200 sessions: −746,720 bytes; no retained growth was detected in this synthetic pass.
- Full objective-aware simulation costs substantially more because it resolves every candidate move: final aggregate average was 19.962 ms per full simulated game across strategies, with raw pre-GC heap growth 88,147,264 bytes during the process.

These engine timings are well below a frame; network time, not board calculation, is the likely perceptible component.

## 8. Preview API latency

`node scripts/measure-preview-match3.mjs https://flip-50nkykbvb-chattocal.vercel.app` created a fresh anonymous guest, started level 20 and measured ten real authoritative moves:

- Session start: 1,314.2 ms.
- Average move API latency: 707.4 ms.
- Median: 731.3 ms.
- Range: 579.6–943.2 ms.

That delay is perceptible for every move and is roughly three thousand times the local 0.232 ms rules calculation. Client prediction is technically justified if real-device tests reproduce it, but was deliberately not implemented in this package. First measure from UK mobile devices and inspect whether regional server/database placement can reduce the delay; prediction adds reconciliation complexity and should follow that infrastructure check. One earlier ten-move attempt coinciding with the database verification load hit Railway's known intermittent connection error; no result was concealed or counted.

## 9. Bundle-size changes

Before splitting, the Preview produced one 501.09 KB JS entry (152.69 KB gzip) and 160.69 KB CSS (31.33 KB gzip), with Vite's >500 KB warning.

After lazy-loading Match-3, Game, Shop, Lucky Spin, Inventory, Marketplace and Reveal Game under a shared Suspense fallback, the verified Preview produced:

- Main JS: 390.07 KB / 121.27 KB gzip (−111.02 KB / −31.42 KB gzip).
- Main CSS: 99.39 KB / 20.09 KB gzip.
- Match-3 route: 14.46 KB / 4.89 KB gzip JS and 4.35 KB / 1.45 KB gzip CSS.
- Largest lazy route is Game: 47.27 KB / 13.03 KB gzip JS and 35.11 KB / 7.83 KB gzip CSS.
- Database-verification Preview built in 960 ms; the final report/code Preview built in 2.11 seconds. Neither emitted the prior chunk-size warning.

## Verification summary

- Local full suite: 87 tests, 79 passed, 0 failed, 8 Preview-only skipped, 517.213 ms.
- Focused Match-3/code-split suite after final changes: 30 tests, 29 passed, 0 failed, 1 Preview-only skipped, 565.133 ms.
- Preview full database suite: 87/87 passed, 0 failed, 0 skipped, 45,674.814 ms.
- Package-focused lint: passed. Repository-wide source lint still reports 61 pre-existing legacy errors and 11 warnings outside this package; these were not broadly edited.
- Production-mode local and Preview builds: passed. Preview page/API smoke results are recorded with the final URL below.

## 10. Manual real-device checklist

The executable checklist is `MATCH3_REAL_DEVICE_CHECKLIST.md`. It covers iPhone portrait/landscape, iPad, Android phone/tablet, 320 CSS pixels, touch, swipe, tap selection, mouse, keyboard, refresh/resume, power-ups, pause/retry/quit and long-session observations.

The development-only in-game feedback panel exports local JSON containing device/browser, screen/orientation, level/result/moves, power-ups, input method, animation setting, 1–5 difficulty, control problems, clarity problems and notes. It uploads nothing and accepts no name, email or account identifier.

## 11. Accessibility checks still requiring humans

VoiceOver and TalkBack reading order/activation, 200% text scaling, modal focus/back behaviour, real reduced-motion behaviour, colour-filter clarity, physical keyboard focus and practical touch sizes on actual devices remain human checks. Automated code cannot validate speech quality, gesture conflicts or perceived clarity.

## 12. Single best next task

Run the real-device checklist on at least one iPhone and one Android phone while concentrating on drop levels 9, 12, 16, 19 and 20. Use exported feedback plus recorded move traces to determine whether the problem is layout/rules or solver planning. Only then make a second, focused drop-object tuning pass.
## Gameplay-rules baseline notice — 19 July 2026

The gameplay completion pass added 2x2-square matches, complete T/L/cross handling, recursive special combinations and revised combo scoring without changing any level definition. The simulation tables in this report therefore describe the previous engine and must not be treated as current difficulty measurements. A fresh full-level simulation should be the next data step before any level tuning. See `MATCH3_GAMEPLAY_COMPLETION_REPORT.md` for exact implementation and verification results.
