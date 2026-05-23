# Flip Out! 🃏

A card-matching game with special power-ups, season mode, gauntlet mode, and multiplayer.

**Live:** https://flipout.gizmogames.uk  
**Repo:** https://github.com/braduk72/Flip-Out-

---

## Deployment

Hosted on **Vercel** (project `flip-out`, team `chattocal`).

| Branch | Where it deploys | URL |
|--------|-----------------|-----|
| `main` | **Production** — updates flipout.gizmogames.uk | https://flipout.gizmogames.uk |
| `dev`  | **Preview** only — unique URL per commit, never updates the live domain | `flip-out-git-dev-chattocal.vercel.app` |

> **To ship changes to the live site:**
> ```bash
> git checkout main
> git merge dev --no-edit
> git push origin main
> git checkout dev
> ```
> Vercel auto-builds from `main` and updates flipout.gizmogames.uk within ~2 minutes.

Build command: `npm run build` → output: `dist/`

### APOLLO local server (optional)

`server.js` in the project root is a zero-dependency static server that serves `dist/` on port 5174.
It's registered in pm2 on APOLLO as the process named `flipout`.

```bash
# Rebuild and restart the local server after changes
npm run build
pm2 restart flipout
```

Cloudflare Tunnel on APOLLO routes `flipout.gizmogames.uk` through Vercel (DNS CNAME), **not** through the local server.
The APOLLO pm2 process is a local fallback / development convenience only.

---

## Tech Stack

- React 19 + Vite
- CSS Modules
- Socket.io multiplayer (on CAL backend, port 3001)

---

## Project Structure

```
src/
  screens/     Game, Home, SeasonMap, DeckPicker, Settings, Gauntlet, Shop, etc.
  components/  Card, BottomNav, SpecialOffer, Interstitial, etc.
  hooks/       useGame.js (core reducer), useMultiplayer.js, useSfx.js
  data/        decks.js, specialCards.js, seasonalOpponents.js, opponents.js
public/
  images/      All card/avatar/map sprites (transparent PNGs)
  music/       24 tracks across 3 pools — see Music section below
```

---

## Music System

Three pools, each plays random tracks (no back-to-back repeats), pool switches on screen change:

| Pool | Screens | Files |
|------|---------|-------|
| `MENU_TRACKS` | home, deckpicker, shop, season map, etc. | `menu_1–2.mp3` |
| `INGAME_TRACKS` | game, roundstart, gauntlet, multiplayer | `ingame_*.mp3` (18 tracks) |
| `GAMEOVER_TRACKS` | triggered when player loses a round | `gameover_1–4.mp3` |

Music toggle and pool switching are managed in `App.jsx`. `onPlayerLost` prop on `<Game>` triggers the gameover pool.

---

## Current State — Session 16 (23 May 2026)

### ✅ Done & working
- **Core game** — card matching, special cards (12 types), AI opponent, difficulty levels
- **Solo mode** — count-up timer, personal best per deck+difficulty
- **Gauntlet mode** — 10-round knockout bracket vs AI opponents
- **Season mode** — 5-node season map (4 opponents + boss), cinematic win screen
- **Multiplayer** — Socket.io Quick Match/Create/Join; board sync; special card seed relay; turn reporting; opponent-left detection. **Code complete — live testing in progress**
- **Shop / Lucky Spin / Leaderboard / Avatar picker**
- **Special offer popup** — 80% off flash top-left, countdown timer, one-time display
- **Season map** — animated robomice (3 colours, transparent sprites), tesla coil poles (sparking, 3 colours), 9-layer cloud fog of war, steam emitters, storm clouds + lightning
- **Image backgrounds** — all card/avatar/UI PNGs have transparent backgrounds
- **Music** — 24-track randomised pool system (menu / in-game / game-over)
- **SFX** — Web Audio API sounds (flip, match, no-match, special, win, lose) via `useSfx.js`
- **AI 3-card bug fixed** — ref pattern prevents doAITurn re-firing mid-turn

### ⚠️ Known issues / in progress
- **Multiplayer live testing** — code complete but not yet tested with two real devices
- **Node positions** — season map node positions estimated visually; need calibration on a real phone
- **Boss image** — `l1.png` placeholder used for THE ARCHITECT; real asset needed
- **Robomouse direction** — sprites are forward-facing; scaleX flip in animations doesn't give side-facing look. May need side-facing art.

### 📋 Brad action items
- Continue multiplayer live testing (two devices, Quick Match)
- Supply boss image for THE ARCHITECT
- Decide on side-facing robomouse sprites or keep current art

---

## Dev URL Params

```
?specials=1      — board of all special cards
?unlock=gizmo    — unlock all decks
?resetseason=1   — reset season progress
?resetgauntlet=1 — reset gauntlet progress
?resetoffer=1    — reset special offer popup
```

DEV toolbar toggle also available in-game (small button below board).

---

## Image & Sprite Pipeline

Sprite sheets split using `crop-sprites.mjs` (sharp) — run once after downloading new sheets.  
Background removal using `strip_bg.mjs` (jimp, corner-sampling, threshold 40).  
Both scripts live in the project root. `sharp` and `jimp` are devDependencies.

Raw sprite sheet downloads live in `public/images/downloads/` — gitignored (too large).

---

## Version

Current: **v0.25** (shown in Settings screen)
