# Flip-Out Concept 4D Home implementation report

## Mobile UX addendum — 19 July 2026

The Home foundation now follows the project-wide phone portrait/tablet adaptive orientation policy. Runtime safe-area variables cover cut-outs, rounded corners, system bars and gesture insets. Phone-landscape styling was removed; unsupported web orientation locking uses an accessible portrait guard.

The promotional carousel is a native momentum-scrolling snap viewport with autoplay, labelled indicators and controls below the art. Daily Reward is a stable pending button backed by the authenticated authoritative grant, with immediate duplicate-tap protection and a Safari-safe timezone fallback. Coarse-pointer controls have a 44 x 44 CSS-pixel floor. See `FLIPOUT_MOBILE_UX_REPORT.md` for exact verification and remaining physical Safari/Android checks.

Application/API verification used Ready Preview `dpl_JAn3NGNQJSLttPuV2x5krL5JwWD2` at the permanent URL. The real API test granted a disposable guest exactly 50 Stars once and treated the immediate repeat as a duplicate. Physical Safari and Android hardware checks remain required because this Windows environment provides Chromium only and has no JDK/Xcode toolchain.

Date: 19 July 2026. Environment: development and Vercel Preview only. Production was not targeted.

## Outcome

The approved Concept 4D Home is implemented as the new responsive Home screen. It is assembled from reusable design-system components and independent asset layers, not a flattened mock-up. Match-3 remains the dominant action and its preview is driven by the real deterministic Match-3 engine. Memory Match, AI/Season/Gauntlet and existing routes remain reachable without giving them equal Home-screen weight.

## Assets created

- Original vector layers: compact Flip-Out logo, player avatar frame, purple/gold Play frame, hero panel frame, promotional frame, progress frame and sparkle layer.
- Original 128×128 SVG Match-3 tokens: sun, moon, leaf, drop, star and gem.
- Original 1,600×720 WebP promotional artwork: Coin Store, Community/Event and Collection/Foil. These contain no baked text, price or protected character artwork.
- Reusable inline-vector icon family for currencies, Coin Store, navigation, collection, foil, season, status and controls.
- Full file/status detail: `UI_ASSET_MANIFEST.md`.

## Reusable React components created

`SafeAreaHeader`, `PlayerSummary`, `CurrencyCounter`, `CoinStoreButton`, `PromoCarousel`, `Match3Preview`, `PrimaryPlayButton`, `ProgressCard`, `CollectionPreviewCard`, `FoilProgressCard`, `SeasonProgressCard`, `DailyRewardCard`, `BottomNavigation`, `Modal`, `Badge`, `ProgressBar`, `IconButton`, `CardPanel`, `LoadingState`, `ErrorState` and `EmptyState`.

The theme source is `src/ui/tokens.css`; components and motion/audio helpers are under `src/ui/`; Home composition is isolated in `src/screens/Home.jsx` and `Home.module.css`.

## Data and navigation integration

- Header identity and Stars/Coins come from the authenticated player-state API. Client balance values are display-only.
- Match-3 level/resume state comes from the existing Match-3 API.
- Collection summary uses authoritative inventory and item catalogue records.
- Foil progress does not invent items: it visibly reports unavailable until authoritative foil variants exist.
- XP/level components exist but show an honest unavailable state because the backend has no authoritative XP/level fields yet. Existing development-only local values remain compatible.
- Home checks Daily Reward availability without auto-claiming. Only an explicit Claim action calls the authoritative reward service.
- Coin Store, Match-3, Memory Match, Gauntlet, Online, Pass & Play, Reveal, Collection, Rewards, Settings/More, avatar and Season callbacks all route to existing systems.

## Animation and lifecycle

- Logo shimmer, currency count-up, Coin glint, timed/swipe carousel, pause/resume control, Play breathing glow/shine/press response, controlled sparkles, progress transitions, foil treatment and panel entrances are implemented.
- `Match3Preview` creates a seeded board with the production engine, chooses legal moves, resolves swaps/cascades and pulses special pieces. It is non-interactive and grants nothing.
- Preview and decorative motion pause when the page is hidden and stop or quiet in system Reduced Motion and the design-system Reduced/Off modes.
- No screen relies on animation or colour alone to communicate status.

## Audio and haptics

Named audio events exist for `buttonPress`, `carouselChange`, `coinStoreOpen`, `playActivation`, `sparkle` and `match3PreviewCascade`. They use clearly temporary Web Audio tones behind `src/ui/audio.js`; no audio is claimed final. The preview never starts sound automatically. Play has a small optional vibration hook; native-quality iOS/Android haptics remain future device work.

## Responsive and accessibility implementation

- Removed the fixed 390×844 frame/bezel assumption; the app now uses the available `100dvh`/`100svh` viewport.
- Header and navigation use runtime `safe-area-inset-*` values. Header content remains fixed while Home content scrolls.
- Explicit contracts cover 320px phones, common/tall phones, tablets and a compact landscape fallback.
- Touch actions are at least 44×44 CSS pixels; primary interactive controls are generally 48px or larger.
- Keyboard navigation, visible focus, semantic landmarks/labels, dialog focus management/Escape, live progress semantics, forced-colour borders, scalable type and colour-independent labels are present.

Automated viewport contracts cover 320px, the phone breakpoint, 768px tablets, landscape rules, safe-area variables and target sizes. Browser visual inspection was blocked by the browser privacy rule. Human checks are still required on real iPhone/Android cut-outs, VoiceOver, TalkBack, 200% text, physical landscape and native haptics.

## Verification before deployment

- Focused UI suite: **15 passed, 0 failed** across four files.
- Existing Node suite: **87 discovered; 79 passed, 0 failed, 8 Preview-database tests skipped** because no local `DATABASE_URL` was present.
- Focused lint over the new UI, Home integration, touched player/reward API helpers, tests and Vite configuration: **passed with 0 errors and 0 warnings**.
- Production build: **passed in 1.49 seconds**, Vite 8.0.13, 128 modules. Main JS **412.01 kB / 129.33 kB gzip**; main CSS **95.44 kB / 20.15 kB gzip**. Match-3 remains a separate **10.99 kB / 3.88 kB gzip** lazy chunk.
- Preview build: **passed in 1.80 seconds** with the same output.
- Local built-app HTTP smoke: **200** at the development preview server.
- Automated accessibility scan: **passed** for the rendered Home fixture, with colour-contrast measurement excluded only because jsdom cannot compute layout/paint contrast.

Two transient verification events were retained for accuracy. One combined run reported the existing `platform-identity.test.js` process as failed without an assertion; the file then passed **7/7** in isolation and the final full run passed. One attempt launched production and Preview builds simultaneously against the same `dist` directory and Preview correctly failed with `ENOTEMPTY`; both required sequential builds then passed with the results above. Neither event required application-code changes.

## Preview deployment and remote verification

- Commit `c4e34bc` was pushed from `dev` to `origin/dev`; production branch `main` was not changed.
- Permanent development URL: `https://dev.flipout.gizmogames.uk`.
- DNS: CNAME `dev.flipout.gizmogames.uk` → `39622341da5cfe42.vercel-dns-016.com`, TTL 60.
- HTTPS: **200**, Server `Vercel`, Last-Modified `Sun, 19 Jul 2026 00:37:21 GMT`, ETag `"76dfb8a66ab3338e7fd8ab136b6d027f"`.
- Current entry bundle: `/assets/index-BYVmyWFx.js`, **412,286 bytes**, HTTP 200. It contains `1.1.0-ui4d`, matching `src/version.js` and this deployment.
- Runtime assets verified at HTTP 200 with the exact shipped byte sizes: logo 1,651-byte SVG; Coin Store promotion 160,782-byte WebP; Match-3 star token 734-byte SVG.
- Unauthenticated `/api/fo-player-state` returns the expected **401**, confirming the server boundary is present.
- Vercel CLI inspection maps the permanent hostname to Ready Preview deployment `dpl_Agvh9BKAVH1DCdzYP5pMMbvcjbDb` (`https://flip-6ji7jlyxe-chattocal.vercel.app`), target `preview`, created 19 July 2026 at 01:41:40 BST. Domain verification returns `configured_correctly`, attached and verified, with no issues or conflicts.
- The Preview database suite rerun was attempted twice but could not execute against the database. A pulled sensitive placeholder caused **7 DNS failures / 1 skip** before any connection was made; `vercel env run` then correctly supplied `VERCEL_ENV=preview` but withheld the sensitive `DATABASE_URL` and HMAC secret, so all **8 DB files skipped**. Vercel metadata confirms both secrets exist with Preview scope (`DATABASE_URL` is restricted to branch `dev`) but does not expose their values. No database mutation occurred; the complete prior-package database verification remains the recorded evidence.
- Browser-based responsive screenshots were attempted at the exact permanent URL but blocked by a user-level browser privacy rule. Automated responsive/safe-area tests pass; real visual viewport judgement remains a human/device check and is not concealed as complete.

## Remaining placeholders and risks

- Real XP/level schema and final player avatar content are absent; the UI does not fabricate them.
- Authoritative Foil definitions/assets do not yet exist.
- Audio tones and web vibration are temporary.
- The three Home promotion families are production-ready, but campaign-specific Demonica/Angelica/holiday art remains future live-ops content.
- Real-device safe-area, VoiceOver/TalkBack, text scaling, colour-vision and native performance judgement still require Brad/devices.
- `npm install` reports 16 transitive audit findings (1 low, 6 moderate, 9 high). They were not auto-fixed because that could cause unrelated dependency changes; production dependency exposure needs a separate review.
- The main bundle remains below Vite’s 500 kB warning threshold, but the shared App orchestration is still a future optimisation target.

## Files affected by this UI package

- Assets: `public/ui/**`.
- Design system: `src/ui/**`.
- Home: `src/screens/Home.jsx`, `src/screens/Home.module.css`.
- Integration: `src/App.jsx`, `src/index.css`, `src/version.js`, `src/utils/gameApi.js`, `api/_playerState.js`, `api/_gameServices.js`, `api/_foRewards.js`, `vite.config.js`.
- Tests/config: `tests-ui/**`, `vitest.config.js`, `package.json`, `package-lock.json`.
- Reports: this file, `UI_ASSET_MANIFEST.md`, `FLIPOUT_CURRENT_STATE.md`, `FLIPOUT_DESIGN_SYSTEM.md`, `FLIPOUT_COMPLETION_REPORT.md`.

## Next screen boundary

No additional screen was redesigned. The design-system implementation is now ready to be extended deliberately, and the approved next screen package remains the Match-3 gameplay screen—not Reward Theatre, Collection, Exchange or Shop in parallel.

## Consolidation completion — 19 July 2026

The former next-screen boundary has now been superseded by Brad's approved full consolidation pass. Every reachable route uses the Concept 4D language, Collection and Exchange are no longer plain prototypes, More is the canonical secondary hub, and the old Season map is removed. The shared route contract is in `src/ui/route-consolidation.css`; route regression coverage is in `tests-ui/route-consolidation.test.js`. Full details and verification are recorded in `FLIPOUT_UI_CONSOLIDATION_REPORT.md`.

## Collection 2.0 — 19 July 2026

The Collection route has moved beyond the consolidation shell into its permanent core experience. Albums, sets, cards, search, filters, missing/owned states, account-scoped favourites, recent acquisitions, statistics and milestone progress now use the shared Concept 4D primitives. The supporting pure presentation model is `src/ui/collectionData.js`; the full record is `FLIPOUT_COLLECTION_2_REPORT.md`.
