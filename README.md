# Flip Out!

A memory card-matching game with a twist — special power cards (Stopwatch, Freeze, Rocket, Tornado and more) shake up every round. Challenge the AI, battle through the Gauntlet, climb the Season Map, or go head-to-head with a friend in real-time multiplayer.

Developed by **Gizmo Games** — a UK Community Interest Company whose mission is to fund a cat sanctuary and free veterinary service for local residents.

---

## Tech Stack

- **Frontend:** React 19 + Vite 8, CSS Modules
- **Native wrapper:** Capacitor 8 (iOS + Android — both platforms created)
- **Hosting:** Vercel (scope: `chattocal`)
- **Backend/API:** Node/Express — in the CAL project (`C:\Users\bradc\OneDrive\Documents\CAL\server`)
- **Database:** PostgreSQL (Neon)
- **Multiplayer:** Socket.io server on Railway (EU West)
- **Payments:** Stripe (live keys in Vercel env vars)
- **Bundle ID:** `uk.gizmogames.flipout`
- **Live URL:** [flipout.gizmogames.uk](https://flipout.gizmogames.uk)
- **Permanent development URL:** [dev.flipout.gizmogames.uk](https://dev.flipout.gizmogames.uk)

---

## Project Location

```
C:\brad\FlipOut
```

> **Do not move this back to OneDrive.** OneDrive silently fails file copy/rename operations and blocks Vercel CLI file reads, causing broken deployments.

---

## Deployment

Standard `vercel deploy` silently 404s images due to file-read issues. Always use the prebuilt method:

**Deploy the `dev` branch only:**
```powershell
Set-Location "C:\brad\FlipOut"

# The custom domain is bound to Git branch `dev` in Vercel. A successful
# deployment of this branch updates https://dev.flipout.gizmogames.uk automatically.
if ((git branch --show-current) -ne 'dev') { throw 'Development deployments must run from branch dev.' }

# 1. Build locally
npx vercel build --yes --scope chattocal

# 2. Deploy prebuilt output
$output = npx vercel deploy --prebuilt --scope chattocal --yes 2>&1
$output | Write-Host
$url = ($output | Select-String 'https://flip-[a-z0-9]+-chattocal\.vercel\.app').Matches[0].Value

# 3. Verify the permanent branch URL (do not create a per-deployment alias)
(Invoke-WebRequest https://dev.flipout.gizmogames.uk -Method Head -UseBasicParsing).StatusCode
```

See [`FLIPOUT_DEPLOYMENT.md`](FLIPOUT_DEPLOYMENT.md) for the branch-domain and DNS configuration, verification commands, and the strict production boundary. Deployment reports should use `https://dev.flipout.gizmogames.uk`; temporary `*.vercel.app` URLs are diagnostic identifiers only.

**Promote to production (gizmogames.uk) — only when Brad says "push to live":**
```powershell
npx vercel promote $url --scope chattocal --yes
```

---

## Project Structure

```
public/
  images/           # All game images
    cards/          # Card decks (cats, babyAnimals, birdsOfPrey, etc.)
    menus/          # Nav bar icons (drop replacements here)
  music/            # All music tracks (27 files)
src/
  components/       # Shared components (BottomNav, SpecialOffer, etc.)
  data/             # Game data (decks, opponents, seasons)
  hooks/            # useGame, useMultiplayer
  screens/          # All screens (Home, Game, Shop, Settings, etc.)
  utils/            # Helpers (deviceId, foShop, etc.)
```

---

## Music Pools

| Pool     | Tracks                                  | Trigger              |
|----------|-----------------------------------------|----------------------|
| HOME     | `Memory_Mayhem_Welcome_to_Flip_Out.mp3` | Home screen only     |
| MENU     | `menu_1`, `menu_2`                      | All other menu screens |
| INGAME   | 18 tracks                               | Any game screen      |
| BOSS     | `ingame_boss_final`                     | Season boss fight    |
| SEASON   | `deal-the-tension`                      | Season map           |
| GAMEOVER | `gameover_1-4`                          | On player loss       |

---

## Nav Icons

Currently using static `b1_` images (no active/inactive states).
Penny's replacement icons go in `public/images/menus/` — tell Felix the filenames to wire them up.

---

## Coin Economy

| Action | Coins |
|---|---|
| Win any round | +10 |
| Daily login bonus | +5 to +50 (7-day streak, resets Tuesdays) |
| Lucky Spin | +1 to +100 (weighted) |
| Bug report | +50 |
| Promo code | variable |

---

## Key localStorage Keys

| Key | Contents |
|---|---|
| `fo_coins` | Coin balance |
| `fo_trophies` | Trophy count |
| `fo_streak` | Daily login streak (days) |
| `fo_pvp_wins` | PVP wins (for leaderboard) |
| `fo_player_id` | FLIP-XXXXX unique ID (not yet implemented) |
| `fo_dlb_last` | Date of last daily bonus claim |
| `fo_dlb_day` | Day in 7-day bonus cycle (0–6) |
| `fo_spin_date` | Date of last Lucky Spin reset |
| `fo_spin_free` | Free spins used today |
| `fo_spin_ad` | Ad spins used today |
| `fo_spin_bonus` | Bonus spins remaining |
| `fo_owned_decks` | JSON array of unlocked deck IDs |
| `fo_device_id` | UUID for this device (Stripe restore) |
| `fo_rob_names` | Assigned names for Rob opponents |

> **Date keys** — always use `toLocaleDateString('en-CA')` for YYYY-MM-DD. Never `toISOString().slice(0,10)` — that gives UTC and causes midnight reset bugs for UK users in BST.

---

## What's Built ✅

- Full vs-AI card matching game with special power cards
- Season mode (30 steps, Rob + E-type opponents, boss battles, SEASON COMPLETE)
- Gauntlet mode
- Multiplayer (built, untested on real devices)
- Lucky Spin (daily free + ad spin, midnight reset in local time)
- Daily Login Bonus modal (7-day streak, resets Tuesdays, coins awarded immediately)
- Coin balance (earn + persist via localStorage)
- Easy/Medium: matched cards stay visible as dimmed card backs
- Shop (decks, Lucky Spin, Restore Purchases)
- Leaderboard (Longest Streak + PVPs Won tabs — placeholder data until Player ID system is live)
- Settings (difficulty, music, SFX)
- Daily spin uses local midnight (not UTC)
- Stripe IAP (web purchases via Stripe, live keys configured)
- Capacitor iOS + Android platforms created

## What's Pending 🔜

- **Player ID system** — FLIP-XXXXX (5 chars, charset: `BCDFGHJKMNPQRSTVWXYZ23456789`), stored server-side, shown under avatar with country flag from IP
- **Leaderboard real data** — wire to server once Player IDs exist
- **Profile screen** — avatar, Player ID, country flag, stats
- **Coin shop screen** — assets ready (`coins_100/500/1000.webp`), not yet wired
- **Shop avatar page** — 100 coins each, seasonal availability
- **TCG Pack system** — rarity tiers, Stripe products, pack opening UI, trade board
- **Android Studio build** (Windows)
- **iOS TestFlight** (Mac + Xcode required)
- **Apple IAP / Google Play Billing** — for native coin purchases
- **Multiplayer live test** — two real devices
- Opponent portraits for all season/gauntlet opponents
- Season COMPLETE screen celebration + gold card display

---

## Gotchas

- **PWA caching** — after deploy, use incognito to see changes. Hard refresh does NOT bypass the service worker.
- **OneDrive + Vercel** — never use standard `vercel deploy`. Always `vercel build` then `deploy --prebuilt`.
- **Music pool switching** — `activePoolRef` must be nulled when entering a game screen from a non-game screen.
- **Never auto-promote** — always deploy to dev first. Only promote when Brad says "push to live".

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root — screen routing, music manager, nav props |
| `src/screens/Game.jsx` | Core game logic (VS, Solo, MP, Season, Gauntlet) |
| `src/hooks/useGame.js` | Board state, card flipping, scoring |
| `src/hooks/useMultiplayer.js` | Socket.io multiplayer hook |
| `src/data/decks.js` | All card deck definitions |
| `src/data/opponents.js` | Gauntlet + standard AI opponents |
| `src/data/seasonalOpponents.js` | Season map opponents + boss |

---

## Credits

Code by Claude Sonnet 4.6, Graphics by ChatGPT. This project would not have been possible without their invaluable assistance.

© 2026 Gizmo Games. All rights reserved.
