# Flip Out! 🃏

A card-matching game with special power-ups, season mode, gauntlet mode, and multiplayer.

**Live:** https://flipout.gizmogames.uk  
**Dev:** https://dev.gizmogames.uk  
**Repo:** https://github.com/braduk72/Flip-Out-

---

## 🔴 PICK UP HERE — Session 22 handover (24 May 2026)

### What was done this session
- **Solo mode — specials removed** — `useGame` now accepts `isSolo` flag; solo boards have 0 special cards; pair count rounded up to next even number so 4-column grid stays full
- **DNS fixed permanently** — `dev.gizmogames.uk` now points to Vercel dev branch (A record `76.76.21.21`, proxy off); SSL cert issued; auto-updates on every push. No more APOLLO stale build
- **`gizmogames.uk` root fixed** — was pointing to old Cloudflare Pages build; now A record → Vercel production; AdSense can find it; SSL cert issued
- **Stripe shop built** — full payment backend: `api/fo-checkout.js`, `api/fo-webhook.js`, `api/fo-verify.js`, `api/fo-restore.js`; product catalog in `api/_products.js`
- **Silent device UUID** — `src/utils/deviceId.js`; generated on first visit, invisible to player, ties purchases to device
- **Post-payment flow** — after Stripe redirect back, `?fo_session` + `?fo_device` params detected; purchase verified server-side; coins/decks/extras applied to localStorage; success overlay shown
- **Restore Purchases** — Settings screen has email input: "Enter email address to enable cross-platform play"; calls `/api/fo-restore`; applies all prior purchases to new device
- **Shop buttons wired** — coin packs, bundles, chest, remove ads all call `startCheckout(productId)`; loading state shows `…` on price
- **DB migration** — `CAL/server/migrations/073_flipout_shop.sql` — tables `fo_players` and `fo_purchases` added (not yet run on production — needs DATABASE_URL)
- **Vercel env vars set** — `STRIPE_SECRET_KEY` (production + dev), `FO_URL` (production + dev), `VITE_DEV_TOOLS=true` (dev)

### 🚨 MUST DO BEFORE SHOP WORKS — two things outstanding

**1. DATABASE_URL** — production PostgreSQL URL not yet set in Vercel for Flip Out project.
- Log into [railway.app](https://railway.app) → CAL project → Postgres service → Variables tab → copy `DATABASE_URL`
- Tell Claude: "Here's the DATABASE_URL: xxx" and Claude will add it to Vercel via CLI + run the migration

**2. Stripe webhook** — `STRIPE_FO_WEBHOOK_SECRET` not yet set.
- Log into [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint
- URL: `https://flipout.gizmogames.uk/api/fo-webhook`
- Events: `checkout.session.completed`
- Copy the signing secret → tell Claude → it'll add to Vercel

### Dev URLs
- **Dev (latest push):** https://dev.gizmogames.uk or https://flip-out-git-dev-chattocal.vercel.app
- **Production:** https://flipout.gizmogames.uk / https://gizmogames.uk

### Brad action items
1. Provide Railway DATABASE_URL (see above)
2. Create Stripe webhook and provide signing secret (see above)
3. Continue with graphics / deck backgrounds — shop backend is ready, just needs the DB connected
4. Approve dev → main merge when ready to go live

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
