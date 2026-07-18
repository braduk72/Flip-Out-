# Flip Out! — Handover for Codex

**Purpose:** This document hands the project over to Codex (OpenAI) for continued
development while the Claude Max subscription is paused. It records **where
everything lives — locally and online** — plus the deploy flow, credentials
map, and known gotchas.

_Prepared: 18 July 2026._

> Read this first, then read `README.md` and `docs/old/IN_FLIGHT.md`. Where this
> document and the README disagree, **this document is newer** (see "Corrections
> to the README" at the bottom).

---

## 1. What the project is

**Flip Out!** — a memory card-matching game with special power cards
(Stopwatch, Freeze, Rocket, Tornado, and more). Modes: vs-AI, Season (30-step
map with boss battles), Gauntlet, and real-time multiplayer.

- **Studio:** Gizmo Games (UK Community Interest Company).
- **Bundle ID:** `uk.gizmogames.flipout`
- **Version:** `1.0.0` (`src/version.js`) / app version string `APP_VERSION`.

---

## 2. Where the code lives

### Online (source of truth)
| Thing | Location |
|---|---|
| Git remote | GitHub `braduk72/Flip-Out-` |
| Production branch | `main` |
| Active dev branch (this handover) | `claude/flip-out-discussion-yqq0bm` |
| Historical dev branch | `dev` (referenced in old docs; confirm it still exists) |

> **Branching:** Historically the flow was **push to `dev` → Brad tests → merge
> to `main`**. Never push straight to `main` without Brad's explicit OK. Codex
> should agree a branch name convention with Brad on day one.

### Locally (on Brad's Windows machine)
| Thing | Path |
|---|---|
| Project root | `C:\brad\FlipOut` |
| **Do NOT** use | `C:\Users\bradc\OneDrive\...` — OneDrive silently breaks file copy/rename and blocks deploy file reads |
| Separate backend project (per README) | `C:\Users\bradc\OneDrive\Documents\CAL\server` (the "CAL" project) |

---

## 3. Tech stack

- **Frontend:** React 19 + Vite 8, CSS Modules. Entry `src/main.jsx` → `src/App.jsx`.
- **Native wrapper:** Capacitor 8 — iOS + Android platforms both created
  (`ios/`, `android/`). `capacitor.config.json`: appId `uk.gizmogames.flipout`,
  webDir `dist`.
- **Hosting:** **Cloudflare Pages** (see §5 — this changed recently; README still says Vercel).
- **Serverless API:** `api/*.js` — Vercel-style `export default handler(req, res)` functions (see §6, needs review under Cloudflare).
- **Database:** PostgreSQL on **Neon** (`DATABASE_URL`).
- **Multiplayer:** Socket.io server on **Railway** (EU West). Client points at it via `VITE_SERVER_URL`.
- **Payments:** **Stripe** (live keys, web checkout).
- **Transactional email:** **Resend** (`RESEND_API_KEY`) — used by bug-report / redeem flows.

### npm scripts (`package.json`)
```
npm run dev      # Vite dev server (port 5173; see .claude/launch.json)
npm run build    # vite build → dist/
npm run preview  # preview built dist/
npm run lint     # eslint .
```

---

## 4. Repository map

```
src/
  App.jsx                 # Root: screen routing + music manager + nav props
  main.jsx                # React entry
  version.js              # APP_VERSION = '1.0.0'
  screens/                # One folder-less .jsx + .module.css per screen:
                          #   Home, Game, Shop, Settings, SeasonMap, Gauntlet,
                          #   Leaderboard, LuckySpin, DeckPicker, AvatarPicker,
                          #   MultiplayerLobby, RoundStart, RevealGame,
                          #   AboutUs, PrivacyPolicy, PatchNotes
  components/             # BottomNav, Card, DailyBonus, CookieBanner, AdBanner,
                          #   Interstitial, SpecialOffer, RemoveAdsModal, ErrorBoundary
  hooks/                  # useGame (board/scoring), useMultiplayer (socket.io), useSfx
  data/                   # decks, opponents, seasonalOpponents, specialCards, promoCodes
  utils/                  # deviceId, foShop, gameStorage
api/                      # Serverless endpoints (Stripe, restore, bug report, etc.)
public/
  _headers                # Cloudflare Pages cache rules (replaces old vercel.json)
  images/                 # All game art — WebP only (see gotchas)
  music/                  # 27 tracks
  sounds/                 # SFX
  manifest.json           # PWA manifest
  patchnotes.json         # Feeds the PatchNotes screen
  about.html, privacy.html, ads.txt, favicon.svg, icons/
server.js                 # Tiny Node static server for dist/ on :5174 (Cloudflare Tunnel option)
docs/old/                 # ROADMAP.md, IN_FLIGHT.md (historical, session-20 era)
*.mjs / *.cjs             # One-off asset conversion scripts (webp, sprite crop, etc.)
```

### Key files to know
| File | Purpose |
|---|---|
| `src/screens/Game.jsx` | Core game logic (VS, Solo, MP, Season, Gauntlet) |
| `src/hooks/useGame.js` | Board state, card flipping, scoring |
| `src/hooks/useMultiplayer.js` | Socket.io multiplayer hook |
| `src/data/decks.js` | All card deck definitions |
| `src/data/opponents.js` | Gauntlet + standard AI opponents |
| `src/data/seasonalOpponents.js` | Season map opponents + boss |
| `src/utils/gameStorage.js` | localStorage read/write helpers |

---

## 5. Hosting & deployment (READ CAREFULLY — recently changed)

> ⚠️ **THREE hosting providers are all connected to this repo and auto-build on
> every push.** Confirmed on PR #1 (commit `15cbce0`), where all three posted
> successful deploys. **Which one serves production `flipout.gizmogames.uk` is
> currently UNCONFIRMED — Brad was not certain (18 Jul 2026). Codex must confirm
> before touching deploy config.** Leaving two of them connected risks a stale
> provider silently serving prod or previews.

| Provider | Project(s) | Preview URL seen on PR #1 | Notes |
|---|---|---|---|
| **Cloudflare Pages** | `flip-out`, `flip-out-dev` | `…flip-out.pages.dev`, `…flip-out-dev.pages.dev` | Two projects (prod + dev). Latest `main` commit points here (`_headers`) — most likely intended prod |
| **Vercel** | `flip-out`, `flip-out-3mtb` (scope `chattocal`) | `flip-out-git-…-chattocal.vercel.app` | Two projects; matches the `api/` Vercel handler signature (§6) |
| **Netlify** | `unique-tulumba-0eb9a5` | `deploy-preview-1--unique-tulumba-0eb9a5.netlify.app` | Also building — purpose unclear |

**Action for Codex:** ask Brad which provider is authoritative for production, then
**disconnect the other two** from the repo to stop confusing/duplicate deploys.

---

The project **appears to have moved off Vercel onto Cloudflare Pages**. Latest
commit on `main`: `157344e — chore: replace vercel.json with Cloudflare _headers`.

- **Cache rules** now live in `public/_headers` (Cloudflare Pages format):
  HTML/root = `no-store`; `/images/*` and `/music/*` = 30-day cache with SWR.
- The README's PowerShell **`vercel build` + `vercel deploy --prebuilt`** flow is
  **stale** for the front-end. Confirm the current Cloudflare Pages deploy trigger
  with Brad — Pages typically auto-builds from a connected GitHub branch
  (build command `npm run build`, output dir `dist`). **Verify which branch maps
  to production vs preview in the Cloudflare Pages dashboard.**
- **Alternative local-serve path:** `server.js` serves `dist/` on `:5174` behind a
  Cloudflare Tunnel — this was the `dev.gizmogames.uk` mechanism. May or may not
  still be in use.

**Domains**
- Production: `https://flipout.gizmogames.uk`
- Dev: `https://dev.gizmogames.uk`

**Rule:** deploy to **dev first**, get Brad's sign-off, only then promote to
production. Never auto-promote.

---

## 6. Serverless API (`api/`) — NEEDS A DECISION

These files use the **Vercel serverless signature** (`export default async
function handler(req, res)` with `res.status().json()`):

| File | Does |
|---|---|
| `api/_products.js` | Product catalogue (shared import) |
| `api/fo-checkout.js` | Stripe Checkout session create |
| `api/fo-webhook.js` | Stripe webhook receiver |
| `api/fo-verify.js` | Verify a purchase |
| `api/fo-restore.js` | Restore purchases by device UUID |
| `api/fo-redeem-code.js` | Redeem promo codes |
| `api/fo-bug-report.js` | Bug report intake (awards coins; emails via Resend) |
| `api/fo-sync-stats.js` | Sync player stats to DB |

⚠️ **Cloudflare Pages Functions use a different signature** (`onRequest({ request,
env })`), not `(req, res)`. So one of these is true and Codex must confirm which:
1. The `api/` functions still run **on Vercel** (front-end on Cloudflare, API on
   Vercel), or
2. They run on the separate **CAL server** (`.../CAL/server`), or
3. They still need **porting** to Cloudflare Pages Functions / Workers.

**Do not assume.** Ask Brad where the live API is served from before editing these.
As of 18 Jul 2026 Brad was **not certain** which of the three options is live — and
since **two Vercel projects** (`flip-out`, `flip-out-3mtb`) are both connected
(§5), the API may still be served from one of them. Confirm before editing.

---

## 7. Environment variables & credentials

**Never commit secrets.** `.env` in the repo only holds the non-secret
`VITE_SERVER_URL` (currently `http://localhost:3001` for local dev — points at the
Socket.io multiplayer server in production).

Server-side vars referenced by `api/` (set in the hosting dashboard, not in git):
| Var | Used for |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (SSL) |
| `STRIPE_SECRET_KEY` | Stripe live secret key |
| `STRIPE_FO_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `RESEND_API_KEY` | Resend transactional email |
| `FO_URL` | Base URL for redirects (defaults to `https://flipout.gizmogames.uk`) |

Client build var:
| Var | Used for |
|---|---|
| `VITE_SERVER_URL` | Socket.io multiplayer server URL (Railway in prod) |

> Brad holds the actual secret values in the hosting provider dashboards
> (Cloudflare / Vercel / Railway / Neon / Stripe / Resend). Codex will need Brad to
> provide or confirm these to run the API or multiplayer locally.

---

## 8. Client-side persistence (localStorage keys)

Player progress is stored in the browser (via `src/utils/gameStorage.js`). Key ones:
| Key | Contents |
|---|---|
| `fo_coins` | Coin balance |
| `fo_trophies` | Trophy count |
| `fo_streak` | Daily login streak (days) |
| `fo_pvp_wins` | PVP wins (leaderboard) |
| `fo_owned_decks` | JSON array of unlocked deck IDs |
| `fo_device_id` | UUID for this device (Stripe restore) |
| `fo_dlb_last` / `fo_dlb_day` | Daily-login-bonus tracking (7-day cycle, resets Tuesdays) |
| `fo_spin_date` / `fo_spin_free` / `fo_spin_ad` / `fo_spin_bonus` | Lucky Spin state |
| `fo_player_id` | FLIP-XXXXX unique ID (**not yet implemented server-side**) |

> **Date bug rule:** always format dates with `toLocaleDateString('en-CA')` for
> `YYYY-MM-DD`. **Never** `toISOString().slice(0,10)` — that's UTC and causes
> midnight-reset bugs for UK users during BST.

---

## 9. What's built ✅ vs pending 🔜

**Built:** vs-AI game with special cards, Season mode (30 steps + bosses),
Gauntlet, multiplayer (untested on real devices), Lucky Spin, daily login bonus,
coin economy, shop (decks + Restore Purchases), leaderboard (placeholder data),
settings, Stripe web IAP, Capacitor iOS + Android platforms, cookie banner,
easy-win / cannot-win end modals, game-over screens.

**Pending:**
- **Player ID system** — `FLIP-XXXXX` (5 chars, charset
  `BCDFGHJKMNPQRSTVWXYZ23456789`), server-side, shown under avatar with country
  flag from IP. This unblocks real leaderboard + profile.
- Real leaderboard data (wire to server once Player IDs exist).
- Profile screen (avatar, Player ID, country flag, stats).
- Coin shop screen (assets ready: `coins_100/500/1000.webp`, not wired).
- Shop avatar page (100 coins each, seasonal).
- TCG Pack system (rarity tiers, Stripe products, pack-opening UI, trade board).
- Android Studio build (Windows) + iOS TestFlight (needs Mac + Xcode).
- Apple IAP / Google Play Billing for native coin purchases.
- Live multiplayer test on two real devices.
- Opponent portraits for all season/gauntlet opponents.
- Season COMPLETE celebration screen.

---

## 10. Gotchas (things that will bite you)

- **PWA / service-worker caching:** after a deploy, a hard refresh does **not**
  bypass the service worker. Test in **incognito** to see changes.
- **Images are WebP only.** No `.png` in `public/images/`. Never add new `.png` —
  convert to `.webp` (see the `convert_*.cjs` / `*.mjs` scripts).
- **Sprite cache-bust:** season-map sprite URLs carry a `?v=` query. If sprites
  are replaced, bump the version constant in `SeasonMap.jsx`.
- **390px layout cap:** `#root { width: min(390px, 100vw) }` — desktop and mobile
  share one effective layout. Design for a phone.
- **Music pool switching:** `activePoolRef` must be nulled when entering a game
  screen from a non-game screen, or the wrong pool keeps playing.
- **OneDrive:** never run the project from OneDrive (breaks deploys). Root is
  `C:\brad\FlipOut`.
- **Never auto-promote to production.** Dev first, Brad tests, then promote.

---

## 11. Corrections to the current README

The `README.md` predates the Cloudflare move. When they conflict, trust this doc:
1. **Hosting is Cloudflare Pages, not Vercel** — cache config is `public/_headers`,
   not `vercel.json`. The PowerShell `vercel build/deploy` steps in the README are
   stale for the front-end.
2. **The `api/` functions still carry the Vercel handler signature** — confirm
   where they're actually served (Vercel? CAL server? need porting) before editing.
3. **README credits "Code by Claude Sonnet 4.6."** Going forward, code is by Codex.

---

## 12. First-day checklist for Codex

1. Clone `braduk72/Flip-Out-`; `npm install`; `npm run dev` (loads on :5173).
2. **Untangle hosting first (§5).** Five deploy targets across three providers are
   all connected: Cloudflare Pages (`flip-out`, `flip-out-dev`), Vercel
   (`flip-out`, `flip-out-3mtb`), Netlify (`unique-tulumba-0eb9a5`). Confirm with
   Brad which serves production `flipout.gizmogames.uk`, disconnect the rest, and
   confirm **where the live API runs** (Vercel vs CAL server vs to-be-ported).
3. Get the secret env values (or a `.env` for local API/multiplayer) from Brad.
4. Confirm the branch convention (historical flow: `dev` → test → `main`).
5. Read `docs/old/IN_FLIGHT.md` and `docs/old/ROADMAP.md` for prior context.
6. Pick up the top pending item (**Player ID system** unblocks the most).
