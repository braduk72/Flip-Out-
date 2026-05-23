# Flip Out! 🃏

A card-matching game with special power-ups, season mode, gauntlet mode, and multiplayer.

**Live:** https://gizmogames.uk (`main` branch)
**Dev:** https://dev.gizmogames.uk (`dev` branch)
**Repo:** https://github.com/braduk72/Flip-Out-

---

## Tech Stack

- React 18 + Vite
- CSS Modules
- Socket.io multiplayer (on CAL Railway backend)
- Cloudflare Pages (auto-deploy from GitHub — **currently broken for `dev` branch, see below**)

---

## Deployment

| Branch | URL | Auto-deploy |
|--------|-----|-------------|
| `dev`  | dev.gizmogames.uk | ⚠️ Webhook broken — manual retrigger needed |
| `main` | gizmogames.uk | ✅ |

**To fix dev deployment:** dash.cloudflare.com → Workers & Pages → FlipOut → Deployments → Retry latest, or reconnect GitHub webhook.

Build command: `npm run build` → output: `dist/`

---

## Project Structure

```
src/
  screens/     Game, Home, SeasonMap, DeckPicker, Settings, Gauntlet, Shop, etc.
  components/  Card, BottomNav, SpecialOffer, Interstitial, etc.
  hooks/       useGame.js (core reducer), useMultiplayer.js
  data/        decks.js, specialCards.js, seasonalOpponents.js, opponents.js
public/
  images/      All card/avatar/map sprites (many stripped of backgrounds via jimp)
  music/       deal-the-tension.mp3 (main), season1.mp3 (missing — falls back to main)
```

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
- **Season map** — animated robomice (3 colours), tesla coil poles (sparking, static), 9-layer cloud fog of war, steam emitters, storm clouds + lightning
- **Image backgrounds stripped** — all card/avatar/UI PNGs have transparent backgrounds

### ⚠️ Known issues / in progress
- **Cloudflare dev not deploying** — all new sprites/assets are in git but Cloudflare hasn't rebuilt. Retrigger manually.
- **AI taking multiple turns** — when AI matches a pair it goes again (valid logic), but may feel wrong. Investigate if it's going more than expected.
- **No sounds** — sfxOn state is wired but no actual SFX playback implemented yet
- **Incomplete card grid** — Easy mode (5 pairs + 1 special = 11 cards) gives a partial last row. Needs total cards rounded up to next multiple of 4.
- **season1.mp3 missing** — seasonal music not created yet; falls back silently to main music
- **Node positions not calibrated** — season map node positions estimated visually, need calibration on real device
- **Boss placeholder** — `l1.png` used for THE ARCHITECT; real asset needed

### 📋 Brad action items
- Trigger Cloudflare Pages manual redeploy for dev branch
- Continue multiplayer live testing (two tabs, Quick Match)
- Report any further game bugs
- Create season1.mp3
- Supply boss image for THE ARCHITECT

---

## Dev Helpers

```
?specials=1      — board of all special cards
?unlock=gizmo    — unlock all decks
?resetseason=1   — reset season progress
?resetgauntlet=1 — reset gauntlet progress
?resetoffer=1    — reset special offer popup
```

DEV toolbar toggle is also available in-game (small button below board).

---

## Image Pipeline

Backgrounds stripped using `strip_bg.mjs` (jimp, corner-sampling, threshold 40).
Sprite sheets split using `split_assets.mjs` and `split_sprites.mjs`.
Both scripts are in the project root. `jimp` is installed as a devDependency.

---

## Version

Current: **v0.25** (shown in Settings screen)
