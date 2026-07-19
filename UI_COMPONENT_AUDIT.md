# Flip-Out UI component audit

Status: inventory only. No component, stylesheet, asset or behaviour was changed.

## Decision language

- **Keep** means retain the component's responsibility or proven behaviour, not its current appearance.
- **Redesign** means rebuild its visual treatment inside the approved permanent design system.
- **Merge** means replace several local variants with one shared primitive later.
- **Remove** means the component is unused, misleading, obsolete or too presentation-specific to survive as a permanent primitive. Removal is not authorised by this document.

## Existing named components

| Component | Where it is used | Keep | Redesign | Remove | Finding / eventual action |
|---|---|---:|---:|---:|---|
| `AdBanner` | `src/components/AdBanner.jsx`; no imports or render sites | No | No | Yes | Dead component. It only links a Gizmo Games image to About and is disconnected from the app. |
| `BottomNav` | Home, Shop, Lucky Spin, Inventory, Leaderboard, Avatar Picker, Settings, About, Privacy, Gauntlet and Season Map | Yes | Yes | No | Retain persistent primary navigation as a concept. Current four image-only destinations omit Collection and use inconsistent placement across screens. |
| `Card` | Main memory game board | Yes | Yes | No | Strong behavioural base: flip, match, frozen, consumed, shuffle, keyboard and ARIA states. Rebuild the visual card shell while preserving interaction semantics. |
| `CookieBanner` | App root after unanswered consent | Yes | Yes | No | Retain consent behaviour. Replace fixed 390px presentation, emoji copy and ad-hoc buttons with the system banner/sheet. Privacy link currently leaves the app route. |
| `DailyBonus` | Home startup overlay | Yes | Yes | No | Retain claim/progress responsibility. It calls Stars `coins`, derives legacy coin artwork from `coins / 10`, and uses a one-off seven-box reward layout. Must become currency-correct. |
| `ErrorBoundary` | Wraps the complete app in `main.jsx` | Yes | Yes | No | Essential recovery behaviour. Inline styles and emoji make it visually disconnected; merge presentation with the system error state. |
| `GameIcon` | Home mode entries and development icon-test overlay | No | No | Yes, after replacement | Highly bespoke stone-plate animation renderer with flames, sparks, needles, hands, arcs, bubbles, ripples and hidden tap zones. It should not define permanent navigation. Preserve only as prototype reference until an approved mode-tile primitive exists. |
| `Interstitial` | Lucky Spin rewarded-ad attempt | Yes | Yes | No | Current component is an “advert unavailable” dialog, not an advert player. Keep the safe failure responsibility and merge its UI into the standard dialog/status system. |
| `LunarLander` | Hidden easter egg inside `GameIcon` | Optional | Yes, if retained | Postpone | Not a general UI primitive. Keep outside the core design system and reconsider after the permanent navigation is selected. |
| `Match3FeedbackPanel` | Development-only Match-3 board and result | Yes, dev only | Lightly | No | Valuable test tooling and local export. It must remain visually subordinate and impossible to ship as player UI. |
| `RemoveAdsModal` | Declared in Shop, but `setShowRemoveAdsModal(true)` is never called | No in current form | No | Yes, replace later | Disconnected legacy purchase UI that can locally grant Coins. Retain the future “ad-free offer” requirement only through the authoritative shop/checkout design. |
| `SpecialOffer` | Timed Home overlay and `?testoffer` | Yes, as offer behaviour | Yes | No | Retain catalogue-offer responsibility. Current local countdown/“never shown again” framing, 80%-off badge and fixed bundle contents conflict with server-authoritative live offers and the no-permanent-FOMO direction. |

## Existing screen-local React components

| Component | Where it is used | Keep | Redesign / merge | Remove | Finding / eventual action |
|---|---|---:|---:|---:|---|
| `BugReportModal` | Defined in Home; no control ever sets it open | Yes, as Support flow | Merge into shared form dialog | Remove current entry arrangement | Useful function but unreachable. The promised 50-Coin reward also conflicts with authorised Coin creation and needs server-backed copy. |
| `LevelMap` | Match-3 map view | Yes | Redesign | No | Retain level progression and completion state. Replace the plain 4-column development grid with the approved level-map/list pattern. |
| `Brief` | Match-3 pre-level view | Yes | Merge with shared encounter/level briefing | No | Objectives, teaching text and moves are useful. It need not remain a separate full-screen visual language. |
| `Result` | Match-3 completion view | Yes | Merge with shared game-result/reward shell | No | Preserve result data and verified-ad action; replace the plain prototype result page. |
| `GameBoard` | Match-3 active play | Yes | Redesign shell and HUD | No | Preserve board interactions, keyboard/touch semantics and authoritative requests. Replace prototype controls, objectives and modal styling. |
| `Tile` | Match-3 board cells | Yes | Redesign | No | Preserve state semantics and accessible labelling. Tokens, blockers and specials need one legible visual grammar that does not rely on emoji alone. |
| `SetupScreen` | Peep-Oh!/Reveal deck and lives selection | Yes, as setup behaviour | Merge with common mode setup and deck selection | Remove standalone styling | Two sequential setup screens duplicate Deck Picker and general mode configuration. |
| `RoboMouse` | Season Map decoration | Optional | Decouple from UI system | Postpone | Decorative CSS illustration, not navigation or information architecture. Reassess with future art direction. |
| `TeslaCoil` | Season Map decoration | Optional | Decouple from UI system | Postpone | Decorative CSS illustration. It must not drive permanent panel, button or icon styling. |

## Repeated UI patterns that are not shared components

These are the principal source of inconsistency. They should become shared primitives only after a home wireframe is approved.

| Pattern currently present | Where it appears | Keep | Redesign / merge | Remove | Finding / eventual action |
|---|---|---:|---:|---:|---|
| App viewport / page shell | `index.css` plus nearly every screen `.page` | Yes | Yes | Remove phone-bezel simulation | Root is fixed to `390×844`, clips overflow and draws a desktop phone bezel. Replace with responsive safe-area containers supporting phone, tablet and landscape. |
| Screen header | Almost every non-game screen | Yes | Merge | No | Title, height, alignment and background are repeated per stylesheet. Create one `ScreenHeader`. |
| Back/close navigation button | About, Avatar, Deck Picker, Gauntlet, Game, Leaderboard, Lucky Spin, Multiplayer, Patch Notes, Privacy, Reveal, Season, Settings and Shop | Yes | Merge | Remove image-specific variants | At least three variants exist: baked image, text arrow and red X. Establish Back versus Close semantics and one icon-button primitive. |
| Modal close X | Daily Bonus, Special Offer, Remove Ads, Deck purchase, Home bug report, game confirmations and streak intro | Yes | Merge | Remove global red candy styling | Global `.modal-close-x` is reused, but its styling is unrelated to most panels and has no size variants. |
| Primary CTA button | Every flow | Yes | Merge | No | Currently gold text buttons, purple buttons, image buttons, green buttons and mode-specific neon buttons. Replace with one primary hierarchy and explicit states. |
| Secondary / quiet button | Dialogs, results, setup and forms | Yes | Merge | No | Cancel, Back, Level Map, End Streak and reset actions lack a consistent hierarchy. |
| Destructive button | Quit, give up, reset and end-streak flows | Yes | Merge | No | Current red, image-based and plain-text variants do not consistently communicate consequence. |
| Image-only commercial button | Game results, Shop purchase modal, Home mode plates and Restore Purchases | No as a base control | Replace with semantic buttons plus optional art | Yes, after replacement | Baked labels cannot scale, localise, reflow or respect text settings. |
| Icon button | Audio controls, dev reset, restore, navigation and close controls | Yes | Merge | No | Standardise 44px minimum target, selected state, tooltip/label and focus treatment. |
| Toggle switch | Settings music and SFX | Yes | Merge | No | Behaviour is sound; visual language is local to Settings. |
| Range slider | Settings music and SFX volume | Yes | Merge | No | Retain native accessibility and give it system track/thumb/focus styling. |
| Select / segmented choice | Difficulty, Match-3 feedback, Marketplace item, multiplayer tabs/chips | Yes | Merge by use case | No | Native selects, chips and tabs are currently visually unrelated. |
| Text input | Multiplayer code, promo code, Marketplace price and bug email | Yes | Merge | No | Needs common label, help, validation, error and input-mode treatment. |
| Text area | Bug report and development feedback | Yes | Merge | No | Needs common form-field behaviour; feedback remains dev-only. |
| Tab bar | Leaderboard and Multiplayer Lobby | Yes | Merge | No | Two separate tab styles. Use one accessible segmented/tab primitive with keyboard behaviour. |
| Bottom navigation item | `BottomNav` | Yes | Redesign | No | Active state uses separate bitmap files. Permanent navigation should use system icons, labels and badges. |
| Home mode tile | Home `GameIcon` plates and separate Match-3 entry | Yes, as mode launcher | Replace completely | Yes, current form | Memory/Season/Gauntlet use art plates while Match-3 is an unrelated purple text card; several modes are hidden. |
| Counter / stat | Game scores, Match-3 score/moves, Reveal score/turn/time, Season step, Gauntlet step, spin reset timer and currency references | Yes | Merge | No | Define label/value pairs, compact counters and live-region rules. Current versions use emoji and inconsistent number emphasis. |
| Currency balance | Scattered localStorage reads and shop/reward labels; removed from Home | Yes | Create authoritative shared component | Remove ad-hoc reads | No current reusable balance component. Stars and Coins need distinct, server-fed displays with pending/error states. |
| Progress bar | Main memory game only | Yes | Merge into system progress | No | Preserve progress information but add accessible value text and variants for level, objective and collection progress. |
| Objective chip | Match-3 board | Yes | Create shared objective/status chip | No | Useful compact information but currently tiny 9–11px text. |
| Badge / chip | Difficulty, tier, latest, best value, trial, free unlock, rarity, completed and locked states | Yes | Merge into a small documented badge set | Remove decorative duplicates | Dozens of local colours and shapes encode similar states. Never use colour as the sole cue. |
| Quantity badge | Joker count, power-up quantity, free unlocks, bonus spins and inventory quantity | Yes | Merge | No | Needs one `×N` convention and bound/tradable state treatment. |
| Generic panel/card | About, Privacy, Match-3 brief, game dialogs, offers and shop sections | Yes | Merge | No | Every screen invents its own gradient, border, radius and shadow. Create base, inset and elevated panel variants. |
| Deck tile | Deck Picker and Reveal setup | Yes | Merge | No | Duplicated deck-selection concepts. Retain preview, ownership, trial, difficulty and selection states in one component. |
| Gameplay memory card | Main Game and separately implemented Reveal cards | Yes | Unify interaction/visual foundations where rules permit | No | Reveal recreates the flip-card structure instead of using `Card`; the permanent card language should be shared without coupling game rules. |
| Match-3 tile | Match-3 board | Yes | Redesign | No | Separate from collectible cards but should share focus, selection and state clarity rules. |
| Avatar tile | Avatar Picker and leaderboard portraits | Yes | Merge | No | Standardise selected, locked, special and identity states; avatar choice should eventually live inside Profile. |
| Opponent card / encounter panel | Gauntlet, Round Start, Season and Game cinematic | Yes | Merge | No | Four treatments present the same opponent/tier/round data. Create one encounter model with compact and dramatic layouts. |
| Level / map node | Season checkpoints, Gauntlet timeline and Match-3 level buttons | Yes | Shared state grammar, mode-specific layout | No | Locked/current/completed states should be consistent even if map arrangements differ. |
| Leaderboard row / podium | Leaderboard | Yes | Redesign | No | Retain rank, player, score and “you” states. Podium must not depend on fake data or emoji medals. |
| Collection list item | Inventory | Yes | Replace plain list with collection tile/list-row variants | No | Current inventory is unstyled inline HTML and mixes inventory with transaction history and lockbox opening. |
| Marketplace listing row | Marketplace | Yes | Redesign | No | Needs seller/item/price/fee/action/status states, confirmation and protected-identity gating. Current inline list is only a functional scaffold. |
| Shop product card | Coin packs, chest, power-ups, bundles, remove-ads-style entries | Yes | Merge into product-card variants | Remove non-functional cards | Current product types use unrelated layouts. Power-up cards have no click handler and must not appear purchasable until functional. |
| Reward panel | Daily Bonus, Lucky Spin prize, purchase complete, Special Offer and game rewards | Yes | Merge outcome shell; leave Reward Theatre presentation separate | No | Reward data, claim state and presentation are conflated. Permanent shell must display a committed outcome without rerolling it. |
| Dialog / overlay shell | All modal overlays | Yes | Merge | No | Multiple z-index, dismissal, backdrop and card implementations. Define focus trapping, escape/back behaviour, safe-area fit and scroll. |
| Confirmation dialog | Quit, early win/loss, pause, out-of-moves, reset and purchase actions | Yes | Merge | No | Use one consequence-aware dialog with predictable primary/destructive ordering. Avoid browser `confirm()` in Match-3. |
| Full-screen transaction status | App purchase claiming, success and error states | Yes | Merge with system status/result screen | No | Three inline-styled full-screen views bypass every shared style and duplicate action buttons. |
| Game result shell | Standard win/loss, streak, multiplayer, solo, Gauntlet cinematic, Match-3 and Reveal results | Yes | Merge common hierarchy, retain mode-specific content slots | Remove duplicate shells | Results currently have several unrelated layouts and reward handling patterns. |
| Effect notification banner | Main memory special-card effects | Yes | Redesign | No | Preserve immediate explanation and dismissal; improve non-pointer dismissal and reduce interruption. |
| Pass-device privacy overlay | Local memory game | Yes | Redesign | No | Essential for pass-and-play. Needs a neutral privacy/handoff pattern rather than emoji-led presentation. |
| Loading state | Suspense fallback, purchase claim, Inventory, Marketplace, Patch Notes and multiplayer search | Yes | Merge | No | Spinners and text states are inconsistent; define page, panel and inline loading variants. |
| Empty state | Inventory, Marketplace, Patch Notes and online leaderboard | Yes | Merge | No | Standardise title, explanation and optional action without implying unavailable features are live. |
| Error / notice state | Error boundary, forms, Marketplace, Inventory, checkout and API actions | Yes | Merge | No | Define inline alert, toast/status and blocking error variants with accessible live regions. |
| Development toolbar | Main Game | Yes, dev only | Replace inline styles with a dev utility shell | No | Useful special-card testing but visually embedded in player UI and controlled partly by local storage. |
| Icon test overlay | Home query parameter | No as player UI | Move to isolated development gallery later | Yes from Home | Prototype art test is rendered inside the real Home screen and contains hidden easter-egg behaviour. |

## System-level findings

1. There is no shared button, header, panel, dialog, form-field, badge, counter, product-card or status-state API.
2. The existing CSS defines 177 explicit font declarations, more than 30 recurring hex colours, at least 20 radius values and extensive per-screen shadows. `Game.module.css` alone contains 62 shadow declarations.
3. `index.css` constrains the entire app to a simulated `390×844` phone with clipped overflow. This is incompatible with the required tablet, landscape, text-scaling and 320 CSS-pixel support.
4. `App.css` is unused Vite starter styling and is obsolete, but it was not removed during this documentation pass.
5. Several useful screens and controls are disconnected: Avatar Picker, Multiplayer Lobby, Pass & Play, Reveal, Home bug reporting and Remove Ads have code but no normal visible entry.
6. Several displayed labels disagree with behaviour: Daily Bonus passes Stars through a `coins` prop; Lucky Spin grants Stars but its prize overlay says Coins; the visible “VS” entry starts streak mode.
7. Accessibility foundations are mixed. The memory `Card` and Match-3 grid have meaningful keyboard/ARIA work, while image-only buttons, tiny text, browser confirms, emoji-only status and missing dialog focus management remain widespread.

## Retention rule for the redesign

Preserve proven game behaviour, state, accessibility semantics and authoritative economy calls. Do not preserve a visual treatment merely because it is already implemented. No component should be rebuilt until a home wireframe and the design-system direction are approved.

## Consolidation status — 19 July 2026

The audit has been actioned. The canonical reusable set now includes the Concept 4D player/currency header, promotional carousel, primary and secondary buttons, card/progress panels, progress bars, bottom navigation, dialogs, badges and loading/error/empty states. The old bottom navigation, image back buttons, `AdBanner`, `DailyBonus`, `SpecialOffer` and Season-map-local component family have been removed. Game-specific board pieces remain intentionally local to their mechanics.
