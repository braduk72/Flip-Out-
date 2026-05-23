# Flip Out! 🃏

A card-matching game with special power-ups, season mode, gauntlet mode, and multiplayer.

**Live:** https://flipout.gizmogames.uk  
**Dev:** https://dev.gizmogames.uk  
**Repo:** https://github.com/braduk72/Flip-Out-

---

## 🔴 PICK UP HERE — Session 22 handover (24 May 2026)

### What was done this session

- **Solo mode — specials removed** — `useGame` now accepts `isSolo` flag; solo boards have 0 special cards; pair count rounded up to next even number so 4-column grid stays full
- **DNS fixed permanently** — `dev.gizmogames.uk` now A record → `76.76.21.21` (Vercel), proxy off; SSL cert issued; auto-updates on every push. No more APOLLO stale build
- **`gizmogames.uk` root fixed** — was pointing to old Cloudflare Pages build; now A record → Vercel production; AdSense can find it; SSL cert issued
- **Full Stripe shop built** — Vercel serverless API routes:
  - `api/fo-checkout.js` — creates Stripe Checkout session, records pending purchase in DB
  - `api/fo-webhook.js` — handles `checkout.session.completed`; marks purchase complete; links Stripe email to device UUID
  - `api/fo-verify.js` — called after Stripe redirect; verifies payment server-side; applies purchase to localStorage
  - `api/fo-restore.js` — Restore Purchases by email; aggregates all purchases across devices
  - `api/_products.js` — shared product catalog (6 decks @ £1.99, coin packs, remove ads, bundles, chest, launch offer)
- **Silent device UUID** — `src/utils/deviceId.js`; `crypto.randomUUID()` on first visit, stored in `fo_device_uuid` localStorage key; invisible to player
- **Post-payment overlay** — after Stripe redirect back with `?fo_session` + `?fo_device`, purchase is verified server-side and applied to localStorage; success screen shows what was granted
- **Restore Purchases in Settings** — email input with "Enter email address to enable cross-platform play"; calls `/api/fo-restore`; applies all prior purchases to new device
- **Shop buttons wired** — coin packs, bundles, chest, remove ads all call `startCheckout(productId)`; shows `…` while redirecting
- **DB migration run** — `073_flipout_shop.sql` applied to Railway production; tables `fo_players` and `fo_purchases` created
- **All Vercel env vars set** — `STRIPE_SECRET_KEY`, `STRIPE_FO_WEBHOOK_SECRET`, `DATABASE_URL` (Railway public URL), `FO_URL`, `VITE_DEV_TOOLS=true` — all set for both production and dev

### ✅ Shop is fully wired — ready to test next session

Everything is deployed. Next session: test a real purchase on dev, verify coins/decks land, verify Restore Purchases works.

### Unresolved / next session

1. **Test the shop** — open `https://dev.gizmogames.uk`, go to Shop, try buying 100 coins (£0.99); confirm success overlay appears and coins are credited
2. **Graphics / deck backgrounds** — Brad has more images to strip backgrounds from; more decks to add
3. **Deck unlock wiring** — DeckPicker needs to show locked/unlocked state based on `fo_owned_decks` in localStorage; buy button for locked decks should call `startCheckout('deck_xxx')`
4. **SpecialOffer popup** — wire "Tap to unlock" button to `startCheckout('offer_launch')`
5. **Approve dev → main merge** — when shop tested and happy, merge to production
6. **Neon DB option** — currently using Railway public URL (may incur small egress fees on purchases). Can migrate to free Neon DB if preferred

### Brad action items
1. Test the shop on `https://dev.gizmogames.uk`
2. Provide graphics for new decks
3. Approve merge to main when ready

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
- `index.html` / root → `no-store, no-cache` — always fresh
- `/images/*` and `/music/*` → 30-day public cache — safe (Vite hashes filenames)

---

## Dev URL Params

```
?testoffer       — force SpecialOffer popup open immediately
?testprize       — go to Lucky Spin with prize overlay open
?specials=1      — board filled with all special cards
?unlock=gizmo    — unlock all paid decks
?resetseason=1   — reset season progress to step 0
?resetgauntlet=1 — reset gauntlet to round 1
?resetoffer=1    — reset special offer seen/bought state
```

In-game DEV toolbar: visible on dev branch (`VITE_DEV_TOOLS=true` set in Vercel).
Contains: FREEZE / BOOM / TORNADO / MAGNET / BOLT / ROCKET / DICE / XRAY / SHUFFLE / MIRROR / GLUE / 🏆 WIN

---

## Tech Stack

- React 19 + Vite
- CSS Modules
- Vercel Serverless Functions (API routes in `/api/`)
- Stripe Checkout (one-time payments)
- PostgreSQL on Railway (via public proxy)
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
  utils/       deviceId.js, foShop.js
api/
  _products.js      — product catalog (shared)
  fo-checkout.js    — POST: create Stripe Checkout session
  fo-webhook.js     — POST: Stripe webhook handler
  fo-verify.js      — GET: verify session after redirect, apply purchase
  fo-restore.js     — POST: restore purchases by email
public/
  images/      All sprites — WebP only, no PNGs
  music/       24 tracks across 4 pools
scripts/
  convert_coin_multipliers.cjs   PNG → WebP for Lucky Spin badge images
  split_sprites.cjs              Sprite sheet splitter
```

---

## Vercel Environment Variables

| Variable | Environments |
|---|---|
| `STRIPE_SECRET_KEY` | Production + Preview/dev |
| `STRIPE_FO_WEBHOOK_SECRET` | Production + Preview/dev |
| `DATABASE_URL` | Production + Preview/dev (Railway public URL) |
| `FO_URL` | Production (`https://flipout.gizmogames.uk`) + Preview/dev |
| `VITE_DEV_TOOLS` | Preview/dev only (`true`) |

---

## Shop & Payments

### Architecture
- **No user accounts** — silent device UUID (`fo_device_uuid` in localStorage) is the player's invisible ID
- **Stripe Checkout** — redirect flow; Stripe collects email automatically
- **After payment** — webhook fires + success URL verified; purchase applied to localStorage
- **Cross-platform restore** — email captured from Stripe checkout; "Restore Purchases" in Settings applies all past purchases to new device

### Products (`api/_products.js`)
| ID | Type | Price |
|---|---|---|
| `deck_sportscars` | deck | £1.99 |
| `deck_birdsOfPrey` | deck | £1.99 |
| `deck_dogs` | deck | £1.99 |
| `deck_cats` | deck | £1.99 |
| `deck_KingsandQueens` | deck | £1.99 |
| `deck_WorldLandmarks` | deck | £1.99 |
| `coins_100` | coins | £0.99 |
| `coins_500` | coins | £3.99 |
| `coins_1000` | coins | £6.99 |
| `remove_ads` | remove_ads | £7.99 |
| `chest` | chest | £3.99 |
| `bundle_starter` | bundle | £2.99 |
| `bundle_mega` | bundle | £9.99 |
| `offer_launch` | offer | £1.99 |

### Database (Railway PostgreSQL)
- `fo_players` — device_uuid (PK), email, created_at, updated_at
- `fo_purchases` — id, device_uuid, stripe_session_id (unique), product_id, product_type, coins_granted, decks_granted[], extras_granted{}, pence, status, completed_at

---

## Current State — What is built

### Core gameplay
- Card matching vs AI — Easy / Medium / Hard / Lethal
- 12 special cards — freeze, boom, tornado, magnet, bolt, rocket, dice, shield, stopwatch, crown, xray, random, shuffle
- Solo mode — count-up timer, personal best per deck + difficulty; **no special cards**
- Multiplayer — Socket.io Quick Match / Create / Join; board sync; turn reporting (**code complete, needs live test with 2 devices**)
- Joker system — one per day per owned paid deck
- Gauntlet — 10-round knockout; Professor Claw final boss; gold card reward
- Season 1 — 30-step path; steps 0–28 = generic challenger; step 29 = THE ARCHITECT (Lethal); fog of war reveals as player advances; gold card + 150 coins on boss win; auto-resets

### Shop & economy
- Coin system
- Lucky Spin — 8 segments with coin multiplier badge images; 1 free/day + 1 ad spin/day; pointer tick + Web Audio
- Shop — Bonus Chest, coin packs, bundles, remove ads — all wired to Stripe Checkout
- Special Offer popup — 80% off badge, 24h countdown, one-time, 4 items (buy button not yet wired to Stripe — **todo**)
- Remove Ads modal

### Visuals & UI
- 9 card decks (1 free, 8 paid — 4 awaiting new graphics from Brad)
- Season 1 map — 30-step scrollable path; animated robomice; tesla coils; 9-layer fog of war; electric storm; steam emitters
- 4 gameshow stage backgrounds
- Avatar picker (4 avatars; 6 locked slots)
- Win / loss overlays — 😊 You Win! / 😢 You Lost!

### Infrastructure
- All images WebP — no PNGs in production
- `vercel.json` — no-store for HTML; 30-day cache for images + music
- 4-pool music system — menu / in-game (18 tracks) / game-over (4 tracks) / boss (1 track)
- Dev toolbar gated behind `VITE_DEV_TOOLS` env var
- Full Stripe payment backend — serverless, no separate server needed

---

## Known Issues

| Issue | Notes |
|---|---|
| Multiplayer untested live | Code complete; needs two real devices |
| Season map node positions | `NODE_POSITIONS` in `SeasonMap.jsx` estimated visually — calibrate on phone |
| THE ARCHITECT boss image | `Opponants/l1.webp` is placeholder — Brad has real artwork |
| SpecialOffer buy button | Not yet wired to `startCheckout('offer_launch')` |
| DeckPicker locked state | Needs to check `fo_owned_decks` and show buy button for locked decks |
| Railway egress fees | Small fees possible on purchases; can migrate to free Neon DB if needed |

---

## Music System

| Pool | Screens | Files |
|------|---------|-------|
| `MENU_TRACKS` | home, shop, season map, etc. | `menu_1–2.mp3` |
| `INGAME_TRACKS` | game, roundstart, gauntlet, mp | `ingame_*.mp3` (18 tracks) |
| `GAMEOVER_TRACKS` | triggered by `onPlayerLost` | `gameover_1–4.mp3` |
| `BOSS_TRACKS` | season game at step 29 only | `ingame_boss_final.mp3` |

---

## Backlog (priority order)

1. **Test shop end-to-end** — buy coins on dev, confirm credits land
2. **Wire SpecialOffer buy button** — `startCheckout('offer_launch')`
3. **DeckPicker locked/buy state** — check `fo_owned_decks`, show Stripe buy for locked decks
4. **Graphics for new decks** — Brad has images to process
5. **Multiplayer live test** — two real devices
6. **Season map node calibration** — phone testing
7. **Real boss image for THE ARCHITECT**
8. **Interstitial ads** — `Interstitial.jsx` is placeholder; wire PropellerAds or AdSense
9. **Robomouse side-facing sprites** — new art needed
10. **Season 2**
11. **Leaderboard** — stub; needs real data
12. **More decks**
13. **CAL integration** — coins appear in CAL wallet

---

## Version

Current: **v0.27** (session 22, 24 May 2026)
