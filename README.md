# Flip Out! — Project README & Handover

_Last updated: 24 May 2026 — v0.1.38_

> Card-matching game for Gizmo Games. React 19 + Vite PWA, deployed to Vercel at [dev.gizmogames.uk](https://dev.gizmogames.uk).

---

## Quick Links

| | |
|---|---|
| **Dev deployment** | https://dev.gizmogames.uk |
| **Vercel project** | chattocal / flip-out |
| **Roadmap** | [docs/ROADMAP.md](docs/ROADMAP.md) |
| **Patch notes** | [docs/PATCH_NOTES.md](docs/PATCH_NOTES.md) |

---

## Team

- **Brad** — product owner / designer brief
- **Clara (ChatGPT)** — all artwork and assets
- **Felix (Claude)** — all engineering

---

## Tech Stack

- **React 19** + **Vite 8** — SPA, CSS Modules throughout
- **Vercel** — hosting + CDN (project `flip-out` under `chattocal` scope)
- **Firebase Realtime DB** — multiplayer matchmaking
- **Stripe** — IAP / coin purchases (web flow)
- **LocalStorage** — game state, coins, settings, season progress

---

## CRITICAL: Deployment Method

> **Standard `vercel deploy` silently fails on OneDrive** — Vercel CLI reads image files from the OneDrive virtual filesystem and produces 0-byte uploads. **Always use the prebuilt method.**

```powershell
Set-Location "C:\Users\bradc\OneDrive\Documents\FlipOut"

# 1. Build locally (Vite reads OneDrive correctly)
npx vercel build --yes --scope chattocal

# 2. Deploy the prebuilt output
$output = npx vercel deploy --prebuilt --scope chattocal --yes 2>&1
$output | Write-Host
$url = ($output | Select-String 'https://flip-[a-z0-9]+-chattocal\.vercel\.app').Matches[0].Value

# 3. Alias to dev domain
npx vercel alias $url dev.gizmogames.uk --scope chattocal
```

---

## CRITICAL: File Copies on OneDrive

> **bash `cp` silently fails on OneDrive.** Always use PowerShell raw bytes copy:

```powershell
$bytes = [System.IO.File]::ReadAllBytes("source\path\file.webp")
[System.IO.File]::WriteAllBytes("dest\path\file.webp", $bytes)
```

Or via Node.js:
```js
fs.writeFileSync(dest, fs.readFileSync(src))
```

---

## Asset Pipeline

Clara (ChatGPT) generates all artwork as PNGs with transparent backgrounds.

1. Clara drops files into `public/images/downloads/` (or a subfolder)
2. Felix converts PNGs to webp using `sharp` (`quality: 88`)
3. Felix copies webps to `public/images/` via Node.js or PowerShell raw bytes
4. Processed source files moved to `public/images/downloads/removed/`

**Naming conventions:**
- Nav icons: `home_icon.webp`, `shop_icon.webp`, `ranks_icon.webp`, `settings_icon.webp`
- Coin shop: `coins_100.webp`, `coins_500.webp`, `coins_1000.webp`
- Buttons: `back_button.webp`, `close_button.webp`, `confirm_button.webp`, etc.
- Backgrounds: `bg_home.webp`
- Opponents: `rob1.webp`–`rob5.webp`, `rob1d.webp`–`rob5d.webp` (defeated)

---

## Project Structure

```
src/
  screens/         # One file per screen (JSX + CSS Module pair)
    Home.jsx / Home.module.css
    Game.jsx / Game.module.css
    Shop.jsx / Shop.module.css
    Settings.jsx
    SeasonMap.jsx
    Gauntlet.jsx
    AvatarPicker.jsx
    DeckPicker.jsx
    Leaderboard.jsx
    LuckySpin.jsx
    Multiplayer*.jsx
  components/
    BottomNav.jsx   # 4-icon nav bar, shown on most screens
    AdBanner.jsx
    SpecialOffer.jsx
  utils/
    foShop.js       # Stripe integration + restore purchases
    aiLogic.js      # AI opponent logic (difficulty levels)
    cards.js        # Card deck definitions
    decks.js        # Deck configs + unlock state
  App.jsx           # Top-level router (screen state machine)
public/
  images/           # All game assets (webp)
  audio/            # Background music + SFX
```

---

## Key localStorage Keys

| Key | Purpose |
|---|---|
| `fo_coins` | Coin balance (integer string) |
| `fo_owned_decks` | JSON array of unlocked deck IDs |
| `fo_season_step` | Season progress (0–30) |
| `fo_gauntlet_step` | Gauntlet round progress |
| `fo_avatar` | Selected avatar portrait filename |
| `fo_difficulty` | `Easy` / `Medium` / `Hard` |
| `fo_music` | `1` / `0` |
| `fo_sfx` | `1` / `0` |
| `fo_rob_names` | JSON map of Rob opponent names per step |

---

## Screens & Navigation

App.jsx manages a `screen` state string. Navigation is prop callbacks (`onPlay`, `onBack`, etc.) — no router library.

```
home → deckpicker → game → home
home → season → game → season
home → gauntlet → game → gauntlet
home → shop
home → avatar
home → leaderboard
home → settings
home → multiplayer lobby → game
```

---

## Game Modes

| Mode | Description |
|---|---|
| `vs` | Player vs AI, normal flip-match |
| `solo` | Time Challenge — solo, beat the clock |
| `season` | Season map campaign (30 steps, Rob + E-type opponents) |
| `gauntlet` | Gauntlet mode — escalating difficulty |
| `online` | Multiplayer (Firebase, untested) |

---

## Season Map

- 30 steps: steps 1–5 = Rob opponents, step 6/11/16/21/26/31 = E-type (KNOCKOUT_OPPONENTS)
- Rob names randomly assigned from pool, persisted per device in `fo_rob_names`
- Defeated portraits: `rob1d.webp`–`rob5d.webp`
- Season 1 name: "CAT-astrophe!"
- SEASON COMPLETE state reached after beating step 30 boss (no replay yet — backlog)

---

## Current State (v0.1.38)

### What's working
- Full game loop (VS, Time Challenge, Season, Gauntlet)
- All special cards (tornado, freeze, rocket, crown, shuffle, shield, stopwatch, bolt)
- Season map with 30 steps, Rob opponents, E-type bosses
- Coin balance display (localStorage)
- Avatar picker, deck picker (locked decks show padlock)
- Shop screen (Stripe checkout wired, not fully tested)
- Lucky spin
- Leaderboard (placeholder data)
- Settings (difficulty, music, sfx, restore purchases)
- Special offer modal
- Multiplayer lobby + game built (Firebase, **untested**)
- Background music + SFX toggle
- Home screen: whimsical carnival background, two-column icon grid, image PLAY button, carnival-theme nav icons

### Immediately next
- Test coin shop purchase flow end-to-end on dev
- Wire `coin_balance_bar.webp` (batch_07) to replace `coin_bar.webp` in home top bar
- Wire `continue_button.webp` to game-over / continue flow
- Wire opponent portrait images (several robot cat PNGs in downloads awaiting conversion)
- First live multiplayer test (two real devices)

### Known issues
- Season COMPLETE — no way to reset/replay (intentional for now)
- Multiplayer untested — needs real two-device session
- `play_button.webp` (batch_07, 363×110) appears mislabelled — visual content looks like a coin bar UI rather than a play button; review with Clara

---

## Batch Asset History

| Batch | Contents |
|---|---|
| batch_01 | Original mockup assets (superseded) |
| batch_02 | Production UI webps (superseded) |
| batch_03 | Split transparent webps |
| batch_04 | Nav icons, pill buttons, settings, mascot |
| batch_05 | Season banner, special offer panel, avatar states, shop buttons, coin multipliers, energy/gem bars |
| batch_06 | Back/close/confirm/cancel/pause/undo/lock buttons, daily reward panel, paw spinner |
| batch_07 | Nav icons (carnival theme), play/continue/claim buttons, coin/gem/energy bars, blank popup panel, daily reward panel, notification badge, mail/gift/profile icons |

---

## Coin Shop Assets (ready to wire)

| File | Content |
|---|---|
| `public/images/coins_100.webp` | 100 Coins — 99p chest |
| `public/images/coins_500.webp` | 500 Coins — £3.99 chest |
| `public/images/coins_1000.webp` | 1000 Coins — £6.99 BEST VALUE chest |

Products defined in `src/utils/_products.js`.

---

## Other Unprocessed Assets (in downloads/)

| File | Identified as |
|---|---|
| `image.png` | PLAY button (compact, paw prints) — converted to `play_btn.webp` |
| `play_large.webp` | PLAY button (wide, light-bulb border) — in downloads, not yet wired |
| `continue.png` | CONTINUE button — converted to `continue_btn.webp` |
| `gameover.png` | TRY AGAIN button |
| `9ba85f01...png` | TRY AGAIN button (alternate) |
| `ChatGPT Image May 23 08_55_*.png` | Robot cat portraits (Rob opponents) |
| `ChatGPT Image May 23 08_59_09 PM (1).png` | "Defeated" ribbon banner |
| `06390f2f...png` | Orange/ginger cat — defeated avatar portrait |
| Various UUID PNGs | Unidentified — review with Clara |

---

_Code by Claude Sonnet 4.6, Graphics by ChatGPT. This project would not have been possible without their invaluable assistance._
