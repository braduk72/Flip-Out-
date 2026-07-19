# Flip-Out preferred design direction

## Match-3 implementation alignment — 18 July 2026

The first Match-3 vertical slice is implemented in Preview. It follows the approved economy direction: Match-3 earns Stars only, completion is server-authoritative and idempotent, and a verified advert can double 30 Stars to exactly 60. Coins are not a gameplay reward. Collectible rarity does not affect Match-3 strength.

The pure outcome/rules layer remains independent of rendering, so later circular collectible-art token skins and Reward Theatre presentation cannot reroll or alter gameplay results. Current CSS shapes/patterns are temporary. Memory Match remains a separate relaxed collection mode; Maurice and Sprocket are not part of the Match-3 architecture.

**Recorded:** 18 July 2026
**Status:** Design guidance only — not implemented

This direction supersedes conflicting product assumptions but does not invalidate the audit, identity, economy, progression or authoritative-match foundations. Flip-Out remains centred on collection, progression, Reward Theatre, trading, social play, seasonal content and long-term collecting. Maurice and Sprocket are optional flavour, not the product centre.

## Preferred decisions

- **Reward Theatre:** the reward engine commits the prize first; a separate layer selects a presentation and skin. Presentation never changes odds, eligibility, quantity or transaction identity.
- **Presentations:** Fruit Machine, Scratch Cards, Flip Cards, Ducks, Treasure Chests, Booster Packs and Prize Wheels initially, with room for additional types.
- **Skins:** presentation type and skin are independent. Initial themes include Classic, Pirate, Space, Christmas, Halloween, Candy, Steampunk and Jungle.
- **Triple progression:** most reveals express single/double/triple outcomes: Coins 5/10/20, power-ups 1/2/5 and cards Base/Foil/Rare Foil. Treasure Chests may award multiple categories atomically.
- **Scratch cards:** three themed, artwork-integrated scratch regions are preferred over generic silver rectangles.
- **Boosters:** booster opening should eventually use Reward Theatre.
- **Stars:** earned-only progression currency; never purchased, gifted or traded.
- **Coins:** purchasable premium economy currency used for boosters, Exchange purchases, creator gifts, cosmetics, continues and premium purchases. No direct player-to-player Coin transfer.
- **Approved conversion:** 1 Coin converts to exactly 10 Stars. Stars never convert to Coins.
- **Coin creation:** Coins may be created only by verified purchases or explicitly authorised server grants. Every Coin creation and use must remain traceable through the server-authoritative ledger; client balances are display caches only.
- **Exchange:** Coin-only, exact 10% fee, audited ownership and full transaction history. Neither Coins nor Stars may be gifted directly.
- **Seasonal philosophy:** avoid permanent FOMO. Seasonal items should generally become premium-shop eligible roughly one year later at deliberately high Coin prices, with occasional significant sales.
- **Shop characters:** Demonica normally represents catalogue/premium pricing in Demonica's Domain. Angelica temporarily takes over during sales as Angelica's Augments. They actively reference one another. Brad's supplied appearance, personality, voice and dialogue notes are canonical creative guidance, subject to later original-art/IP and platform review.
- **Creator economy:** catalogue-mediated creator gifts may move Coins to creators inside Flip-Out. Cash-out is undecided and must not influence current architecture.

## Existing architectural opportunities

- Versioned weighted tables in `api/_rewards.js` already separate server prize selection from wheel animation—the correct Reward Theatre boundary.
- Idempotent claim/transaction IDs allow interrupted presentations to resume or replay without granting twice.
- The canonical item catalogue and inventory can represent cards, variants, power-ups, boosters and presentation cosmetics without coupling them to animations.
- Lockbox selection is server-side; a future reward-bundle envelope can support multi-category Treasure Chests.
- Marketplace escrow, row locking, protected identity, audit history and the exact 10% fee align with the Exchange direction.
- Catalogue release metadata and annual-cutoff rules provide a base for delayed seasonal shop eligibility.
- `fo_player_balances` is keyed by `currency_id`, so Stars can be added without rebuilding the balance schema.

## Conflicts and risks to resolve later

- **Currency-policy implementation:** gameplay wins, daily login, wheel, lockboxes, promo codes and bosses now award Stars at exactly 10× their former Coin amounts. Development Coin balances were reset when the premium ledger began; there are no real users requiring migration or compensation.
- Currency definitions and server-enforced allowed sources/sinks are not yet canonical. Current continues, coin-funded wheel and deck unlocks must be reviewed against the new premium/progression split.
- The Exchange is currently fixed-price duplicate trading. Its UI/API must distinguish purchases from forbidden direct transfers. Creator gifts must be catalogue-mediated operations, never a generic wallet-transfer endpoint.
- Current reward selection returns one item or currency. Triple card quality and Treasure Chest contents need versioned outcome/bundle definitions, not presentation-side upgrades.
- Foil/Rare Foil lack authoritative assets, odds and eligibility metadata. Reward Theatre must not invent them.
- The wheel UI maps fixed Coin results to sectors. A future theatre controller must display a committed result and choose only compatible presentations/skins without rerolling.
- Seasonal return policy needs explicit original season, release date, premium-return eligibility, price schedule and sale history; `releasedAt` alone is insufficient.
- Demonica must become an original design rather than copying protected World of Warcraft assets or distinctive expression. Voice, age-rating and localisation require later review.
- Cash-out remains undecided. Do not add withdrawable balances, monetary-value promises, revenue share or external transferability.

## Future architectural guardrails

1. Commit and persist the complete reward outcome before presentation begins.
2. Store reward-table version and transaction/claim ID; presentation ID, skin ID and animation progress are non-authoritative metadata.
3. Retries may replay presentation but never reroll or regrant.
4. Keep presentation type, skin and outcome as independent models with explicit compatibility rules.
5. Define triple tiers in outcome data, never from animation performance or chance.
6. Model Treasure Chests as atomic bundles under one claim ID.
7. Approve a Stars/Coins source-and-sink matrix before migrating existing rewards.
8. Expose only purpose-specific Coin operations; never create generic player-to-player transfer.
9. Keep Exchange settlement and creator gifts ledgered, idempotent, account-scoped and audited.
10. Make seasonal return eligibility and sale scheduling data-driven.

## Recommended future decision order

1. Approve the Stars/Coins policy and treatment of existing earned Coins.
2. Define a presentation-independent reward envelope for single rewards, triple tiers and atomic bundles.
3. Approve foil/Rare Foil definitions and assets before adding them to reward tables.
4. Prototype one adapter against committed Preview rewards; the existing wheel is the lowest-risk first adapter.
5. Add independent skin metadata and compatibility validation.
6. Move boosters and lockboxes onto the same reward-envelope/theatre boundary.
7. Define seasonal premium-return and sale scheduling rules.
8. Specify catalogue-mediated creator gifts while keeping cash-out absent.
9. Develop original Demonica/Angelica assets, dialogue state and shop takeover presentation.

## Explicitly postponed

No Reward Theatre UI, skins, foil content, seasonal pricing, public creator-gifting UI, character assets/dialogue or cash-out functionality was implemented in the original design-only update.

## Implemented currency authority (18 July 2026)

The approved 1 Coin = 10 Stars one-way conversion and premium-Coin authority are implemented in Preview. Migration `008_tamper_evident_coin_ledger.sql` adds an immutable, per-account chained ledger. Each entry stores transaction ID, account, signed amount, type, source reference, timestamp, previous HMAC and current HMAC. The HMAC key exists only as a sensitive Vercel Preview environment secret.

Sensitive Coin actions serialize on the account balance, recalculate and verify the full chain, reject negative results, duplicate IDs and replayed purchase references, then update the cached balance in the same database transaction. Purchase creation, authorised promotions/refunds, Exchange buyer/seller/fee entries, purpose-specific creator gifts and Coin-to-Star conversion use this boundary. Conversion deduction, 10× Star grant and shared claim reference commit atomically; retries return the original result.

`scripts/verify-coin-ledger.mjs` is a Preview-only administrative verifier that reports recalculated balances, chain validity, first invalid entry and FIFO creation-source attribution. Full-chain verification is correctness-first; checkpointed verification may be required before high transaction volumes.

Final Preview verification: migration 008 committed at `2026-07-18T17:52:39.594Z`; a subsequent run reported migrations 001-008 already applied. The database suite passed **56/56, 0 failed, 0 skipped** in 38.479 seconds. The administrative verifier checked all 17 Preview ledger accounts and reported every chain valid. Cross-account Exchange provenance was then added and passed locally, bringing the local suite to **57 total, 50 passed, 0 failed, 7 Preview-only skipped**. Final code deployment: `https://flip-45w824r5q-chattocal.vercel.app`. Production was not touched.
## Duplicate Card Recycler — implemented development foundation (19 July 2026)

- Duplicate cards may be permanently recycled in server-authoritative batches; the final copy of every card can never be recycled.
- Recycling is a guaranteed floor value for unwanted duplicates and must remain less profitable than trading or normal play.
- The first Preview recipe is provisional: five common duplicates grant one Star. Coins are not a Recycler reward.
- Recipes are versioned server data, so input batch size and reward can be balanced without changing transaction code.
- The destruction and reward commit atomically before presentation. Animation never decides, rerolls or alters the reward.
- Transaction IDs, input fingerprints and stored receipts make interrupted and concurrent retries safe. Cross-account reuse is rejected.
- Exchange escrow naturally excludes listed cards from Recycler availability.
- Higher rarity, Gold Collector and future Foil recycling is postponed until approved item-specific rules and values exist.
- Full implementation and remaining balancing risks are recorded in `FLIPOUT_RECYCLER_REPORT.md`.

## Economy, Theme Albums, Exchange, Rewards and Achievements update — 20 July 2026

**Status: approved design direction only.** No code, schema, balance, migration or deployment work was performed for this update. It supersedes earlier design guidance where the rules conflict.

### Canonical player ownership model

- **Theme Albums replace the previous aggregated Collection albums.** Every booster card first enters Inventory. A player then chooses **“Stick in Album”** or leaves it in Inventory.
- Sticking is an irreversible, server-authoritative transfer of one Inventory card into the official Theme Album. It cannot be traded, shredded, removed or counted against Inventory capacity. It permanently contributes to Theme completion.
- Official themes have two independent completion tracks: normal cards and Foil cards. A completed normal Theme Album earns its account-bound Bronze Collector Card; a completed Foil Theme Album earns Silver; both earn Gold. Collector Cards are achievements, not booster drops, Inventory stock, tradeable cards or recyclable cards.
- Theme sizes remain data-driven and may vary. Each Theme Album must show its actual total.
- **Personal Albums** are different: up to ten, named with the same suitability filter as nicknames, 500 Coins each, and purely organisational. They do not create completion, lock ownership or transfer a card out of Inventory. Add/remove remains free. The pending data-model choice is whether membership is a card-SKU bookmark (recommended, allowing the same owned card type in more than one folder) or a quantity allocation; it must be decided before implementation.
- Inventory capacity is intentionally not enforced until its size and overflow UX are approved. Official Theme Album cards are excluded from it.

### Booster, rarity and opening direction

- Themed Boosters contain cards from the chosen Theme only and never cosmetics. Random Boosters draw across Themes, retain the higher Foil chance and may include avatars, title prefixes/suffixes, profile backgrounds and future cosmetics.
- Rarity and Foil status are orthogonal: Common, Uncommon, Rare, Epic and Legendary may each be Normal or Foil. Existing temporary Foil UI is not an authoritative item/reward definition.
- The existing booster-opening presentation architecture remains the correct boundary: a server-confirmed receipt must exist before animation and must be replayable after interruption. Only its physical responsiveness and polish should improve later; animation must not select or alter rewards.

### Economy, Match-3 and Reward Theatre direction

- Every completed Match-3 level awards **10 Coins**, with one verified optional advert able to double that completion to **20 Coins**. Coin grants remain server-authoritative, idempotent and ledgered. No advert revive is permitted.
- Reward Theatre occurs after every **five completed Match-3 levels**, not every level. Standard level Coin rewards happen immediately. Theatre awards bonus items using reels; every icon in the visible reward window is awarded. The outcome remains committed before the presentation, with a shared claim/transaction ID.
- Revives replace the previous advert/continue path: attempt 1 costs 25 Coins at 75% success; attempt 2 costs 50 Coins at 50%; attempt 3 costs 100 Coins at 25%; then Game Over. Players spin the pointer and the odds must be shown. This requires a committed server outcome before the wheel animation.
- The Daily Wheel and Reward Theatre must use responsive presentation sizing on phone, tablet and desktop.

### Exchange, Recycler and Achievements direction

- Exchange commission is **20%**, superseding the previous exact 10% rule. It is player-driven after launch, with developer seed listings only at launch, a minimum listing price, a maximum active-listing limit, expiry and automatic Inventory return. There is no maximum price.
- Shredding replaces the current duplicate-only Recycler policy: any five normal Inventory cards yield 10 Coins; one Foil Inventory card yields 25 Coins. Stuck Theme cards and Collector Cards are categorically unavailable. This is a future rewrite of the existing 5 Common duplicates → 1 Star Preview recipe, not a balance tweak.
- Achievements become a major progression system with ledgered/server-authoritative grants for Coins, boosters, avatars, title parts, profile backgrounds, power-ups, cards and future cosmetics. Some cosmetics remain achievement-exclusive. Initial tone examples: **Unicorn Poop** (first Rare Foil) and **Raider of the Lost Arc-hive** (booster from a fifth different Theme).

### Architecture assessment and conflicts

The existing item catalogue, quantity inventory, idempotent transaction boundary, Coin ledger, Exchange escrow/history, player identity, match session IDs and receipt-first booster presenter support this direction **without a full rebuild**. Selected additive refactors are required:

1. The current `buildCollectionData` treats an Inventory quantity as collection ownership and groups permanent albums into three broad categories. It cannot represent irreversible per-card Theme placement, separate normal/Foil completion, achievement Collector Cards or Personal Album membership.
2. `fo_player_inventory` stores quantities, not individual card instances. Official sticking can still be correct by atomically decrementing one SKU quantity and inserting a unique account/theme/card/variant album entry. Personal Albums need the membership decision above before their tables are designed.
3. Current Recycler validation deliberately preserves the final copy, accepts Common duplicates only and grants Stars. It directly conflicts with the new any-five normal / individual Foil / Coin-output rules and must not be partially altered before the official Album boundary exists.
4. Current Match-3 completion grants Stars (with an advert double), while prior premium-Coin direction permitted Coin creation only from purchases or explicit server grants. The new 10/20 Coin rewards and Coin-producing shredder require an explicit revised Coin source-and-sink policy. Technically the ledger can record these as purpose-specific authorised server grants; product approval must confirm that this is the intended meaning of premium Coins.
5. Current continuation rules allow an advert or a fixed Coin continuation. They conflict with the three paid, probability-disclosed revive spins and the no-advert-revive rule.
6. Current marketplace settlement and Coin ledger use the prior 10% fee. The 20% fee, listing caps/minimum/expiry and launch seed account must be introduced atomically with an auditable migration; do not edit only UI copy.

### Recommended implementation order

1. **Approve the revised Coin source/sink matrix.** State explicitly that Match-3 10/20 awards and shredding Coin rewards are purpose-specific authorised server ledger grants; define how Daily Wheel, daily login, lockboxes and existing Coin sinks change. This is the only policy dependency that blocks the economy work.
2. **Create the official Theme Album ownership boundary.** Add additive tables for immutable stuck card entries, normal/Foil completion and account-bound Collector achievements; implement a locked, idempotent “Stick in Album” mutation that decrements Inventory and grants collectors exactly once. Do not change the Collection UI first.
3. **Add Personal Album data and APIs.** Reuse nickname suitability validation; enforce ten albums and a 500-Coin ledgered creation charge; add free membership mutations with the agreed bookmark/allocation semantics.
4. **Refactor the read model and Collection UI.** Replace broad category albums with per-Theme normal/Foil progress, stuck/inventory state, Collector achievement display and Personal Album folders. Introduce capacity presentation only, not a hard limit, until a value is approved.
5. **Implement authoritative booster receipts and post-open decision flow.** Define Themed versus Random loot tables, Rarity/Foil metadata and cosmetic eligibility. Grant to Inventory first, then offer idempotent Stick in Album choices. Keep the current opening component purely presentational and improve responsiveness/easing only after receipt wiring is correct.
6. **Replace the Recycler with the approved shredding rules.** Build new versioned normal-five and Foil-one recipes, Coin-ledger grants and the existing retry/concurrency protections. Remove the duplicate/final-copy requirement only for Inventory cards, never for Theme entries or Collector achievements.
7. **Upgrade Exchange settlement.** Add the 20% fee, listing constraints, expiry return, developer launch-seed mechanism and inventory eligibility checks. Preserve account identity, escrow, auditable ownership and Coin ledger provenance.
8. **Implement Match-3 reward and revive changes.** Move completion to 10 Coins plus a verified one-time advert double; retire advert revive; add the disclosed 25/50/100 Coin probability revive sequence with a server-committed outcome.
9. **Define the reward envelope, then Reward Theatre.** Create versioned multi-award outcomes and claim IDs, schedule every fifth completed level, then build responsive reels as a presentation adapter. Do not let reels determine eligibility or results.
10. **Add achievement definitions and reward claims.** Start with the two named achievements after Foil/booster receipts exist, then grow the data-driven achievement catalogue.

### First implementation task when development resumes

**Implement the immutable official Theme Album ownership boundary (step 2).** It must come first because all other collection decisions depend on knowing whether a specific card is still Inventory stock or is permanently stuck. It protects Exchange, shredding, capacity, booster post-open choices and Collector Card grants from duplication or eligibility bugs. Expected scope: additive migration(s), an idempotent server mutation, catalogue/read-model support, focused transaction/concurrency tests and no presentation redesign.
