# Flip-Out Booster Store Report

## Current package status — 19 July 2026

- Supplied artwork converted to `public/ui/shop/booster-packs.webp` (WebP quality 82, 317,568 bytes) and displayed on Shop.
- Themed and Random Booster panels show five random cards and 500 Coins.
- Store is represented in global bottom navigation and Shop has safe-area scroll padding.
- Purchases remain disabled because no existing server-authoritative booster endpoint, receipt schema or approved foil probabilities were found. This avoids an unsafe client-side economy path.
- Match-3 line specials use graphical Rocket artwork; wrapped/colour specials use a visible Sun graphic instead of placeholder symbols.

## Remaining risks

Before enabling purchases, add an atomic server transaction that selects eligible cards/foil outcomes, debits 500 Coins, writes an idempotent receipt and grants five cards. Approved foil probabilities are still required.
