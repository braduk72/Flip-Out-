# Flip Out! — Roadmap & Backlog

_Last updated: 24 May 2026_

---

## In Progress / Next Up

- First live multiplayer test
- Opponent avatars (portrait images for all seasonal + gauntlet opponents)
- **Coin shop screen** — `coins_100.webp`, `coins_500.webp`, `coins_1000.webp` ready in `public/images/`; needs Shop screen wiring
- Coins — earn, spend, balance persistence
- Wire remaining batch_06/07 assets: `pause_button` (in-game), `confirm_button` / `cancel_button` (coin modal), `daily_reward_panel`, `paw_spinner` (loading state), `coin_balance_bar.webp` (replace current coin_bar.webp in top bar), `continue_button.webp` (game over screen)
- **Rob + E-type opponent portraits** — several robot cat portraits in downloads, need renaming and wiring to season opponents
- **Defeated / Try Again / Continue banners** — `continue_btn.webp`, `gameover.png`-style assets ready; need wiring to game-over flow

---

## Known Issues / To Fix

- Season COMPLETE state — no way to reset/replay season yet (intentional for now, needs a "replay season" button eventually)
- Multiplayer untested — needs a real two-device session

---

## Backlog

### Gameplay
- Season 2 opponents + boss
- Seasonal gold card reward (collect on SEASON COMPLETE screen)
- Gauntlet — more rounds / difficulty scaling
- Sound effects for each special card type
- Tutorial / first-run walkthrough

### UI / Polish
- Season COMPLETE screen (proper celebration, gold card display)
- Opponent bio shown before a fight begins
- Deck unlock animations
- Settings screen (sound, music, difficulty presets)

### Monetisation
- Coin shop
- Premium deck unlock via coins or IAP
- Season pass concept
- **Deck expansion packs** — themed bundles of new cards sold as IAP; plumbing already in place (decks.js + _products.js + fo_owned_decks). Brad has examples to show — update this entry once reviewed.

### Technical
- Multiplayer stability + reconnection handling
- Offline support / PWA install prompt
- Analytics events (match start, win/loss, special card used)

---

## Done (shipped to prod)

See [PATCH_NOTES.md](PATCH_NOTES.md) for full history.
