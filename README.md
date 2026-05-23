# Flip Out! 🃏

A card-matching game with special power-ups, season mode, gauntlet mode, and multiplayer.

**Live:** https://flipout.gizmogames.uk  
**Dev:** https://dev.gizmogames.uk  
**Repo:** https://github.com/braduk72/Flip-Out-

---

## 🔴 PICK UP HERE — Session 21 handover (23 May 2026)

### What was done this session
- **Lucky Spin — coin multiplier images** — 8 PNGs (x1/x5/x10/x15/x20/x25/x50/x100) converted to WebP; wheel restructured from single `<img>` to rotating `<div>` with base image + 8 absolutely-positioned badge overlays; segment order shuffled (not ascending)
- **Fog redesign** — 9 continuous-scroll marquee strips replace the old oscillating drift; 200%-wide strips, two cloud images each, `translateX(-50%)` linear infinite; full gap-free coverage
- **Win/lose overlay** — `'😅 AI WINS!'` → `'😢 YOU LOST!'` across all three overlay paths
- **Mouse rotation** — sprite faces NORTH at 0°; all 4 keyframe animations had 90° subtracted from every `rotate()` value so mice travel nose-first
- **Dev toolbar WIN button** — 🏆 tile in in-game DEV toolbar; only shown when `onResult` is wired (season/gauntlet); calls `onResult('player')` to skip to win
- **Dev toolbar gating** — `import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true'`; zero dev code in Production build
- **SpecialOffer icon visibility** — chip backgrounds lightened; `brightness(1.9) saturate(1.2)` + strong white glow on `.itemIcon` so all 4 items are clearly visible
- **Cache fix** — `vercel.json` updated with `no-store, no-cache, must-revalidate` for `/` and `*.html`; Cloudflare will no longer serve a stale JS bundle after a deploy
- **Dev test URL params** — `?testoffer` opens SpecialOffer popup immediately; `?testprize` navigates to Lucky Spin with prize overlay open

### Unresolved / check first next session
- **SpecialOffer icons** — verify they are clearly visible at `https://dev.gizmogames.uk?testoffer` after the cache fix takes effect
- **Season map fog** — session 21 screenshot showed old cached JS (VEXOR/ROUND 1 era); fog should be correct once fresh JS loads. Verify the top portion of the map is covered by dark fog at step 0
- **Cloudflare cache** — `no-store` header deployed this session. If hard-refresh still shows old content, purge the Cloudflare cache manually in the dashboard (Caching → Purge Everything for `dev.gizmogames.uk`)

### Brad action items
1. Hard-refresh `https://dev.gizmogames.uk?testoffer` — confirm icons visible and season map correct
2. Approve dev → main merge when happy with everything
3. Set `VITE_DEV_TOOLS=true` in Vercel → Project Settings → Environment Variables → **Preview only** (if not already done)

---

## Deployment

Hosted on **Vercel** (project `flip-out`, team `chattocal`).

| Branch | Deploys to | URL |
|--------|-----------|-----|
| `main` | Production | https://flipout.gizmogames.uk |
| `dev`  | Preview / Dev | https://dev.gizmogames.uk |

> **Claude always pushes to `dev` only. Brad approves before merging to `main`.**

```bash
# To ship to live:
git checkout main
git merge dev --no-edit
git push origin main
git checkout dev
```

Vercel auto-builds → live within ~2 minutes.

### Cache behaviour (vercel.json)
- `index.html` / root → `no-store, no-cache` — Cloudflare never caches; always fresh
- `/images/*` and `/music/*` → 30-day public cache — safe (Vite hashes these filenames)

---

## Dev URL Params

```
?testoffer       — force SpecialOffer popup open immediately (dev testing)
?testprize       — go to Lucky Spin with prize overlay open (dev testing)
?specials=1      — board filled with all special cards
?unlock=gizmo    — unlock all paid decks
?resetseason=1   — reset season progress to step 0
?resetgauntlet=1 — reset gauntlet to round 1
?resetoffer=1    — reset special offer seen/bought state
```

In-game DEV toolbar: visible locally (`DEV=true`) and on Vercel Preview when `VITE_DEV_TOOLS=true`.  
Contains: FREEZE / BOOM / TORNADO / MAGNET / BOLT / ROCKET / DICE / XRAY / SHUFFLE / MIRROR / GLUE / 🏆 WIN

---

## Tech Stack

- React 19 + Vite
- CSS Modules
- Socket.io multiplayer (on CAL backend, port 3001)
- Web Audio API — tick sounds on Lucky Spin; SFX via `useSfx.js`

---

## Project Structure

```
src/
  screens/     Game, Home, SeasonMap, LuckySpin, DeckPicker, Settings, Gauntlet, Shop, etc.
  components/  Card, BottomNav, SpecialOffer, Interstitial, AdBanner, RemoveAdsModal
  hooks/       useGame.js (core reducer), useMultiplayer.js, useSfx.js
  data/        decks.js, specialCards.js, seasonalOpponents.js, opponents.js
public/
  images/      All sprites — WebP only, no PNGs
  music/       24 tracks across 4 pools
scripts/
  convert_coin_multipliers.cjs   PNG → WebP for Lucky Spin badge images
  split_sprites.cjs              Sprite sheet splitter
```

---

## Current State — What is built

### Core gameplay
- Card matching vs AI — Easy / Medium / Hard / Lethal
- 12 special cards — freeze, boom, tornado, magnet, bolt, rocket, dice, shield, stopwatch, crown, xray, random, shuffle
- Solo mode — count-up timer, personal best per deck + difficulty
- Multiplayer — Socket.io Quick Match / Create / Join; board sync; turn reporting (**code complete, needs live test with 2 devices**)
- Joker system — one per day per owned paid deck
- Gauntlet — 10-round knockout; Professor Claw final boss; gold card reward
- Season 1 — 30-step path; steps 0–28 = generic challenger; step 29 = THE ARCHITECT (Lethal); fog of war reveals as player advances; gold card + 150 coins on boss win; auto-resets

### Shop & economy
- Coin system
- Lucky Spin — 8 segments with coin multiplier badge images; 1 free/day + 1 ad spin/day; pointer tick + Web Audio
- Shop — Bonus Chest (400 coins)
- Special Offer popup — 80% off badge, 24h countdown, one-time, 4 items
- Remove Ads modal

### Visuals & UI
- 9 card decks (1 free, 8 paid)
- Season 1 map — 30-step scrollable path; animated robomice (3 colours, nose-forward rotation); tesla coils (3 colours, sparking); 9-layer fog of war (marquee scroll); electric storm clouds + lightning; steam emitters; player avatar moves along path
- 4 gameshow stage backgrounds
- Avatar picker (4 avatars; 6 locked slots)
- Shield badge — pulsing blue glow beneath portrait when active
- Win / loss overlays — 😊 You Win! / 😢 You Lost!

### Infrastructure
- All images WebP — no PNGs in production; cache-bust `V = '?v=4'` in `SeasonMap.jsx`
- `vercel.json` — no-store for HTML; 30-day cache for images + music
- 4-pool music system — menu / in-game (18 tracks) / game-over (4 tracks) / boss (1 track)
- Dev toolbar gated behind env var; zero footprint in Production

---

## Known Issues

| Issue | Notes |
|---|---|
| Multiplayer untested live | Code complete; needs two real devices |
| Season map node positions | `NODE_POSITIONS` in `SeasonMap.jsx` estimated visually — calibrate on phone |
| THE ARCHITECT boss image | `Opponants/l1.webp` is placeholder — Brad has real artwork |
| Robomouse sprites | Front-on art; rotate() CSS points nose correctly but sprites look forward-on |
| `VITE_DEV_TOOLS=true` | Must be set in Vercel → Project Settings → Env Vars → Preview only |

---

## Music System

| Pool | Screens | Files |
|------|---------|-------|
| `MENU_TRACKS` | home, shop, season map, etc. | `menu_1–2.mp3` |
| `INGAME_TRACKS` | game, roundstart, gauntlet, mp | `ingame_*.mp3` (18 tracks) |
| `GAMEOVER_TRACKS` | triggered by `onPlayerLost` | `gameover_1–4.mp3` |
| `BOSS_TRACKS` | season game at step 29 only | `ingame_boss_final.mp3` |

Pool switching managed in `App.jsx`. `onPlayerLost` prop on `<Game>` triggers the gameover pool.

---

## Image & Sprite Pipeline

- **PNG → WebP**: `sharp` — see `scripts/convert_coin_multipliers.cjs` for the pattern
- **Sprite sheet split**: `crop-sprites.mjs` (project root)
- **Background removal**: `strip_bg.mjs` (jimp, corner-sampling, threshold 40)
- Raw downloads in `public/images/downloads/` — gitignored

---

## Backlog (priority order)

1. Multiplayer live test — two real devices
2. Season map node calibration — phone testing, tweak `NODE_POSITIONS`
3. Real boss image for THE ARCHITECT
4. Interstitial ads — `Interstitial.jsx` is a placeholder; wire up PropellerAds or AdSense (trivial swap later)
5. Robomouse side-facing sprites — new art needed
6. Season 2 — new opponents, map, theme
7. Leaderboard — stub; needs real data
8. More decks
9. Achievement badges
10. Push notifications
11. CAL integration — coins appear in CAL wallet

---

## Version

Current: **v0.26** (session 21, 23 May 2026)
