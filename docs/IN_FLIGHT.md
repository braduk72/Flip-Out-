# IN_FLIGHT — Currently active work on Flip Out!

This file tracks who is working on what, right now.
**Read this before starting any task. Claim your task here before touching code. Update when done.**

_Last updated: 23 May 2026 (session 19)_

---

## ⚠️ Standing warnings — read before touching anything

- **NEVER push to `main` without Brad's explicit say-so.** Push to `dev` only → tell Brad to test → wait for approval before merging to main.
- **Dev site:** Vercel preview build of the `dev` branch. Production (`flipout.gizmogames.uk`) is `main`.
- **Image cache-bust:** All season map sprite URLs carry `?v=3`. If sprites are replaced, bump the `V` constant in `SeasonMap.jsx`.
- **All images are WebP.** No `.png` files remain in `public/images/`. Do not add new `.png` files — always use `.webp`.
- **390px cap** — `#root { width: min(390px, 100vw) }`. Desktop and mobile have identical effective layout.

---

## ⏳ Pending Brad action

- **Approve dev → main merge** — all session 19 changes are on `dev`, tested, waiting for Brad's go-ahead.
- **Cloudflare tunnel for `dev.gizmogames.uk`** — add public hostname in Zero Trust dashboard: subdomain `dev`, domain `gizmogames.uk`, service HTTP `localhost:5174`. Not yet confirmed done.
- **Test multiplayer live** — two real devices needed. Code is complete but untested end-to-end.
- **Real boss image for THE ARCHITECT** — `l1.webp` is a placeholder. Brad has the real asset.

---

## 🔨 Claude Code

_(nothing currently claimed)_

## 📋 Brad

- **Dev → main merge approval** — test on dev site and give the word.
- **Multiplayer live test** — two devices, two accounts.

---

## Recently completed (session 20 — 23 May 2026)

- ✅ Boom card fix — `turn: otherTurn(whose)` changed to `turn: whose`; attacker now keeps their turn after boom so they can flip using the revealed neighbours — Claude Code

## Recently completed (session 19 — 23 May 2026)

- ✅ Season auto-reset — after beating the final boss `seasonStep` resets to 0 so the season is immediately replayable; gold card + 150 coins still awarded — Claude Code
- ✅ X-ray fix — player now keeps their turn after playing xray; peek guard only registers taps when player played the card; AI xray auto-closes after 2.5s and AI continues its turn — Claude Code
- ✅ Bolt fix — attacker keeps their turn after playing bolt; opponent is stunned for their next turn (not immediately skipped); shield-blocked bolt still forfeits attacker's turn — Claude Code
- ✅ Gauntlet quit → Home — QUIT & LOSE now routes to Home (not Round 1); gauntlet step still resets to 0; new `onQuit` prop on Game component — Claude Code
- ✅ Facebook icon transparent background — BFS flood-fill stripped near-white background from `face10.webp` — Claude Code
- ✅ Shield badge — 54px shield card image shown beneath each avatar portrait when shield is active; pulses with blue glow animation; redundant 🛡️ text emoji removed from labels — Claude Code

## Recently completed (session 18 — 23 May 2026)

- ✅ Season map background fix — added `background: #0d0818` to `.mapCanvas`; transparent PNG areas now show dark sky instead of checkerboard — Claude Code
- ✅ SpecialOffer popup icon fix — removed `mix-blend-mode: multiply` from `.itemIcon`; icons with dark backgrounds were near-invisible against dark chip — Claude Code
- ✅ Boss music — Grid Overdrive track added as `ingame_boss_final.mp3`; dedicated `BOSS_TRACKS` pool; triggers when `screen === 'seasongame' && seasonStep >= SEASON_NODES.length - 1` — Claude Code
- ✅ Image caching — `vercel.json` added with 30-day `Cache-Control` headers for `/images/` and `/music/` — Claude Code
- ✅ WebP conversion — all 397 PNG images converted to WebP with per-category resize targets; 635MB saved (658MB → ~22MB); all 113 source references updated — Claude Code
- ✅ `mix-blend-mode: multiply` restored on `.mouseWrap` — CSS workaround for OneDrive-locked mouse WebP files that retained white backgrounds — Claude Code
- ✅ Tesla coil sprites — white box fixed; `?v=3` cache-bust bumped — Claude Code
