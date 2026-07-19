# Flip-Out UI Production Asset Inventory

> **Historical planning inventory:** this Phase 2A gate was completed by the Concept 4D implementation on 19 July 2026. Runtime truth and final statuses now live in `UI_ASSET_MANIFEST.md`; entries below preserve the pre-implementation requirements and must not be read as current asset availability.

## Status and scope

This is the Phase 2A production asset plan for the approved Flip-Out interface. It is an inventory and production specification only. It does not authorise React, CSS, screen or asset-generation work.

Canonical references:

- `FLIPOUT_DESIGN_SYSTEM.md` defines the permanent **Midnight Collector** visual language.
- Final Concept 4D Home defines the approved hierarchy: safe-area fixed Player Header, compact Flip-Out logo, promotional carousel, live Match-3 preview, signature purple Play control, meaningful progress and Home / Collection / Rewards / More navigation.
- Maurice, Sprocket, scenic backgrounds and mascot-dependent branding are not part of the Home asset set.

The final Concept 4D image is a flattened concept reference. It is **GENERATED**, not a production atlas, and no component may crop UI pieces from it.

## Status definitions

| Status | Meaning |
|---|---|
| **READY** | A verified production file exists, or the visual is deliberately code-native and needs no external image. |
| **NEEDS CREATION** | The production asset is specified but no acceptable source file exists. |
| **GENERATED** | A generated concept/candidate exists but has not been converted into an approved production asset. |
| **PLACEHOLDER** | A file exists or is currently used, but is obsolete, inconsistent, broken, unverified or not suitable for the approved design. |

## Production rules

- Dimensions below are source or SVG view-box dimensions, not fixed screen placement. Components remain responsive.
- Prefer SVG with `currentColor` for icons and geometric UI. Prefer transparent WebP/AVIF for textured illustration. Retain editable masters outside the runtime bundle.
- Bitmap masters must remain sharp at 3× their largest intended phone display size. Supply responsive derivatives only after their actual placements are implemented and measured.
- Essential text, prices, balances, progress, reward quantities, countdowns and interaction states must never be baked into artwork.
- Animated assets are layered. Motion is performed with CSS/WAAPI or Canvas unless a separate animation runtime is approved later. No Rive or Lottie runtime currently exists in the repository.
- Every animation must have Full, Reduced and Off behaviour as defined in the design system.
- One colour-adjustable vector should serve dark and light surfaces where possible. A separate variant is required only when an illustration cannot maintain contrast.
- Promotion art must reserve a text-safe region and tolerate responsive cropping from narrow phone to tablet.
- All production assets require source provenance, licence/ownership, export settings, alt-text intent and a named owner before being marked READY.

## Repository asset findings

- `public` and `src` currently contain **1,093 visual files**: 1,085 WebP, 2 JPG, 2 PNG and 4 SVG.
- There are no production font files and no Rive or Lottie animations.
- `public/icons/icon-*.webp` contains the previous comic-burst Flip-Out mark. It does not match the approved logo treatment and is a PLACEHOLDER.
- `public/images/coin.webp` is a 64 × 64 paw Coin. The approved economy requires a neutral, traceable Coin identity and this image is a PLACEHOLDER.
- `public/images/profile_badge_transparent.webp` is a 1,254 × 1,254 panel with a paw emblem and baked `PROFILE` text. It cannot be a reusable Player Header component and is a PLACEHOLDER.
- `public/images/menu/*` provides Home, Shop, Ranks and Settings bitmaps. The approved navigation is Home, Collection, Rewards and More, so the set is a PLACEHOLDER.
- `src/screens/Match3.jsx` renders prototype emoji/symbol tiles and `Match3.module.css` supplies the tile materials. No production Match-3 tile set exists.
- `src/data/itemCatalog.js` points all Match-3 power-ups at the same legacy `tiebreaker.webp`; those mappings are PLACEHOLDER.
- The 743 files in `public/images/cards` provide substantial legacy card content, but framing, crop consistency, provenance, foil compatibility and final collection styling have not been audited. They remain PLACEHOLDER for the redesigned Collection.
- `public/images/gizmo_games.webp` is not an image: its 80 bytes contain a Git error message. It is a broken PLACEHOLDER and must not be copied into the new asset pipeline.
- Existing full-screen Home stills, mascot art, scenic maps and image-based buttons are not building blocks for the approved responsive UI.

## 1. Branding

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `reference/home-concept-4d` | Canonical visual reference only | Concept master | Bitmap | None; never ship or crop | Unique reference | No | **GENERATED** |
| `brand/flipout-logo-primary.svg` | Compact header wordmark | 600 × 240 view box; intended display about 104–132 × 42–54 | Vector | Static; optional separate ambient halo | Reusable | Dark-UI and light-background colourways | **NEEDS CREATION** |
| `brand/flipout-mark.svg` | Small brand mark, favicon and compact identity | 128 × 128 view box | Vector | Static | Reusable | One contrast-safe mark plus monochrome | **NEEDS CREATION** |
| `brand/app-icon-master.png` | iOS, Android and PWA launcher source | 1,024 × 1,024 | Bitmap master | None | Unique brand source | Standard and maskable safe-area composition | **NEEDS CREATION** |
| `public/icons/icon-48…512.webp` | Current PWA icon exports | 48–512 square | Bitmap | None | Reusable legacy set | No | **PLACEHOLDER** |
| `brand/player-avatar-fallback.webp` | Neutral automatic guest/player avatar | 512 × 512 transparent | Bitmap | Optional 160 ms arrival fade only | Reusable | One neutral version | **NEEDS CREATION** |
| `brand/player-avatar-frame.svg` | Reusable Player Header avatar ring and states | 128 × 128 view box; 56–72 display | Vector | Selected/level-up edge pulse; static in Reduced/Off | Reusable | Semantic `currentColor` accents | **NEEDS CREATION** |
| `brand/player-level-badge.svg` | Level number badge attached to avatar/header | 64 × 64 view box; 28–36 display | Vector | Short level-up glow only | Reusable | One token-driven vector | **NEEDS CREATION** |
| `fonts/nunito-sans-*.woff2` | Display and heading typography | Subset WOFF2, required weights 700/800/900 | Font vector outlines | None | Reusable | Not applicable | **NEEDS CREATION** |
| `fonts/atkinson-hyperlegible-*.woff2` | Body, controls and accessible labels | Subset WOFF2, weights 400/600/700 | Font vector outlines | None | Reusable | Not applicable | **NEEDS CREATION** |

## 2. Buttons

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `buttons/signature-play-frame.svg` | Purple/gold visual signature around Play Match-3 | 720 × 240 view box; fluid, minimum 72 logical height | Vector | Slow sheen, restrained breathing rim; static luminous edge in Reduced/Off | Reusable only for flagship play | Dark UI only | **NEEDS CREATION** |
| `buttons/signature-play-highlight.svg` | Clipped highlight mask for Play animation | 1,024 × 256 | Vector mask | 2.4–3.2 s non-blocking sweep; hidden in Reduced/Off | Reusable only with signature frame | No | **NEEDS CREATION** |
| Standard Primary / Secondary / Store / Danger surfaces | Shared component fills, borders and shadows | Fluid; minimum 48 logical height | Code-native CSS | Press 80–120 ms; pending state stable in size | Reusable | Token-driven | **READY** |
| Icon-button surface | Back, close, add, info, overflow and carousel controls | 48 × 48 hit area; 20–24 glyph | Code-native CSS | Press response only | Reusable | Token-driven | **READY** |
| Button focus/selected/disabled layers | Accessible state treatment | Inset/outline follows control bounds | Code-native CSS | No looping motion | Reusable | Semantic tokens | **READY** |
| Loading spinner | Pending purchases, claims and saves | 24 × 24 inside stable button | Vector/CSS | Rotation in Full; stepped indicator in Reduced; text status in Off | Reusable | `currentColor` | **READY** |
| Legacy image buttons (`play*.webp`, `btn_*.webp`, `*_button.webp`) | Existing baked-label controls | Mixed, including 700 × 269 Play sources | Bitmap | Mixed | Legacy only | No | **PLACEHOLDER** |

## 3. Panels

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| Standard Card Panel | Default content container | Fluid; 16 px radius; 16–24 px internal padding | Code-native CSS | Optional 160–220 ms arrival/press only | Reusable | Token-driven | **READY** |
| Hero Panel | Match-3, featured event and major reward frame | Fluid; 24 px radius | Code-native CSS/SVG border | Subtle active edge; static in Reduced/Off | Reusable | Dark-first tokens | **READY** |
| Progress Panel | Collection, Foil, Season and milestone rows | Fluid; minimum row height 72 | Code-native CSS | Value/fill change only | Reusable | Token-driven | **READY** |
| Promotional Carousel panel shell | Swipeable promotion surface with crop-safe art slot | Fluid 20:9–16:9; minimum 160 logical height | Code-native CSS | Slide/fade with user control; no auto-motion in Reduced/Off | Reusable | Dark-first tokens | **READY** |
| Dialog / alert surface | Confirm, warning, error, purchase and transaction status | Fluid; max 560 logical width; 24 px radius | Code-native CSS | 160–220 ms fade/scale; fade only in Reduced | Reusable | Token-driven | **READY** |
| Bottom sheet surface and grab handle | Compact mobile choices and details | Fluid; max 720 logical width | Code-native CSS | 220 ms translation; fade in Reduced | Reusable | Token-driven | **READY** |
| Modal scrim | Separates blocking layers from content | Full viewport | Code-native CSS | 160 ms opacity; immediate in Off | Reusable | One semantic scrim | **READY** |
| Premium edge/noise mask | Prevents large flat panels feeling sterile without scenic art | 512 × 512 tileable alpha | Bitmap mask | Optional slow opacity drift; static in Reduced/Off | Reusable | One neutral alpha mask | **NEEDS CREATION** |

## 4. Navigation

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `nav/home.svg` | Home destination | 24 × 24 view box; 48 minimum hit | Vector | Active lift/glow; shape remains recognisable without colour | Reusable | Single `currentColor` vector | **NEEDS CREATION** |
| `nav/collection.svg` | Collection destination | 24 × 24 view box; 48 minimum hit | Vector | Same shared nav state motion | Reusable | Single `currentColor` vector | **NEEDS CREATION** |
| `nav/rewards.svg` | Rewards destination | 24 × 24 view box; 48 minimum hit | Vector | Same shared nav state motion | Reusable | Single `currentColor` vector | **NEEDS CREATION** |
| `nav/more.svg` | More destination | 24 × 24 view box; 48 minimum hit | Vector | Same shared nav state motion | Reusable | Single `currentColor` vector | **NEEDS CREATION** |
| Active destination indicator | Non-colour selected cue | 32–56 × 3 or icon halo | Code-native CSS | 160 ms move/fade; immediate in Reduced/Off | Reusable | Token-driven | **READY** |
| Notification dot/count badge | New or actionable destination state | 18–24 logical; dynamic text | Code-native CSS | One arrival scale only; never loops | Reusable | Semantic tokens | **READY** |
| `public/images/menu/nav_*.webp` | Current Home / Shop / Ranks / Settings navigation | 814–1,230 source pixels | Bitmap | None | Legacy only | Separate active bitmaps | **PLACEHOLDER** |

## 5. Icons

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| Core action set: back, close, add, chevrons, cart, overflow, info | Universal control actions | 24 × 24 view boxes; 48 hit areas | Vector | Shared press response only | Reusable | `currentColor` | **NEEDS CREATION** |
| Transaction set: buy, claim, restore, receipt, refund, pending | Economy actions and status | 24 × 24 view boxes | Vector | Pending icon may rotate; others static | Reusable | `currentColor` plus semantic accent | **NEEDS CREATION** |
| Status set: success, warning, error, offline, locked, new | Required component states | 20/24 × 20/24 view boxes | Vector | Success/error arrival once; no looping warning | Reusable | Semantic colour plus distinct shapes | **NEEDS CREATION** |
| Utility set: settings, sound, haptic, reduced motion, help, legal | More/settings controls | 24 × 24 view boxes | Vector | Static except toggled state | Reusable | `currentColor` | **NEEDS CREATION** |
| Time/event set: calendar, timer, season, community, announcement | Live events and promotion metadata | 24 × 24 view boxes | Vector | Optional one-shot state change | Reusable | `currentColor` | **NEEDS CREATION** |
| Collection set: card, album, booster, foil, milestone, duplicate | Collection status and filters | 24 × 24 and 48 × 48 view boxes | Vector | Foil shimmer only when materially relevant | Reusable | Rarity accents plus labels | **NEEDS CREATION** |
| Rarity glyphs: Common, Uncommon, Rare, Epic, Legendary | Required non-colour rarity cue | 20 × 20 view boxes | Vector | Static | Reusable | Token-driven | **NEEDS CREATION** |
| Accessibility/input set: touch, swipe, tap, keyboard, controller | Help and development feedback | 24 × 24 view boxes | Vector | Static | Reusable | `currentColor` | **NEEDS CREATION** |
| `public/images/icons/*.webp` | Prototype game-mode art | 600 × 815 or similar | Bitmap | None | Legacy Home only | No | **PLACEHOLDER** |
| `public/icons.svg` and `src/assets/{react,vite}.svg` | Social/source or starter-template symbols | Mixed | Vector | None | Not game UI | Mixed | **PLACEHOLDER** |

## 6. Currencies

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `currency/star.svg` | Earned-only Stars identity | 64 × 64 view box; 24–48 display | Vector | Gain bounce/glow once; static otherwise | Reusable | One contrast-safe vector | **NEEDS CREATION** |
| `currency/coin.svg` | Premium Coins identity | 64 × 64 view box; 24–48 display | Vector | Gain/spend confirmation once; no idle spin | Reusable | One contrast-safe vector | **NEEDS CREATION** |
| Currency counter background | Header and compact balance container | Intrinsic; minimum 48 logical height | Code-native CSS | Number change transition only; none in Reduced/Off | Reusable | Token-driven Star/Coin accents | **READY** |
| `currency/coin-pile-small.webp` | Small Coin Store bundle illustration | 512 × 512 transparent | Bitmap | Optional one-shot sparkle | Reusable | Dark-UI export | **NEEDS CREATION** |
| `currency/coin-pile-medium.webp` | Medium Coin Store bundle illustration | 768 × 768 transparent | Bitmap | Optional one-shot sparkle | Reusable | Dark-UI export | **NEEDS CREATION** |
| `currency/coin-vault-large.webp` | Largest bundle/premium offer illustration | 1,024 × 1,024 transparent | Bitmap | Optional lid/light layer, not required for Home | Reusable | Dark-UI export | **NEEDS CREATION** |
| `currency/coin-to-stars.svg` | Explicit one-way 1 Coin → 10 Stars conversion explanation | 320 × 96 view box; values remain live text | Vector | Directional highlight once; static in Reduced/Off | Reusable | Token-driven | **NEEDS CREATION** |
| `public/images/coin.webp` and `coins_*.webp` / `x*.webp` | Paw Coin and legacy purchase bundles | 64 square and mixed large sources | Bitmap | None | Legacy only | No | **PLACEHOLDER** |

## 7. Progress components

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| Progress track, fill and overflow states | XP, Collection, Foil, Season and event progress | Fluid; 8–16 logical height | Code-native CSS | Fill animates only after known value change; instant in Off | Reusable | Semantic token variants | **READY** |
| Segmented progress and milestone markers | Stages, streaks and discrete goals | Fluid; marker 12–20 logical | Code-native CSS | Completed segment confirmation once | Reusable | Token-driven | **READY** |
| Carousel pagination dots | Current promotion and total count | 8–12 dot, 44 high interaction region | Code-native CSS | 160 ms width/opacity; instant in Reduced/Off | Reusable | Token-driven | **READY** |
| `progress/xp.svg` | Player level/XP identifier | 48 × 48 view box | Vector | Level-up pulse once | Reusable | Star-blue accent | **NEEDS CREATION** |
| `progress/collection.svg` | Album completion and newest-card row | 64 × 64 view box | Vector | Optional one-shot milestone glow | Reusable | Token-driven | **NEEDS CREATION** |
| `progress/foil.svg` | Foil progress and Foil label | 64 × 64 view box | Vector | Material shimmer in Full only | Reusable | Must retain Foil label/cue | **NEEDS CREATION** |
| `progress/season.svg` | Season stage/progress row | 64 × 64 view box | Vector | Stage-complete pulse once | Reusable | Seasonal accent may decorate | **NEEDS CREATION** |
| Goal/milestone reward thumbnail frame | Shows the next actual reward without baked quantities | 96 × 96 view box; 48–72 display | Vector | Claimable glow only | Reusable | Rarity/semantic variants | **NEEDS CREATION** |

## 8. Match-3 assets

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `match3/tile-shell.svg` | Shared glossy tile depth, bevel and focus-safe silhouette | 96 × 96 view box | Vector | Swap/drop/settle performed by component | Reusable | Token-driven | **NEEDS CREATION** |
| Six base tile symbols | Distinct water, leaf, star, flame, sun/drop and gem identities | 64 × 64 view boxes | Vector | Idle sparkle only on preview; no constant board motion | Reusable | Shape plus colour variants | **NEEDS CREATION** |
| Special-piece set | Row clear, column clear, bomb, colour clear and objective token | 96 × 96 view boxes | Vector | Charge pulse and activation sequence; static Reduced/Off state | Reusable | Shape/icon distinguishes each | **NEEDS CREATION** |
| Blocker set | Crate, ice, chain/lock and layered blocker states | 256 × 256 transparent per state | Bitmap layers | Hit/break sequence; brief fade in Reduced | Reusable | No light variant | **NEEDS CREATION** |
| Objective set | Collect colour, clear blocker, drop token and score goal | 48 × 48 view boxes | Vector | Completion tick once | Reusable | Shape and label safe | **NEEDS CREATION** |
| Power-up set | Hammer, shuffle, line blast, colour clear and extra moves | 128 × 128 view boxes | Vector | Selected pulse and activation; static in Reduced/Off | Reusable | One token-driven set | **NEEDS CREATION** |
| Selection/focus frame and swap indicator | Clear tap, swipe and keyboard interaction | 112 × 112 frame; 64 × 32 arrow | Vector/CSS | Direction hint once; focus itself never pulses | Reusable | Focus token | **NEEDS CREATION** |
| Board well/grid | Responsive live board surface | Fluid square; 8 × 8 logical grid | Code-native CSS/Canvas | No independent motion | Reusable | Dark-first tokens | **READY** |
| Match/cascade/burst effects | Communicate match, cascade and special activation | 256 × 256 effect region | Canvas particles plus vector masks | 180–500 ms; simplified/removed in Reduced/Off | Reusable | Tile-colour variants | **NEEDS CREATION** |
| Foil tile/card shimmer mask | Rare preview flourish without changing reward state | 512 × 512 grayscale seamless mask | Bitmap mask | 1–1.4 s occasional sweep; static foil mark in Reduced/Off | Reusable | One neutral mask | **NEEDS CREATION** |
| Home preview choreography | Reproducible idle swap, small cascade and power-up pulse sequence | Data, no fixed visual size | Animation data | Plays only while visible; pauses off-screen/background; deterministic fallback | Unique Home behaviour, reusable engine | Not applicable | **NEEDS CREATION** |
| Existing emoji/CSS tiles and shared `tiebreaker.webp` power-up mapping | Current Match-3 prototype visuals | Runtime/CSS; 320 × 320 reused image | Mixed | Prototype only | Legacy | No | **PLACEHOLDER** |

## 9. Collection assets

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `collection/card-frame-base.svg` | Canonical card geometry, safe title and metadata areas | 768 × 1,024 view box | Vector | Flip handled by component | Reusable | Dark-first neutral base | **NEEDS CREATION** |
| Five rarity frame overlays | Common through Legendary border and non-colour cue | 768 × 1,024 view boxes | Vector | Legendary/Foil restraint only; static Reduced/Off | Reusable | Rarity variants | **NEEDS CREATION** |
| `collection/card-back.svg` | Canonical hidden/pack card back | 768 × 1,024 view box | Vector | Flip handled by component | Reusable | Seasonal decoration may overlay | **NEEDS CREATION** |
| Base card artwork masters | Actual collectible subjects | Preferred 1,024 × 1,024 crop-safe masters | Bitmap | None; component provides reveal | Unique per item | Optional art-specific contrast crop | **PLACEHOLDER** |
| Foil material mask and explicit Foil badge | Foil variant, independent of rarity | 512 × 512 mask; 64 × 64 badge | Bitmap mask + vector badge | Occasional shimmer in Full; static badge in Reduced/Off | Reusable | Neutral mask, token badge | **NEEDS CREATION** |
| Rare Foil material mask and badge | Higher foil treatment without relying on colour | 512 × 512 mask; 64 × 64 badge | Bitmap mask + vector badge | More complex but still restrained sweep; static cue otherwise | Reusable | Neutral mask, token badge | **NEEDS CREATION** |
| Album cover template | Collection/album identity and completion summary | 1,200 × 1,600 master | Bitmap art plus vector frame | Optional unlock reveal only | Reusable frame, unique cover art | No light variant | **NEEDS CREATION** |
| Booster pack shell and tear layers | Collectible booster product and eventual Theatre opening | 1,024 × 1,400 transparent layers | Bitmap | Tear/open sequence; static Reduced fallback | Reusable shell, skin-specific artwork | No light variant | **NEEDS CREATION** |
| Empty slot / missing card silhouette | Communicates not-owned state without fake artwork | 768 × 1,024 view box | Vector | None | Reusable | Token-driven | **NEEDS CREATION** |
| Duplicate/count badge | Stack count and duplicate ownership | 24–32 logical | Code-native CSS | Count-change confirmation once | Reusable | Semantic tokens | **READY** |
| Legacy 743-card library and `public/images/back.webp` | Existing content and square legacy back | Mostly 320, 400 or 1,254 square | Bitmap | Existing card flips | Existing modes | No formal variants | **PLACEHOLDER** |

## 10. Reward Theatre assets

These are inventory requirements only. Their inclusion does not authorise Reward Theatre implementation.

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| `theatre/common-stage.svg` | Shared reveal framing after server outcome is committed | 1,200 × 1,200 view box, responsive centre stage | Vector | Entrance, reveal and dismissal; Reduced/Off alternatives | Reusable | Skin tokens decorate | **NEEDS CREATION** |
| `theatre/reward-receipt-frame.svg` | Shows authoritative reward, quantity and claim status | 800 × 1,000 view box; live text slots | Vector | Reveal once; never rerolls | Reusable | Token-driven | **NEEDS CREATION** |
| Fruit Machine layered cabinet/reels/lights | Fruit Machine presentation | 1,536 × 1,536 layered transparent masters | Bitmap + vector controls | Reel stop sequence determined by committed outcome | Reusable presentation, skinnable | Skin variants | **NEEDS CREATION** |
| Scratch Card base and latex masks | Three-area themed scratch presentation | 1,024 × 1,536 base plus alpha mask | Bitmap | Pointer/touch erasure; reveal remains deterministic | Reusable layout, themed skins | Skin variants | **NEEDS CREATION** |
| Flip Card presentation set | Three-stage card reveal | Reuse 768 × 1,024 Collection geometry | Vector + item bitmap | Flip sequence only | Reusable | Skin accents | **NEEDS CREATION** |
| Ducks presentation sprites | Select/reveal duck presentation | 512 × 512 per idle, selected and reveal layer | Bitmap layers | Float/select/reveal; reduced static selection | Reusable presentation, skinnable | Skin variants | **NEEDS CREATION** |
| Treasure Chest states | Atomic multi-reward bundle presentation | 1,024 × 1,024 closed/open/glow layers | Bitmap layers | Open once after committed bundle | Reusable, skinnable | Skin variants | **NEEDS CREATION** |
| Booster presentation layers | Pack reveal presentation | Reuse 1,024 × 1,400 Collection pack layers | Bitmap layers | Tear, fan and reveal; reduced sequential fade | Reusable, skinnable | Skin variants | **NEEDS CREATION** |
| Prize Wheel segments, rim and pointer | Wheel presentation using unchanged reward odds | 2,048 × 2,048 wheel plus 256 pointer | Vector + bitmap skin layers | Server outcome selects stop; no client reroll | Reusable, skinnable | Skin variants | **NEEDS CREATION** |
| Presentation skin overlay packs | Classic, Pirate, Space, Christmas, Halloween, Candy, Steampunk and Jungle decoration | 2,048 × 2,048 crop-safe layered masters | Bitmap/vector layers | Decorative motion only; never changes odds | Reusable by presentation where compatible | Skin-specific | **NEEDS CREATION** |
| Triple-tier markers | Single / double / triple reward-stage cue | 64 × 64 view boxes plus live label | Vector | Stage progression once | Reusable | Semantic variants | **NEEDS CREATION** |
| Legacy `chest.webp`, `wheel*.webp`, `luckySpinBanner.webp` | Current static chest/wheel presentation art | 600 × 600 and 600 × 200 | Bitmap | Existing wheel rotation only | Legacy | No | **PLACEHOLDER** |

## 11. Particle effects

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| Particle emitter primitives | Spawn, trajectory, lifetime and density controls | No fixed size | Code-native Canvas/WAAPI | Full/Reduced/Off density contract | Reusable | Token-driven | **READY** |
| `particles/sparkle-set.svg` | Small glints around Play, Foil and claimable rewards | 64 × 64 view-box symbols | Vector | Short randomised twinkle; static/removed in Reduced/Off | Reusable | White/gold/cyan via tokens | **NEEDS CREATION** |
| `particles/confetti-atlas.webp` | Major committed reward celebration | 512 × 512 transparent atlas | Bitmap | Short burst only; removed in Reduced/Off | Reusable | Colour-blind-safe shape mix | **NEEDS CREATION** |
| `particles/ribbon-trails.svg` | Promotional banner and major celebration energy | 1,200 × 400 view box | Vector | Slow drift; static in Reduced/Off | Reusable | Token/skin variants | **NEEDS CREATION** |
| `particles/currency-burst.svg` | Coin/Star gain confirmation | 256 × 256 view box | Vector | One-shot outward burst; no idle loop | Reusable | Separate Coin/Star token colours and glyphs | **NEEDS CREATION** |
| `particles/match-burst.svg` | Match-3 clear and power-up activation | 256 × 256 view box | Vector | 180–500 ms one-shot | Reusable | Tile-colour variants | **NEEDS CREATION** |
| `particles/noise-soft.webp` | Organic alpha variation for glow and ambient fields | 256 × 256 seamless grayscale | Bitmap mask | Optional slow offset; static in Reduced/Off | Reusable | Neutral alpha | **NEEDS CREATION** |
| Celebration screen flash | Brief luminance lift without full-screen strobe | Full component bounds | Code-native CSS | Maximum one subtle pulse; disabled in Reduced/Off | Reusable | Semantic tokens | **READY** |

## 12. Background elements

| Asset name / proposed path | Purpose | Dimensions | Vector or bitmap | Animation requirements | Reuse | Dark/light variants | Status |
|---|---|---:|---|---|---|---|---|
| Application canvas gradient | Midnight Collector base without fixed scenic art | Full viewport, responsive | Code-native CSS | Static | Reusable | Dark-first; no light theme currently approved | **READY** |
| Safe-area header backdrop | Keeps Player Header readable below cut-outs while content scrolls | Full width; height = content + safe inset | Code-native CSS | Static; optional backdrop blur | Reusable | Dark-first | **READY** |
| Ambient radial glows | Adds depth behind hero without controlling layout | Container-relative | Code-native CSS | Slow opacity drift; static in Reduced/Off | Reusable | Token-driven | **READY** |
| Match-3 hero abstract field | Ribbons, dots and tile silhouettes around live preview | 1,600 × 1,200 crop-safe master/layers | Vector + transparent bitmap accents | Subtle parallax/particles; static in Reduced/Off | Reusable hero treatment | Seasonal accent variants | **NEEDS CREATION** |
| `promo/coin-store-hero.webp` | Required visually strong Coin Store carousel advert | 1,600 × 720 crop-safe, no baked text/price | Bitmap, preferably layered source | Coin glint/ribbon drift; static in Reduced/Off | Reusable offer template | Dark-UI version | **NEEDS CREATION** |
| Promotional abstract backgrounds | Season, community, collections, announcements and offers | 1,600 × 720 crop-safe per family | Bitmap/vector layers | Optional slow decorative drift | Reusable template, unique art accents | Event variants | **NEEDS CREATION** |
| Seasonal motif overlays | Theme without scenic illustration or mascot dependence | 2,048 × 2,048 seamless/crop-safe | Bitmap/vector | Static or slow drift; disabled in Reduced/Off | Reusable by season | Season-specific | **NEEDS CREATION** |
| Empty-state abstract spot | Collection/reward/network empty states without characters | 1,024 × 768 transparent/crop-safe | Vector + bitmap texture | Optional one-shot arrival | Reusable | Dark and light-surface contrast versions | **NEEDS CREATION** |
| Legacy `home_still_v2.webp`, `bg_home.webp`, `home-bg.jpg`, maps and mascot backgrounds | Existing fixed scenic/full-screen imagery | Mixed, including 853 × 1,844 Home still | Bitmap | Some video/poster use | Legacy screens only | No | **PLACEHOLDER** |

## Home implementation asset gate

The Home screen must not begin production implementation until the following minimum set is approved or explicitly allowed to use a temporary development substitute:

1. Primary Flip-Out logo and compact mark.
2. Licensed production fonts or an approved system-font fallback decision.
3. Player avatar fallback, avatar frame and level badge.
4. Star and Coin icons, plus the Coin Store hero advert.
5. Home, Collection, Rewards and More navigation icons.
6. Core action/status icons used by the header, carousel and progress rows.
7. Signature Play frame and highlight mask.
8. Six Match-3 base tile symbols, shell, required special piece and preview effects.
9. XP, Collection, Foil and Season progress identifiers.
10. Sparkle/noise/ribbon elements needed for the approved restrained spectacle.

Code-native panel shells, progress bars, focus states, safe-area background, navigation indicator, scrim and modal geometry do not need bitmap production and are already specified as READY visual constructions.

## Production order

1. **Lock branding and licences:** approve the wordmark, compact mark, app icon direction and font licences.
2. **Create the shared icon language:** navigation, action, status, currencies, progress and rarity glyphs in one consistent SVG family.
3. **Create the flagship controls:** signature Play frame/highlight and Player Header identity assets.
4. **Create the Match-3 visual kit:** base tiles, specials, blockers, objectives, power-ups and preview choreography.
5. **Create the Home promotion kit:** Coin Store hero, generic promotion frame art, abstract ribbons and particle masks.
6. **Run a Home asset QA gate:** contrast, 320 px crops, tablet crops, safe areas, 200% text, colour-blind cues, Full/Reduced/Off motion and compressed bundle cost.
7. **Only then implement the Home screen** from reusable React design-system components.
8. Produce Collection and Reward Theatre assets later, immediately before those approved implementation packages; their rows above prevent incompatible decisions now.

## Explicitly deferred

- No React component or Home screen implementation was performed in Phase 2A.
- No concept was redesigned.
- No production artwork, mascot, scenic background, Reward Theatre presentation or other-screen asset was generated.
- No existing file was deleted or replaced.
- Audio and haptics are interaction specifications in `FLIPOUT_DESIGN_SYSTEM.md`; they are intentionally outside this visual-asset inventory.
