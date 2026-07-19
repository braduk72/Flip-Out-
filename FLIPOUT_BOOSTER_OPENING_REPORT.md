# Flip-Out approved themed booster-opening report

Date: 19 July 2026  
Environment: Preview/development only  
Production: untouched

## Source and extraction

- Master source: `assets/source/booster-opening/themed/booster-opening-themed-source.png`
- Source dimensions: `768 × 1376`, transparent PNG.
- Detected visual layout: `3 / 3 / 3 / 2`, read left-to-right then top-to-bottom: **11 groups**, not a regular grid.
- Output directory: `public/ui/booster-opening/themed/`
- Output cell: `640 × 640` transparent WebP; registration point `(320, 320)`; common scale `1`; 6 px source padding.
- Encoder: Sharp WebP `quality: 96`, `alphaQuality: 100`, `smartSubsample: true`, `effort: 6`.

| Frame | Alpha bounds (x, y, w, h) | Crop bounds (x, y, w, h) | Output size |
|---|---|---|---|
| 01 | 35, 37, 186, 294 | 29, 31, 198, 306 | 41,324 B |
| 02 | 317, 37, 143, 290 | 311, 31, 155, 302 | 39,038 B |
| 03 | 631, 37, 28, 294 | 625, 31, 40, 306 | 12,060 B |
| 04 | 70, 381, 117, 281 | 64, 375, 129, 293 | 29,318 B |
| 05 | 319, 381, 133, 281 | 313, 375, 145, 293 | 31,926 B |
| 06 | 578, 381, 132, 281 | 572, 375, 144, 293 | 31,504 B |
| 07 | 58, 712, 140, 275 | 52, 706, 152, 287 | 32,788 B |
| 08 | 302, 709, 167, 278 | 296, 703, 179, 290 | 30,220 B |
| 09 | 550, 717, 169, 276 | 544, 711, 181, 288 | 27,842 B |
| 10 | 73, 1060, 204, 287 | 67, 1054, 216, 299 | 28,594 B |
| 11 | 397, 1101, 364, 185 | 391, 1095, 376, 197 | 44,308 B |

Frame 10 is one recorded source group and contains both the stacked card backs and the detached curved wrapper remnant. Frame 11 is the approved fanned card target. No frame was omitted, duplicated, stretched or blended with a neighbour.

## Presentation implementation

- `src/ui/packOpeningFlow.js` maps all 11 WebPs to explicit physical opening phases.
- `src/components/BoosterPackOpening.jsx` preloads them before enabling Open Pack.
- CSS uses GPU-friendly `translate3d`, `rotateY`, transform-only card flips and a procedural five-card fan in approved colour order: blue, red, green, purple, gold.
- Timings: 180 ms appear; 120 ms enlarge; 220 ms lift; 220/220/160 ms turning; 150 ms settle; 180 ms tear; 250 ms opening; 220/240/180/220 ms wrapper exit; 620 ms fan. Reduced/off motion preserves state information with shortened/removed non-essential motion.
- Individual reveal and Reveal All have duplicate-flip guards. Foil smoke, sparkle, glow, haptic and audio hooks are modular and optional; no new audio was created.
- A server-issued `receiptId` can identify a reopenable confirmed result. This component does not select cards, call a purchase API, grant inventory or change balances; booster purchasing remains disabled.

## Preview visual verification

`https://dev.flipout.gizmogames.uk/?dev=booster-opening` is Preview-only. It presents one keyframe at a time, Previous/Next, autoplay, speed control, fixed canvas boundary and crosshair, alpha bounds and crop coordinates. Browser verification on the deployed Preview rendered Frame 01 of 11 and its expected source/canvas metadata. HTTP verification returned 200 for the review route, manifest and Frame 10 (`image/webp`).

## Automated verification

- New asset checks: 11-frame order, 3/3/3/2 source layout, uniform transparent canvas, Frame 10 remnant and neighbour-crop separation.
- New UI checks: eleven key poses, receipt reopenability metadata, development-route restriction, timing/reduced motion, procedural fan, individual reveal, Reveal All, no repeat flip and interruption/resume.
- Full test suite: **124 Node passed / 11 expected Preview-only skips; 50 UI passed.**
- Focused changed-file lint: passed.
- `npm.cmd run build`: passed, 152 modules transformed.
- `npm.cmd run build:preview`: passed, 152 modules transformed.
- The wider App lint remains blocked by four pre-existing legacy multiplayer/query `react-hooks/set-state-in-effect` findings; none were introduced or changed here.

## Deployment

- Dev commit: `8955e75`.
- Ready Preview: `dpl_6mi6fKuPFTg6EyTE9w32zWRGLJDZ` — `https://flip-modjhhhfr-chattocal.vercel.app`.
- Permanent development URL: `https://dev.flipout.gizmogames.uk` — HTTP 200, Vercel alias to the same Ready Preview deployment, entry bundle `assets/index-ChIs5IAc.js`.
- Manual physical Android Chrome and iPhone Safari visual checks remain outstanding; they were not represented as completed.
