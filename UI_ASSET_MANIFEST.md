# Flip-Out Concept 4D UI asset manifest

Date: 19 July 2026. Scope: reusable assets shipped by the Concept 4D Home package. All runtime paths are under `public/ui/` unless stated otherwise. No protected third-party game artwork was copied and no flattened screen image is used as UI.

Status meanings: **READY** is an original reusable runtime asset; **GENERATED** is an original bitmap generated for this package and then cropped/compressed for runtime use; **PLACEHOLDER** is intentionally temporary; **NEEDS CREATION** is approved future content that is not required to operate this Home release.

## Branding and frames

| Asset | Runtime purpose | Size/type | Layer/motion | Status |
|---|---|---|---|---|
| `flipout-logo.svg` | Compact canonical header wordmark | 600×220 SVG | Separate wordmark; CSS shimmer can be disabled | **READY** |
| `avatar-frame.svg` | Player identity/avatar rim | 128×128 SVG | Independent from future player portrait | **READY** |
| `play-frame.svg` | Purple/gold signature Play control | 720×240 SVG | Frame below live text, sheen and sparkles | **READY** |
| `panel-frame.svg` | Match-3 hero border/highlight | 1,200×1,000 SVG | Scales independently of panel content | **READY** |
| `promo-frame.svg` | Carousel luminous rim | 1,600×720 SVG | Overlays any carousel artwork | **READY** |
| `progress-frame.svg` | Scalable progress-track rim | 600×40 SVG | Independent from coloured fill and value | **READY** |
| `sparkles.svg` | Controlled Play/hero particle layer | 720×320 SVG | Opacity/scale loop; static in Reduced/Off | **READY** |

## Promotional carousel artwork

| Asset | Runtime purpose | Size/type | Animation | Reuse | Status |
|---|---|---|---|---|---|
| `promo/coin-store.webp` | Required Coin Store promotion | 1,600×720 WebP, 160,782 bytes | Framed live; optional glints remain separate | Offer copy/prices are live text | **GENERATED** |
| `promo/community.webp` | Community/season/event promotion | 1,600×720 WebP, 118,962 bytes | Framed live; progress remains semantic UI | Reused for event families until seasonal art exists | **GENERATED** |
| `promo/collection.webp` | Collection/new-card promotion | 1,600×720 WebP, 175,626 bytes | Framed live; foil effects stay separate | Collection family | **GENERATED** |
| Demonica/Angelica/Double Stars/weekend-specific backgrounds | Future live-ops carousel skins | 1,600×720 crop-safe WebP | Subtle independent layer motion | Unique campaign art on shared frame | **NEEDS CREATION** |

The three generated backgrounds contain no baked copy, prices, logos or characters. The package used original abstract midnight-navy, violet, cyan and gold prompts: a secure premium Coin vault; a cooperative constellation/progress scene; and a luminous collectible-card/foil scene. They were cropped to the approved carousel ratio and exported as WebP.

## Vector icon system

`src/ui/Icon.jsx` is the reusable vector source for Home, Collection, Rewards, More, Stars, Coins, Coin Store/cart, carousel arrows, dialog close, cards, foil, season, XP, retry, alert, info, success, play and pause. Icons use one 24×24 coordinate system, inherit semantic colour and remain sharp at all supported sizes. They are **READY** and are not bitmap or font glyph substitutes.

The Stars and Coins symbols are display marks only; all values come from server-backed player state. The Coin Store icon opens the existing Shop route and cannot alter a balance.

## Match-3 temporary token set

| Asset | Size/type | Purpose | Status |
|---|---|---|---|
| `match3/token-sun.svg` | 128×128 SVG | `sun` engine token | **READY** |
| `match3/token-moon.svg` | 128×128 SVG | `moon` engine token | **READY** |
| `match3/token-leaf.svg` | 128×128 SVG | `leaf` engine token | **READY** |
| `match3/token-drop.svg` | 128×128 SVG | `drop` engine token | **READY** |
| `match3/token-star.svg` | 128×128 SVG | `star` engine token | **READY** |
| `match3/token-gem.svg` | 128×128 SVG | `gem` engine token | **READY** |

These replace the early Unicode/CSS token substitutes. They are deliberately labelled temporary because final Match-3 art direction is outside this package, but they are original, separated, responsive vector assets and map one-to-one to real engine tokens.

## Component-rendered assets

The following graphics are deliberately produced by reusable vector/CSS component layers rather than raster files: currency capsules, badges, progress fills, card surfaces, bottom-navigation active state, dialog scrim, focus rings, Coin glint, logo shimmer, Play sheen, panel entrances and reduced-motion static states. This preserves fluid sizing, semantic recolouring and high-contrast support. Their source is `src/ui/tokens.css` and `src/ui/components.module.css`; status **READY**.

## Deliberate placeholders and deferrals

| Item | Current treatment | Status / next requirement |
|---|---|---|
| Player portrait | Original neutral star/avatar frame; no mascot dependency | **PLACEHOLDER** — connect approved player-created avatars later |
| XP and account level | Component supports both, but backend currently has no authoritative XP/level fields | **PLACEHOLDER DATA** — add schema/service before display becomes numeric |
| Foil catalogue art | Foil progress openly reports unavailable when no authoritative foil items exist | **NEEDS CREATION** — approve item definitions and assets first |
| Audio | Named Web Audio tones behind one abstraction | **PLACEHOLDER** — replace with licensed/approved SFX without changing components |
| Haptics | Web vibration hook on Play only | **PLACEHOLDER** — map to native iOS/Android haptic APIs during native work |
| Reward Theatre, Exchange and final Shop art | Not part of this Home-only implementation | **NEEDS CREATION** in their approved later screen packages |

## Runtime rules

- UI copy, balances, progress, prices and offer dates are never baked into artwork.
- Bitmap promotions are decorative; every action and status has live semantic text.
- SVG frames and effects are separate layers so they can resize, pause or be replaced independently.
- Reduced Motion and hidden-page states stop or substantially reduce nonessential motion.
- The approved Home mock-up remains a visual reference only and is not bundled as a runtime asset.
