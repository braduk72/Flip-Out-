# Flip-Out UI Screen Audit

## Scope

This audit treats every full page, gameplay phase, modal and blocking application state as a screen. It records the current prototype; it does not approve implementation or visual design.

Decision columns mean:

- **Should Keep**: retain the purpose, behaviour or content.
- **Should Merge**: combine the experience with the named shared flow.
- **Should Delete**: remove the current standalone screen or prototype presentation. This does not necessarily mean deleting the underlying feature.
- **Needs Complete Redesign**: do not incrementally polish the current layout.

Source coverage: `AboutUs.jsx`, `AvatarPicker.jsx`, `DeckPicker.jsx`, `Game.jsx`, `Gauntlet.jsx`, `Home.jsx`, `Inventory.jsx`, `Leaderboard.jsx`, `LuckySpin.jsx`, `Marketplace.jsx`, `Match3.jsx`, `MultiplayerLobby.jsx`, `PatchNotes.jsx`, `PrivacyPolicy.jsx`, `RevealGame.jsx`, `RoundStart.jsx`, `SeasonMap.jsx`, `Settings.jsx` and `Shop.jsx`. Route-level and modal states in `App.jsx` are also included.

## Current navigation and reachability

The visible home screen currently exposes Season, Gauntlet, Match-3 and a tile labelled “VS”. The “VS” tile calls the standard play handler in a way that starts Streak mode, so its label and behaviour disagree.

Several implemented routes are not exposed by the visible home screen, including standard deck selection, local/pass-and-play, online multiplayer, Reveal, avatar selection and the bug-report modal. A filename or route therefore does not prove that a player can reach or complete a flow.

Bottom navigation is present on only some screens. Other screens use one-off back buttons, close buttons or no consistent escape route.

## Global application screens and blocking states

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Home | Primary launch point and summary of modes, progress and account state | Visually dense, fixed-phone composition; navigation is decorative rather than systematic; several callbacks are unused; visible “VS” action starts Streak mode; too many competing badges and effects | Yes: home as the player’s return point | No | Yes: current composition only | Yes |
| Home icon test mode | Developer inspection of icon variants | Lives inside the player home component and is not a production destination | Keep only as a development component gallery | Merge into a development-only UI gallery | Yes: remove it from the player home flow | Yes, if retained as a dev tool |
| Initial loading fallback | Covers lazy loading and application start | Generic presentation; no shared loading-state component or meaningful recovery path | Yes | Merge with common system-state shell | Yes: current one-off presentation | Yes |
| Crash recovery | Error boundary with reload/recovery action | Useful behaviour, but styling is isolated and does not explain whether progress is safe | Yes | Merge with common system-state shell | No | Yes |
| Purchase claiming | Blocks the app while a purchase is being claimed | Inline full-screen styling; no shared transaction-status pattern; unclear retry and progress language | Yes | Merge with purchase status flow | Yes: current standalone visual variant | Yes |
| Purchase complete | Confirms a successful purchase | Inline, visually disconnected and more prominent than necessary | Yes | Merge with purchase status flow or non-blocking receipt | Yes: current standalone visual variant | Yes |
| Purchase failed | Explains purchase failure and retry | Inline; error hierarchy and safe retry state are unclear | Yes | Merge with purchase status flow | Yes: current standalone visual variant | Yes |
| Multiplayer deck upsell | Offers a deck when the selected multiplayer deck is unavailable | One-off blocking sales modal embedded at application level; mixes mode entry and shop behaviour | Keep the requirement check | Merge into a reusable availability/purchase sheet | Yes: current bespoke modal | Yes |
| Streak introduction | Explains Streak mode before play | One-off modal; visible home “VS” tile enters it accidentally; duplicates mode briefing responsibilities | Keep only if Streak remains a supported mode | Merge with common mode briefing | Yes: current modal | Yes |

## Core card-flipping game screens

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Deck Picker | Selects the deck used for memory gameplay | Route is not exposed by the current home; selection, ownership and mode context are weakly separated | Yes | Merge its shell with a common mode setup pattern | Yes: current layout | Yes |
| Standard memory match | Core card-flipping and matching game | Solid game behaviour is surrounded by a highly bespoke HUD, effects and overlay system; layout does not scale cleanly beyond the simulated phone | Yes: mechanics and state feedback | Merge HUD and objective treatment with common gameplay primitives | No | Yes |
| Streak memory match | Repeated memory rounds with streak progression | Reuses the game screen but adds mode-specific status and result variants; current entry label is misleading | Yes, subject to product confirmation | Merge with the standard gameplay shell and common result system | No | Yes |
| Season memory match | Memory level launched from the season map | Mode context and objective briefing are split between map, game and result treatments | Yes | Merge with the standard gameplay shell and common level briefing/result patterns | No | Yes |
| Gauntlet memory match | Encounter in the gauntlet sequence | Entry and result logic are spread across Gauntlet, Round Start and Game; too many transitions for one encounter | Yes | Merge with the standard gameplay shell | No | Yes |
| Solo/time-challenge variant | Timed or move-limited solo game variant present in game logic | No dependable visible entry from the current home; player-facing identity is unclear | Keep the behaviour pending mode rationalisation | Merge into the standard mode picker and gameplay shell | Delete any duplicate standalone shell | Yes |
| Pass-and-play game | Local alternating-player memory mode | Code exists but current home does not expose its callback; pass-device privacy needs a deliberate flow | Yes | Merge board and results with the common gameplay shell | No | Yes |
| Online multiplayer game | Networked memory match | Current home does not expose the lobby; error, reconnect and ownership states need a coherent social shell | Yes, after the underlying flow is verified | Merge board and results with the common gameplay shell | No | Yes |
| Pass-device handoff | Hides the board while one local player passes the device | Important privacy behaviour but presented as a one-off overlay | Yes | Merge into a reusable blocking game-state overlay | Yes: current visual treatment | Yes |
| Memory game result suite | Displays win, loss, streak, solo and multiplayer outcomes | Many condition-specific result panels repeat structure and actions; reward presentation and result facts are intermingled | Keep the result facts and actions | Merge into one configurable result screen | Yes: duplicated variants | Yes |
| Tie-break state | Resolves an equal multiplayer result | Bespoke state inside an already complex result flow | Keep if the rules require it | Merge with the common result/next-round flow | Yes: standalone treatment | Yes |
| Quit and easy-win/easy-loss confirmations | Confirms leaving or developer-assisted outcomes | Multiple bespoke dialog presentations; development actions can appear near player actions | Keep quit confirmation; keep assisted outcomes only in dev builds | Merge into shared confirmation dialog | Yes: individual variants | Yes |

## Progression, mode and puzzle screens

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Season Map | Shows staged seasonal progression and launches levels | Heavily absolute-positioned scene; decorative characters and effects compete with progression; difficult to adapt to landscape/tablet/text scaling | Yes: progression map purpose | No | Yes: current scene composition | Yes |
| Gauntlet | Shows opponent sequence, player status and encounter progression | Bespoke game-show presentation; duplicates map/progression concepts; dense effects obscure the next action | Yes: encounter ladder purpose | Consider one shared progression-map framework, without merging the modes themselves | Yes: current composition | Yes |
| Round Start | Introduces the next gauntlet opponent | Separate transition screen adds friction and contains information that can fit a briefing sheet | Keep the opponent/encounter information | Merge into Gauntlet or the common mode briefing | Yes: standalone screen | Yes |
| Match-3 Level Map | Selects one of the development Match-3 levels | Functional but visually isolated from the rest of Flip-Out; development information and player information share space | Yes | Use the common progression-map and level-button language | Yes: current styling | Yes |
| Match-3 Brief | Explains objectives, moves and optional power-ups | Separate full phase for a small amount of information; controls are not based on shared patterns | Keep the information and power-up choice | Merge into a level briefing sheet | Yes: standalone visual phase | Yes |
| Match-3 Game Board | Runs Match-3 play and shows objectives, moves and score | Strong keyboard/ARIA foundations, but dense prototype styling and fixed proportions; HUD does not share patterns with memory play | Yes: interaction behaviour and accessible grid | Merge HUD primitives with other gameplay screens | No | Yes |
| Match-3 Result | Shows win/loss, score and next actions | Duplicates common game-result responsibilities | Keep the facts and actions | Merge into the configurable result screen | Yes: standalone visual variant | Yes |
| Reveal Setup | Configures the Reveal memory variant | Duplicates deck/mode setup and is not exposed by current home navigation | Keep configuration behaviour if the mode remains | Merge into common mode setup | Yes: standalone screen | Yes |
| Reveal active game | Runs the Reveal variant | Mechanically related to memory play but has its own screen language and route | Keep if the mode remains distinct enough | Reuse common gameplay HUD, cards and controls | No | Yes |
| Reveal result | Reports Reveal outcome | Duplicates the general result system | Keep result data | Merge into the configurable result screen | Yes: standalone presentation | Yes |

## Social screens

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Multiplayer Lobby | Creates or joins an online game | Not reachable from current visible home; form, status and invite states need clearer hierarchy and protected-identity messaging | Yes | Reuse shared forms, waiting states and account-protection prompts | Yes: current layout | Yes |
| Leaderboard | Displays rankings | Appears to be prototype/static data rather than an authoritative competition flow; unclear period, rules, rewards and identity treatment | Keep the concept, postpone authority-dependent details | Could become a tab within Social/Events | Yes: current implementation as a finished-looking screen | Yes |

## Economy, reward and collection screens

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Shop | Presents purchases, boosters, power-ups, offers and ad removal | Several unrelated catalogues and currencies share one long screen; some cards have no action; local legacy purchase UI conflicts with server-authoritative economy direction | Yes: catalogue and purchase entry | Merge purchase categories into one coherent catalogue framework, not one endless page | Yes: current composition and unsupported controls | Yes |
| Lucky Spin | Presents the daily weighted wheel reward | Reward logic and presentation are too tightly perceived; current copy can label Stars as Coins; navigation and cooldown state are bespoke | Yes: as the first future Reward Theatre adapter | Reuse shared reward receipt and currency components | Yes: current presentation | Yes |
| Inventory | Lists owned items and quantities | Functional scaffold with inline styling; no collection hierarchy, filtering, item detail, provenance or clear empty states | Yes | Establish its relationship with Collections/Decks before choosing tabs | Yes: current scaffold | Yes |
| Marketplace/Exchange | Lists player offers and economy actions | Prototype scaffold; “Marketplace” naming conflicts with the approved Exchange terminology; high-value identity and audited ownership states are not represented | Yes: Exchange purpose only | Could share item-detail and catalogue primitives with Inventory/Shop while remaining a distinct flow | Yes: current scaffold and terminology | Yes |

## Profile, settings and information screens

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Avatar Picker | Selects a player avatar | Not reachable from current visible home; standalone destination for one preference; selection feedback is visually bespoke | Keep avatar selection | Merge into Profile/Identity | Yes: standalone screen | Yes |
| Settings | Controls audio, motion, input and other preferences | Valuable controls, but grouping, control styles and navigation are inconsistent; accessibility settings need clearer explanations | Yes | Host About, Privacy and Patch Notes links in its information section | Yes: current layout only | Yes |
| About Us | Product/about information | Standalone screen duplicates legal/info navigation shell | Keep content | Merge into an Information section reached from Settings | Yes: standalone shell | Yes |
| Privacy Policy | Displays privacy information | Necessary content but presented through a bespoke game screen; version/effective-date treatment should be explicit | Yes | Merge navigation into the Information section; retain a dedicated readable document view | Delete only the bespoke decorative shell | Yes |
| Patch Notes | Shows version changes | Standalone screen and current-version signalling are disconnected from deployment/version reporting | Yes | Merge entry into Information/News; retain a readable detail view | Yes: current shell | Yes |

## Overlays and secondary flows

| Screen or state | Purpose | Current problems | Should Keep | Should Merge | Should Delete | Needs Complete Redesign |
|---|---|---|---|---|---|---|
| Daily Bonus | Claims a daily/streak reward | Uses a prop named `coins` while displaying Stars through legacy Coin assets; authority and reward receipt are visually ambiguous | Yes: daily claim purpose | Merge claim result with the common reward receipt | Yes: current currency-specific presentation | Yes |
| Special Offer | Shows a timed purchase offer | Local countdown and “never shown again” language conflict with the newer anti-FOMO philosophy; purchase authority is unclear | Keep a server-authored offer slot only | Merge with Shop catalogue and shared purchase sheet | Yes: current offer and copy | Yes |
| Bug Report | Collects development feedback | Modal exists but no visible code path opens it; form behaviour is tied to Home | Keep support/feedback capability | Merge with a shared Help/Feedback flow; keep Match-3 dev feedback separate | Yes: unreachable Home-local modal | Yes |
| Remove Ads | Offers an ad-removal purchase | Component is declared but not opened; legacy local Coin granting is incompatible with the economy boundary | Keep only a properly verified catalogue product | Merge into Shop purchase flow | Yes: current component | Yes |
| Rewarded-ad unavailable state | Safely reports when an advert cannot be shown | Useful failure behaviour but styled as a one-off interstitial | Yes | Merge with shared system dialog/toast patterns | Yes: bespoke presentation | Yes |
| Cookie consent banner | Records web consent choice | Important web-only control, but competes with fixed navigation and uses a one-off visual language | Yes, where legally required | Reuse shared banner/actions and privacy link | No | Yes |
| Match-3 development feedback panel | Exports non-personal real-device test observations | Correctly development-only, but should not influence permanent player UI | Yes as a dev tool | Merge into a development tools drawer | Yes from production builds, not from source | Light redesign only |

## Screen-level conclusions

1. The core mechanics and their state transitions should be retained. The existing page compositions should not be.
2. Flip-Out currently has too many full-screen transitions for setup, briefing, handoff and results. Shared sheets, dialogs and result structures can reduce duplication without merging distinct game modes.
3. Shop, Inventory and Exchange require a shared item language, but they must remain distinct destinations with different permissions and transaction rules.
4. The permanent information architecture must be approved before any route is reconnected or removed. Unreachable screens may still contain valuable behaviour.
5. Development tools should move into a development-only tools area, never remain mixed into player navigation.
6. The home redesign must make the collection, progression, reward and economy loops legible without making optional characters the organising principle.
