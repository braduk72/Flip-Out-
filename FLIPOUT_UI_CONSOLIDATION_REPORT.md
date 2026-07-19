# Flip-Out UI Consolidation Report

Date: 19 July 2026  
Application version: `1.3.0-ui-consolidation`  
Environment: development / Vercel Preview only

## Outcome

Every route reachable from the application now uses the approved Concept 4D visual language. The legacy Season map and unused prototype components were removed. Game boards keep their mechanic-specific artwork, but their surrounding headers, panels, controls, dialogs, typography, spacing and navigation now use the shared system.

## Route audit

| Route or flow | Consolidation result |
|---|---|
| Home | Retained as the canonical Concept 4D reference. |
| Collection | Rebuilt from the plain inventory prototype with shared panels and state views. |
| Rewards | Wheel presentation retained; route shell, action control and canonical navigation applied. |
| More / Settings | Recast as the More hub, with Settings, Leaderboard and Coin Store access. |
| Shop / Coin Store | Legacy red/maroon surfaces and inconsistent controls replaced with shared navy, cyan and purple treatment. |
| Exchange | Rebuilt from the plain marketplace prototype with shared cards, rows and state views. |
| Leaderboard | Shared header, panels, typography and canonical navigation applied. |
| About, Privacy, What’s New | Shared information-page shell and navigation applied. |
| Avatar and deck selection | Shared headers, cards, spacing and interaction targets applied. |
| Match-3 journey, brief, game and result | Prototype level grid replaced; gameplay-specific board retained inside the shared route language. |
| Memory Match, Gauntlet and round intro | Scenic/stage prototype shells removed; shared panels, controls and dialogs applied. |
| Reveal setup and game | Shared setup shell and controls applied; reveal artwork remains part of the mechanic. |
| Multiplayer lobby and game | Lobby prototype styling replaced; gameplay shell aligned with shared controls. |
| Match-3 token review | Development route uses the same safe-area and typography contract. |

## Removed legacy UI

- Deleted the old Season map route, component and CSS. Season progress may still be shown as information but the map cannot be opened.
- Deleted unused `AdBanner`, `DailyBonus` and `SpecialOffer` prototype components and their CSS.
- Removed old image-based back buttons, scenic `home-bg.jpg` use, game-show stage decoration and dead stage styles.
- Replaced the former custom bottom bar with the reusable four-destination Home / Collection / Rewards / More navigation.
- Replaced application and gameplay confirmation overlays with shared modal primitives.
- Removed Arial-family declarations and standardised on Atkinson Hyperlegible for body copy and Nunito Sans for display/action text.

## Shared contract

`src/ui/route-consolidation.css` provides the responsive route shell, safe-area handling, headers, panels, rows, form controls, touch targets and abstract Concept 4D background. Existing reusable primitives remain the source for buttons, badges, card panels, loading/error/empty states, dialogs and bottom navigation.

All production screen roots are covered by the consolidation contract. Static UI tests reject a reintroduced Season map, legacy stage/back assets, non-canonical navigation or a screen that does not opt into the route language.

## Verification

- Production build: passed; 137 modules; main JS 404.62 kB / 127.85 kB gzip; main CSS 87.46 kB / 17.92 kB gzip.
- Full local tests: 100 passed, 0 failed, 8 Preview-database tests skipped because local database credentials were not present.
- UI tests: 25 passed, 0 failed across 6 files.
- Preview database command: 8 skipped, 0 failed for the same missing local credentials; no database mutation occurred.
- Focused lint: 0 errors and 4 existing gameplay hook-dependency warnings in `Game.jsx` and `RevealGame.jsx`.
- Browser checks: 390×844 phone, 320×568 small phone and 1024×768 tablet layouts checked for horizontal overflow and touch targets. No fixed 390×844 application frame remains.

## Remaining risks

- Physical-device checks are still required for real cut-outs, VoiceOver, TalkBack, browser-specific font scaling and native haptics.
- Local Vite Preview cannot exercise Vercel API routes; Collection and Exchange error states were visually checked locally, while live data requires the deployed development environment.
- Some information/legal copy reflects earlier product wording. That is content review debt, not a remaining legacy visual system.
- The four hook warnings belong to existing gameplay effect orchestration. They were not changed during this UI-only consolidation because doing so could alter mechanics.

## Preview deployment

- Commit `0aea330` was pushed from `dev`; `main` remained unchanged at `157344e5f6deaaa6540418c514448a976753688c`.
- Vercel deployment `dpl_GhFqJfGYz7THYAPYiCankgZxpQKX` reached Ready with target `preview`.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 from Vercel and served HTML identical to the generated Preview deployment.
- The permanent URL served `/assets/index-BEnrUUXJ.js` (404,621 bytes) containing `1.3.0-ui-consolidation`.
- Vercel domain verification returned `configured_correctly`, attached and verified with no issues or conflicts.
- No database migration, production branch, production domain or production deployment was changed.

## Files affected

The detailed diff covers `src/App.jsx`, the reachable `src/screens/*` route components and modules, shared overlays/navigation in `src/components/*`, global route styling in `src/ui/route-consolidation.css`, `src/version.js`, and UI contract tests in `tests-ui/*`.
