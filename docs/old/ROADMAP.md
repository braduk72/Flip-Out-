# Flip Out! Roadmap
_Last updated: 23 May 2026 (session 19). Update this file at the end of every session._

---

## 🔴 PICK UP HERE — Next session starts with this

### Current state: dev branch fully patched, waiting for Brad's approval to merge to main.

1. **Brad approves dev → main merge** — all session 18+19 work (WebP, caching, boss music, bug fixes, shield badge) is on `dev`. Brad tests, gives the word.
2. **Multiplayer live test** — code complete, never tested with two real devices. Top priority after merge.
3. **Season map node calibration** — node positions estimated visually. Need calibration on a real phone.
4. **Real boss image** — `l1.webp` for THE ARCHITECT is a placeholder. Brad has the real artwork.

---

## ✅ DONE — Built and deployed (on `dev`, awaiting main merge)

### Core gameplay
- Card matching vs AI — Easy / Medium / Hard / Lethal difficulties
- 12 special cards — freeze, boom, tornado, magnet, bolt, rocket, dice, shield, stopwatch, crown, xray, random, shuffle
- Solo mode — count-up timer, personal best per deck + difficulty
- Multiplayer — Socket.io /flipout namespace; Quick Match / Create / Join; board sync; special card seed relay; turn reporting ✅ code complete, needs live test
- Joker system — one per day per owned paid deck; auto-completes a match
- Gauntlet — 10-opponent knockout bracket; Professor Claw final boss; gold card reward
- Season 1 — 4 opponents + THE ARCHITECT final boss; season map with fog of war; auto-resets after completion
- Boss music — Grid Overdrive exclusive track for THE ARCHITECT fight

### Shop & economy
- Coin system — earn and spend
- Lucky Spin
- Shop with Bonus Chest (400 coins, includes freeze card)
- Special Offer popup — timed, one-shot, discount badge

### Visuals & UI
- 9 card decks (1 free, 8 paid)
- Season 1 map — animated robomice (3 colours), tesla coils (3 colours), 9-layer fog of war, electric storm clouds + lightning
- 4 gameshow stage backgrounds
- Avatar picker (4 avatars)
- Shield badge — card image shown beneath portrait when active, pulsing blue glow
- Portrait defeated-spin cinematic on gauntlet/season win

### Infrastructure
- All images WebP, appropriately resized — 635MB savings
- 30-day browser caching via `vercel.json`
- 3-pool music system — menu, in-game (18 tracks), game-over (4 tracks), boss (1 track)
- Dev / prod branch split — `dev` → Vercel preview; `main` → flipout.gizmogames.uk

---

## 🔧 KNOWN ISSUES

| Issue | Status |
|---|---|
| Robomouse sprites face forward | Side-facing art needed — sprites currently front-on |
| THE ARCHITECT boss image | `l1.webp` is placeholder — real artwork from Brad needed |
| Season map node positions | Estimated visually — calibration needed on real phone |
| Multiplayer untested | Code complete but no live test yet |
| `dev.gizmogames.uk` tunnel | Brad needs to add Cloudflare Zero Trust hostname |

---

## 📋 BACKLOG — Priority order

### Immediate / next session
- **Multiplayer live test** — two real devices, report bugs
- **Season map node calibration** — tweak `NODE_POSITIONS` array based on phone testing
- **Real boss image** — drop Brad's artwork in as `public/images/l1.webp`

### Short term
- **Robomouse side-facing sprites** — new art needed; current sprites are front-on
- **Season 2** — new opponents, new map, new theme
- **Leaderboard** — currently a stub; wire up real data
- **Sound effects audit** — check every special card has a satisfying SFX
- **Interstitial ads** — currently a placeholder component; wire up real ad network

### Medium term
- **More decks** — currently 9; expand library
- **Achievement badges** — login streaks, first win, gauntlet clear, etc.
- **Push notifications** — re-engage lapsed players
- **CAL integration** — coins earned in Flip Out appear in CAL wallet

### Long term / ideas
- **Season 3+** — ongoing seasonal content
- **Tournament mode** — bracket play with multiple players
- **Daily challenge** — fixed board, global leaderboard for that day
- **Spectator mode** — watch multiplayer games live

---

## 💡 IDEAS PILE

- Animated card back designs (per deck)
- Card flip particle effects
- Opponent taunts / reaction emotes during game
- Seasonal cosmetic skins for the game board
- Replay system — watch your last game back
