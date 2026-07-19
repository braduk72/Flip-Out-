# Flip-Out Collection 2.0 Report

Date: 19 July 2026  
Version: `1.4.0-collection2`  
Environment: development / Preview only

## Outcome

The prototype inventory list has been replaced by a mobile-first collecting experience built from the approved Concept 4D system. It reads the canonical item catalogue and authoritative player inventory/transaction state; it does not invent ownership, rarity, Foil items or reward grants.

## Experience delivered

- Three presentation albums containing all 15 canonical card sets.
- Set progress, completion percentage, missing count and Gold Collector status.
- Full 653-card base catalogue plus seven canonical Gold Collector cards.
- Owned, missing and duplicate states based on authoritative inventory quantities.
- Search across card names, set names, rarity and variant.
- Compound filters for set, ownership, rarity and variant, plus deterministic sorting.
- Account-scoped favourites for owned or missing cards.
- Recently obtained cards derived from positive authoritative item transactions.
- Statistics for unique collectibles, base completion, completed sets, favourites, duplicates and Gold Collector cards.
- Five visible collection milestone targets.
- Explicit Foil status based on the catalogue rather than simulated cards.
- Incremental 30-card rendering and lazy-loaded artwork for mobile performance.
- Accessible card detail dialog, searchable controls, progress semantics and 44px minimum interactions.
- The existing power-up/key/lockbox inventory and atomic lockbox action remain accessible in the secondary Items view.

## Data and architecture

`src/ui/collectionData.js` is a pure presentation model over `ITEM_CATALOG`, `DECKS`, `fo_player_inventory` and recent `fo_player_transactions`. The route remains read-only except for the already-existing lockbox action and local favourite preference. No database schema, economy value, reward source or ownership rule changed.

The three album groupings are navigation metadata only. Sets remain the canonical decks and item IDs remain unchanged.

## Honest unavailable states

- The catalogue currently contains no Foil definitions or assets. The Foil filter and statistics say so explicitly and issue nothing.
- All normal cards are currently canonical `common`; only Gold Collector cards are canonical `legendary`. The UI reports those values without fabricating rarity distribution.
- Collection milestone reward contents have no authoritative catalogue or grant endpoint. Milestone progress is visible, but rewards remain inactive and cannot be claimed.

## Verification

- Full local Node suite: 103 passed, 0 failed, 8 Preview-database tests skipped without local credentials.
- UI suite: 31 passed, 0 failed across 8 files.
- New focused model tests cover album/set aggregation, ownership, recency, statistics, compound filtering, Foil absence and account-isolated favourites.
- New component tests cover set navigation, search, favourites, Foil status and retained non-card inventory.
- Production and Preview builds: passed; 139 modules; main JS 405.11 kB / 128.01 kB gzip; main CSS 87.46 kB / 17.92 kB gzip; Collection JS 23.56 kB / 7.15 kB gzip; Collection CSS 16.82 kB / 4.10 kB gzip.
- Focused JavaScript lint: passed with no findings.

## Remaining risks

- Favourites are account-scoped on the current device but are not yet part of cloud-save recovery.
- Recent acquisitions are limited to the 100 transactions returned by the existing player-state API.
- Physical-device checks remain required for VoiceOver, TalkBack, real cut-outs and long translated labels.
- Authoritative Foil definitions, rarity balancing and reward milestone grants require separate approved data/economy packages.

## Responsive visual verification

- Deployed browser checks passed at 320×568, 390×844 and 1024×768.
- All five Collection destinations remain visible at 320px; Saved and Stats use short visual labels with full accessible names.
- No horizontal overflow or visible interaction below 44×44 CSS pixels was found.
- Album, card-catalogue and statistics views were exercised against a real development guest.
- The first deployed visual pass exposed a shrinking CSS-grid summary panel. `grid-auto-rows: max-content` fixed it, and a regression contract now protects the behaviour. The corrected summary measures 233px at 390×844 and 264px at 320×568.

## Preview deployment

- Final UI commit `2107ebf` was pushed from `dev`; production `main` remained at `157344e5f6deaaa6540418c514448a976753688c`.
- Vercel deployment `dpl_GSupG15aohkMJ5b7s9V54AzSsKRc` reached Ready with target `preview`.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 and byte-identical HTML to `https://flip-e250izsku-chattocal.vercel.app`, with ETag `"8f87cb8b050d9740c6a34d8b38f8dbca"`.
- Entry bundle `/assets/index-C1HtgBKc.js` was 405,111 bytes and contained `1.4.0-collection2`.
- Collection bundle `/assets/Inventory-l_c7LhSB.js` returned HTTP 200 and was 23,563 bytes.
- No production deployment, domain, DNS, database, economy balance or migration was changed.
