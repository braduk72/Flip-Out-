// Shared Flip Out product catalog
// Used by fo-checkout.js and fo-verify.js

export const PRODUCTS = {
  // ── Decks ────────────────────────────────────────────────────────────────────
  deck_sportscars:     { type: 'deck',       name: 'Super Cars Deck',        pence: 199, decks: ['sportscars'] },
  deck_birdsOfPrey:    { type: 'deck',       name: 'Birds of Prey Deck',     pence: 199, decks: ['birdsOfPrey'] },
  deck_dogs:           { type: 'deck',       name: 'Dogs Deck',              pence: 199, decks: ['dogs'] },
  deck_cats:           { type: 'deck',       name: 'Cats Deck',              pence: 199, decks: ['cats'] },
  deck_KingsandQueens: { type: 'deck',       name: 'Kings & Queens Deck',    pence: 199, decks: ['KingsandQueens'] },
  deck_WorldLandmarks: { type: 'deck',       name: 'World Landmarks Deck',   pence: 199, decks: ['WorldLandmarks'] },
  // ── Coins ────────────────────────────────────────────────────────────────────
  coins_100:           { type: 'coins',      name: '100 Coins',              pence:  99, coins: 100 },
  coins_500:           { type: 'coins',      name: '500 Coins',              pence: 399, coins: 500 },
  coins_1000:          { type: 'coins',      name: '1,000 Coins',            pence: 699, coins: 1000 },
  // ── One-off items ─────────────────────────────────────────────────────────
  remove_ads:          { type: 'remove_ads', name: 'Remove Ads',             pence: 799 },
  chest:               { type: 'chest',      name: 'Bonus Chest',            pence: 399, coins: 400, extras: { freeze: 1 } },
  // ── Bundles ───────────────────────────────────────────────────────────────
  bundle_starter:      { type: 'bundle',     name: 'Starter Bundle',         pence: 299, coins: 500,  extras: { xray: 3 } },
  bundle_mega:         { type: 'bundle',     name: 'Mega Bundle',            pence: 999, coins: 1500, extras: { xray: 5, freeze: 5, shuffle: 5 } },
  // ── Special launch offer (one-time popup) ─────────────────────────────────
  offer_launch:        { type: 'offer',      name: 'Special Launch Offer',   pence: 199, coins: 200, extras: { xray: 1, freeze: 1, shuffle: 1 } },
}
