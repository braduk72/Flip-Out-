# Match-3 gameplay completion pass

Date: 19 July 2026. Scope: Match-3 rules, presentation and verification only. No Coin, Star, reward, purchase, inventory, Exchange or other economy values were changed.

## Implemented mechanics

- Four in a row creates a directional row/column clearer.
- Five or more in a row creates a colour bomb.
- T, L and cross matches create wrapped specials.
- Flip-Out's enabled 2x2 square rule now creates a wrapped special.
- Multiple non-overlapping special patterns can be created in one resolution.
- A single swapped row, column or wrapped special activates even without a normal match.
- Special combinations have distinct deterministic rules: line + line, line + wrapped, wrapped + wrapped, colour + token, colour + line, colour + wrapped and colour + colour.
- Special damage recursively triggers other specials. Crates, ice, chains, falling objects and existing objectives continue through the same damage/gravity path.
- Cascades retain a hard 50-step guard and now expose cleared cells, triggered/created specials, patterns, multiplier, score gain and feedback labels.
- Cascade scoring uses 1.0x, 1.5x, 2.0x and onward multipliers. Special creation and activation have explicit score bonuses. Level definitions were not changed.
- Existing saved `bomb` pieces are normalised to `wrapped`, and version-1 sessions gain version-2 combo/stat defaults when next resolved.

## Presentation and responsiveness

- The React board remains server-authoritative: it animates the submitted swap while waiting, then displays only the server-returned state and cascade events. Client prediction was not added.
- Added deterministic presentation mapping and bounded move timing: full motion is capped at 1,500 ms; reduced motion uses 180 ms; motion-off resolves immediately.
- Added combo/score callouts, clear particles, line beams, wrapped explosion rings, colour washes, board reactions, special creation/trigger animations, selected/swap feedback and subtle tile/board idle motion.
- Added distinct row, column, wrapped and colour visual treatments; improved haptic patterns for selection, normal resolution, cascades and special combinations.
- Added safe-area-aware portrait layout, compact landscape reflow, tablet scaling, 320 CSS-pixel handling, keyboard grid navigation, screen-reader announcements and reduced-motion suppression of non-essential effects.

## Compatibility

- All 20 existing level definitions, objective fields, blockers, drops and power-up names are unchanged.
- The Match-3 server endpoint and session/action schema are unchanged; richer state is stored inside the existing JSON state.
- The fixed 30/60 Star completion flow is unchanged. Match-3 still grants no Coins.
- Previous balancing results are no longer a final baseline because square matching, combination coverage and scoring are now broader. No level was silently rebalanced during this pass.

## Exact verification

- Focused gameplay/auto-player/presentation: **39 passed, 0 failed**.
- Full Node suite: **103 discovered; 95 passed, 0 failed, 8 expected Preview-database skips**.
- UI suite: **19 passed, 0 failed** across 5 files.
- Seed sweep: **20,000 boards** (1,000 seeds × 20 levels), zero initial matches, zero dead starts, 1–33 legal moves, average 12.004.
- Synthetic performance, 200 sessions: average board generation **0.469 ms**; average move resolution **0.583 ms**; average multi-cascade move **0.613 ms** across 49 samples; post-GC heap delta **+166,968 bytes**.
- Focused changed-file lint: passed with zero findings.
- Repository-wide source lint: failed on **38 pre-existing errors and 8 warnings** in unrelated prototype files. They were not changed in this package.
- Production build: passed, 134 modules. Match-3 route **16.23 KB / 5.75 KB gzip JS** and **15.88 KB / 4.56 KB gzip CSS**; main JS **422.05 KB / 132.47 KB gzip**.
- Preview build: passed with the same output sizes.
- Local Preview HTTP smoke: **200**, 2,780-byte HTML, root element present.

## Remaining human/device work

- Feel, audio balance, browser vibration and gesture comfort require real iPhone/Android playtesting; automated tests cannot establish subjective satisfaction.
- The new mechanics change solver outcomes. Rerun full per-level objective-aware balancing batches before making any further level-data adjustments.
- Server round-trip time remains the main source of perceptible input delay. This pass masks it with a swap-intent animation but intentionally does not predict board results.

## Development deployment

- Gameplay commit: `5a22617` on `dev`; pushed to `origin/dev`.
- Vercel Preview: `dpl_L161cZ7Cqze89qSuKWj9dhkbJmwZ`, status **Ready**, generated URL `https://flip-2eu7zba78-chattocal.vercel.app`.
- Permanent development URL: `https://dev.flipout.gizmogames.uk` returned HTTP 200 and exactly matched the generated deployment HTML and ETag `"212649fb4030ca11368d5d1bd3488c6c"`.
- The served entry bundle reported `1.2.0-match3-gameplay` and contained the deployed square, Rainbow Nova and Triple Cross rules. The lazy Match-3 chunk returned HTTP 200.
- Vercel target was `preview`. No database migration ran, `origin/main` remained `157344e5f6deaaa6540418c514448a976753688c`, and no production deployment was changed.

## Files affected

- `src/match3/engine.js`
- `src/match3/presentation.js`
- `src/screens/Match3.jsx`
- `src/screens/Match3.module.css`
- `src/utils/match3Analytics.js`
- `src/version.js`
- `tests/match3-engine.test.js`
- `tests/match3-presentation.test.js`
- Match-3 and project state reports listed below.
