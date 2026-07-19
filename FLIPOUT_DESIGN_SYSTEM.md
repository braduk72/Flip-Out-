# Flip-Out Design System

## Status

This is the approved permanent visual language, using final Concept 4D as the master reference. Its Home-required foundation is now implemented in `src/ui/` with runtime assets in `public/ui/`. Later screens must extend these primitives rather than create independent visual languages.

Working name: **Midnight Collector**.

Canonical visual reference: **Final Concept 4D Home**. Its fixed safe-area header, compact promotional carousel, luminous Match-3 hero, signature purple Play control, restrained progression panel and four-item navigation define the visual ceiling and hierarchy for every future screen.

## System governance

Every Flip-Out interface is assembled in four layers:

1. **Tokens:** colour, typography, spacing, radius, elevation, glow, motion, sound and haptic values.
2. **Primitives:** button, icon, text, badge, progress bar, input, divider and surface.
3. **Patterns:** product card, reward receipt, currency counter, navigation, dialog, item row and gameplay HUD.
4. **Screens:** compositions of approved patterns. Screens do not create new local button, panel, currency or dialog languages.

Rules:

- A screen may request a new primitive only when no approved primitive can express a required state.
- New primitives require a documented purpose, variants, state matrix, responsive behaviour, accessibility contract and removal of any superseded duplicate.
- Seasonal skins change decorative tokens and content artwork, not component geometry, interaction meaning, semantic colours or economy rules.
- All primitives appear in a development-only component gallery with every state, supported size, motion setting, text scale and theme.
- Production artwork may decorate approved slots but may not contain essential labels, prices, progress, controls or transaction status.
- The Home screen establishes quality and energy, not a fixed layout to be copied onto every screen.

## Required component states

Every interactive primitive supports the applicable states below:

| State | Required treatment |
|---|---|
| Default | Normal readable and operable state |
| Hover | Pointer-only enhancement; never required to understand the action |
| Pressed | Immediate visual response and optional matched haptic/audio cue |
| Focus-visible | System Focus ring with at least 3:1 adjacent contrast |
| Selected | Label/icon/shape change in addition to colour |
| Disabled | Readable but unavailable; exposes disabled semantics and no click path |
| Pending | Stable size, progress feedback and duplicate-submit protection |
| Success | Confirmed outcome with text/icon and optional restrained celebration |
| Warning | Clear consequence and route to continue or cancel |
| Error | Plain-language explanation, preserved input and retry/recovery action |
| Offline | Distinguishes unavailable network work from a failed transaction |
| Locked | Explains the requirement; never appears merely broken |
| New | Short-lived semantic badge with a deterministic clear rule |

## Design principles

1. **Collection first.** Cards, decks, albums, progress and owned items receive the strongest visual hierarchy.
2. **One clear next action.** Every screen has one primary action; secondary actions remain visibly secondary.
3. **Calm shell, exciting rewards.** Navigation and economy screens stay stable and readable. Reward Theatre may be celebratory after the server has committed the reward.
4. **State before decoration.** Ownership, rarity, affordability, lock state and selection never rely on glow or colour alone.
5. **Mechanics are the identity.** Maurice, Sprocket and future shop characters may add flavour but never determine navigation or require bespoke core layouts.
6. **Authority is visible.** Pending, confirmed, failed and retry-safe transaction states use consistent language and presentation.
7. **Adaptive, not phone-framed.** Layouts support small phones, landscape and tablets without simulating a physical handset.

## Colour palette

| Token | Value | Use |
|---|---:|---|
| Canvas | `#0B1020` | Application background |
| Surface | `#151D33` | Primary panels and navigation |
| Surface elevated | `#1D2945` | Dialogs, sheets and raised cards |
| Surface inset | `#101729` | Wells, progress tracks and grouped controls |
| Border | `#34415F` | Default boundaries |
| Text primary | `#F7F9FC` | Main text |
| Text secondary | `#AEB8CC` | Supporting text |
| Text disabled | `#6F7A91` | Disabled labels |
| Primary gold | `#F5C451` | Primary action and Coin identity |
| Primary ink | `#241B06` | Text/icons on primary gold |
| Progress teal | `#57D3C5` | Progression, active navigation and selection |
| Progress ink | `#062D2A` | Text/icons on progress teal |
| Star blue | `#7DD3FC` | Stars and earned progression currency |
| Signature purple | `#6D28D9` | Play control and flagship action identity |
| Signature purple deep | `#3B0764` | Play-button depth and pressed state |
| Neon violet | `#A855F7` | Active edge light and Epic accents |
| Neon cyan | `#22D3EE` | Match-3, focus-support and live progression accents |
| Neon magenta | `#EC4899` | Celebration accents and selected foil detail |
| Coin gold | `#F5B90B` | Coin icon, Coin Store and Coin-denominated prices |
| Success | `#4ADE80` | Confirmed success |
| Warning | `#FBBF24` | Caution, expiring but non-destructive state |
| Danger | `#FB7185` | Destructive actions and failures |
| Focus | `#A78BFA` | Keyboard focus ring |
| Scrim | `#050814CC` | Modal background |

Rules:

- Coins always use Primary gold; Stars always use Star blue. They also require distinct icons and text labels.
- The signature purple Play control is unique to launching the flagship experience or an equivalent primary game start. It is not reused for ordinary confirmations or purchases.
- Rarity receives a named badge and shape/pattern, not only a colour.
- Text and controls must meet WCAG AA contrast in their final combinations.
- Gradients are reserved for reward or rarity accents, never used as a substitute for hierarchy.
- Seasonal skins may replace decorative accents but not semantic state colours.
- Neon tokens are edge/accent colours. They do not become body-text colours on bright surfaces without measured contrast.
- White text over imagery requires a controlled dark scrim; text is never placed directly over uncontrolled artwork.

### Rarity tokens

| Rarity | Accent | Required non-colour cue |
|---|---|---|
| Common | Slate | Circle pip and “Common” label |
| Uncommon | Green | Diamond pip and “Uncommon” label |
| Rare | Blue | Two-diamond pip and “Rare” label |
| Epic | Violet | Crown pip and “Epic” label |
| Legendary | Gold | Starburst pip and “Legendary” label |

Foil is a variant, not a rarity. It uses an explicit Foil label/icon and restrained material shimmer in Full motion; it never relies on rainbow colour alone.

## Typography

No font assets are added in this package. The intended character is rounded, confident and highly readable.

Proposed production families:

- **Display and headings:** Nunito Sans, weight 700–900.
- **Body and controls:** Atkinson Hyperlegible, weight 400–700.
- **Fallback:** system UI, Segoe UI, sans-serif.

| Style | Size / line height | Weight | Use |
|---|---|---:|---|
| Display | 36 / 40 px | 900 | Rare celebration or page hero |
| Page title | 28 / 34 px | 800 | Screen title |
| Section title | 22 / 28 px | 800 | Major content group |
| Card title | 18 / 24 px | 700 | Card/panel heading |
| Body | 16 / 24 px | 400 | Default readable copy |
| Body strong | 16 / 24 px | 700 | Values and emphasis |
| Label | 14 / 20 px | 700 | Field, tab and metadata label |
| Caption | 12 / 16 px | 600 | Secondary metadata only |

Rules:

- Player instructions and body copy never fall below 16 px.
- All-caps is limited to very short badges; never paragraphs or instructions.
- Currency values use tabular numerals.
- Text scaling must not clip at 200%.
- Layered logo lettering is reserved for the Flip-Out brand mark. A restrained outline/shadow may support the giant Play label or a Reward Theatre display title; body copy, prices and instructions remain clean text.

## Spacing and layout

Use a 4 px base grid:

- `4`: optical adjustment only
- `8`: tightly related elements
- `12`: control internal spacing
- `16`: standard component gap and phone page gutter
- `24`: panel padding and section gap
- `32`: major section separation
- `48`: page-level separation

Layout rules:

- Minimum phone gutter: 16 px.
- Tablet content uses a centred maximum readable width or a deliberate two-column layout; it does not stretch phone cards indefinitely.
- Respect safe-area insets on every edge.
- Never enforce a 390 × 844 application frame.
- At 320 CSS pixels, primary actions, currency values and gameplay controls remain visible without horizontal scrolling.
- Phone layouts are portrait-only. Tablet landscape gameplay prioritises the board and places HUD/objectives beside it where space permits.

## Responsive layout contract

This contract is mandatory for the permanent redesign:

- The design baseline is the **common modern mobile width range of 360–430 CSS pixels**, not a named phone, fixed height or simulated handset.
- A narrow-phone check begins at 320 CSS pixels. Large phones, foldables and tablets progressively reflow rather than displaying an enlarged phone frame.
- Viewport height is treated as variable. Browser controls, keyboards, split-screen mode and device rotation must not hide the primary action or navigation.
- Safe-area padding is added to the normal layout gutter on the top, bottom and sides. Status bars, Dynamic Island/notch regions, rounded display corners, home indicators and system gesture areas remain unobstructed.
- Core layout uses normal document flow, flexible rows/columns and intrinsic component sizing. Fixed coordinates are prohibited for navigation, content panels, counters and primary actions.
- Absolute positioning is limited to non-essential decoration inside a component. Decorative layers cannot determine component size, reading order or hit targets.
- Spacing changes by token and available room: compact spacing on narrow/short screens, standard spacing on normal phones and expanded section spacing or multi-column composition on tablets. Panels are never uniformly stretched.
- Typography, icons, control heights and gutters scale within approved minimum and maximum bounds. The complete interface is never scaled as one bitmap.
- The flagship Play action remains the highest-contrast, largest action at every breakpoint. On short screens, secondary content scrolls or condenses before the Play action loses prominence.
- Components may wrap, stack, collapse supporting detail or move into a second column. They may not overlap, clip important content or create large unused areas.
- Phone layouts use a single primary flow. Larger screens use the extra space deliberately—for example, a wider Match-3 spotlight paired with a progress column—while preserving the same task order.
- Tablet layouts use available width without becoming an isolated phone-shaped column in the centre. Readable text may retain a maximum line length while panels and supporting regions form an intentional wider composition.

### Responsive validation set

Every redesigned screen must be reviewed at:

- 320 CSS-pixel narrow phone width
- 360–430 CSS-pixel standard modern phone range
- A phone-landscape orientation-guard check
- A large phone or foldable-width viewport
- 768 CSS-pixel tablet width
- A larger tablet in portrait and landscape
- 200% text scaling
- Safe-area insets on every edge

Passing at one reference size does not count as a responsive design pass.

## Corner radii

| Token | Radius | Use |
|---|---:|---|
| Control | 8 px | Inputs, compact buttons |
| Compact | 12 px | Chips, counters, small cards |
| Panel | 16 px | Standard cards and panels |
| Hero | 24 px | Dialogs, sheets and featured panels |
| Pill | 999 px | Status chips only |

Nested components use a smaller radius than their container. Circles are reserved for icon controls, avatars, wheel elements and explicit circular content.

## Shadows and elevation

| Level | Shadow | Use |
|---|---|---|
| 0 | None | Default flat content |
| 1 | `0 2px 8px #00000033` | Navigation and standard raised cards |
| 2 | `0 8px 24px #0000004D` | Dialogs and temporary overlays |
| Focus | `0 0 0 3px #A78BFA` | Keyboard focus |

Rules:

- Elevation communicates stacking, not rarity or importance.
- Components use one shadow level at a time.
- Neon glows are reward effects, not the default focus or layout treatment.

## Glows and luminous edges

Glows provide the premium energy visible in the canonical Home screen. They are tokenised effects, never arbitrary per-screen filters.

| Token | Visual intent | Allowed use |
|---|---|---|
| Glow subtle | Low-opacity 8 px edge bloom | Selected nav, active progress and quiet live states |
| Glow active | 12–16 px coloured edge bloom | Primary actionable panel or claimable reward |
| Glow signature | Purple inner light plus gold outer rim | Giant Play control only |
| Glow currency | Tight gold or blue icon halo | Coin/Star gain confirmation and store hero |
| Glow celebration | Short-lived multi-colour bloom | Committed reward or major milestone |
| Glow danger | Tight Danger-colour edge | Error/destructive confirmation only |

Rules:

- A component uses at most one persistent glow token. Celebration may temporarily layer over it.
- Only one region per screen receives Glow active or Glow signature.
- Glow does not replace a border, label, focus indicator or contrast requirement.
- Focus uses the dedicated Focus ring and remains distinguishable from decorative neon.
- In Reduced motion, animated glow becomes a stable edge. In Off mode, all glow animation stops.
- Glows are clipped to their owning component except for explicitly approved hero/reward particles.
- Bright bloom never passes behind body text or obscures tile/card silhouettes.

## Buttons

All interactive controls use a minimum 48 × 48 logical-unit hit area across the shared system. An icon may appear smaller inside that area. Primary text buttons use a 48 px minimum visible height.

### Signature Play

- Signature purple face, purple depth, gold rim and white label.
- Reserved for the primary game launch. It remains the largest and highest-energy control in its composition.
- Minimum visible height: 72 logical units on narrow phones; it grows with the hero rather than shrinking on larger screens.
- Full motion: slow highlight sweep and subtle breathing edge. Reduced: static luminous edge. Off: static border and shadow.
- Never used for Buy, Claim, Continue-after-loss, Confirm or navigation.

### Primary

- Primary gold fill and Primary ink label for a screen's committed non-game action.
- One per screen region.
- Used for Claim, Continue, Confirm or Save. Purchase buttons use the Store variant.

### Secondary

- Surface elevated fill, Border outline, Text primary label.
- Used for valid alternatives.

### Quiet

- Transparent background with Text primary or Progress teal label.
- Used for Back, Skip, Details and low-emphasis actions.

### Danger

- Danger fill for a destructive confirmation only.
- The initial destructive action may be outlined; the confirmation is explicit.

### Store / purchase

- Coin-gold price treatment with explicit currency icon and amount.
- Label follows the action: “Buy”, “Open for”, “List for” or “Convert”; never an amount alone.
- Pending disables resubmission and preserves the product/price while the server confirms.
- Success becomes a durable receipt state. Failure preserves the offer and exposes a safe retry.

### Reward claim

- Uses Primary styling only when a committed reward is ready to claim.
- Never appears for a countdown or unavailable reward.
- Includes a reward summary and claim status outside the button label.

### Icon button

- Contains one system icon and an accessible name.
- Used only where the icon’s meaning is established; otherwise pair it with text.

### Button sizes

| Size | Visible height | Typical use |
|---|---:|---|
| Compact visual | 36 px inside a 48 px hit area | Dense toolbar where permitted |
| Standard | 48 px | Forms, dialogs and ordinary actions |
| Large | 56 px | Primary screen action |
| Signature | 72 px minimum | Play / flagship launch |

States for every button: default, hover where available, pressed, focus-visible, disabled, pending and confirmed/error where transaction-sensitive. Pending actions retain their width and cannot be submitted twice.

## Panels

### Standard panel

Surface fill, Panel radius, 1 px Border, 24 px padding. Used for grouped content.

### Inset panel

Surface inset fill, Panel radius, no shadow. Used for progress, filters and embedded summaries.

### Elevated panel

Surface elevated fill, Hero radius, elevation level 1. Used for featured content and sheets.

### Modal

Elevated panel over Scrim, one clear title, concise purpose, explicit primary/secondary actions and a visible close route when dismissal is safe.

### Reward frame

Uses the same structural spacing as an elevated panel. Presentation type and skin may decorate outside that structure, but cannot change the committed reward, odds, amount or claim ID.

### Fixed player header

- Owns the safe-area inset plus one normal-flow header row.
- Contains avatar, player name, level, XP, Stars, Coins and Coin Store access.
- Uses compact spacing on narrow/landscape phones and may reflow into two rows at large text sizes.
- Measures its rendered height so scrolling content begins below it.
- Branding is visible but subordinate to player identity and the current action.

### Promotional carousel

- One active banner, pagination, manual previous/next controls and swipe gesture.
- Supports Season, Community Challenge, Angelica’s Augments, Demonica’s Domain, Double Stars, new collection, Coin Store and limited-offer content through one data contract.
- Essential copy, price, dates and action labels are live UI text, never baked into artwork.
- Automatic rotation is optional, pauses on interaction/focus and stops in Reduced/Off motion.
- Content order and eligibility are server/configuration driven; the component does not invent sale urgency.

### Gameplay hero

- Holds a mode/level title, objective summary, optional non-interactive live preview and Signature Play action.
- The live preview advertises real gameplay but cannot accept accidental game input.
- Preview motion is silent and exposes one concise accessibility label rather than every decorative tile.
- Supporting content scrolls or condenses before the hero loses action dominance.

### Progress group

- One shared surface containing up to three actionable progress rows.
- Has no generic heading when row labels are already self-explanatory.
- Shows meaningful milestones, owned items or next rewards—not waiting-only countdowns.
- A Daily Reward row replaces another row only while a claim is genuinely available.

### List row

- Whole-row 48 px minimum target with leading icon/thumbnail, title, supporting value, optional progress and trailing action/state.
- Text wraps and row height grows at large text.
- Trailing chevron is a visual cue; the whole row remains the target.

### Sheet and popover

- Bottom sheet is preferred for short mobile setup/details; it becomes a centred dialog or side sheet when width permits.
- Popovers are limited to non-blocking contextual detail and never contain a critical purchase confirmation.
- Both inherit dialog focus, safe-area, dismissal and motion rules.

## Progress bars and counters

- Progress bars show a numeric or textual value, not colour alone.
- Track: Surface inset. Fill: Progress teal by default.
- Segmented progression uses explicit stage labels.
- Currency counters always pair icon, formatted value and accessible currency name.
- A changing authoritative balance shows pending/confirmed feedback without optimistically inventing a final value.
- Timers show both visual progress and readable remaining time.

### Progress variants

| Variant | Required content | Use |
|---|---|---|
| Linear | Label, current/target value, fill | XP, album, foil and season progress |
| Segmented | Named stages and current stage | Multi-stage events and streaks |
| Objective | Objective icon/name plus remaining count | Gameplay HUD |
| Timer | End time or remaining duration plus state | Events and time-limited play |
| Indeterminate | Accessible busy label; no fake percentage | Network/save/purchase work |
| Circular | Value and text alternative | Small completion summary only |

Rules:

- Fill animation starts from the previously displayed value and ends at the confirmed value; retries do not replay a false gain.
- A completed bar changes label/icon as well as colour.
- Timer expiry is server-time-aware where value or eligibility is affected.
- Progress bars are not interactive unless explicitly implemented as sliders.
- Indeterminate animation stops in Reduced/Off motion but retains a visible busy state.

## Currency primitives

### Stars

- Earned-only progression currency.
- Star-blue icon with a five-point silhouette and visible “Stars” name in accessible text.
- Never purchasable, tradable or transferable.
- May be granted through authoritative gameplay/reward transactions.

### Coins

- Premium economy currency created only by verified purchases or explicitly authorised server grants.
- Coin-gold circular icon, accessible “Coins” name and server-authoritative balance.
- Every creation, spend, conversion, settlement, fee, gift and refund is ledger-backed.
- Never directly transferable player-to-player.

### Coin-to-Star conversion

- Exact direction: 1 Coin becomes 10 Stars; Stars never become Coins.
- Confirmation shows both sides, the irreversible direction and the shared transaction reference.
- Pending and retry states never show partial completion.

### Currency counter

- Icon, tabular value, accessible name and optional add/store action.
- Compact display may abbreviate visually after 999,999 only if exact value is available on focus/tap and to assistive technology.
- Balance changes animate once after authoritative confirmation. Reduced/Off modes update without counting animation.
- Insufficient balance never redirects silently; it explains the requirement and offers an explicit Store route where appropriate.

### Price

- Always pairs amount with the Coin or Star icon/name.
- Zero-price content says “Free”; it does not display a crossed-out fabricated price.
- Sale price shows original price, current price, end condition and server-authored eligibility.
- Real-money price uses the storefront-provided localised value and currency string.

### Transaction status

- Shared states: reviewing, awaiting platform, confirming, complete, retryable failure and non-retryable failure.
- Transaction ID/reference is retained for support but not shown as noisy primary text.
- A completed purchase produces a durable receipt with item, amount, account and restoration status.

## Navigation

The approved permanent Home navigation is:

- **Home**
- **Collection**
- **Rewards**
- **More**

The giant Signature Play control launches the flagship Match-3 experience, so Play is not duplicated in bottom navigation.

Navigation rules:

- Current location is signalled with label, icon state and contrast.
- Back behaviour is predictable and never competes with purchase close/cancel behaviour.
- Game modes, Collection, Progression, Shop and Exchange are named consistently.
- “Marketplace” is replaced by the approved “Exchange” term.
- Protected-identity prompts appear only at high-value boundaries, never as a start-playing gate.
- Development tools do not appear in player navigation.
- Bottom navigation remains fixed, consumes the bottom safe area and gives every destination an equal 48 px minimum target.
- More opens a structured destination sheet/page; it is not an unlabelled dumping ground.
- Collection may host Cards, Decks, Albums and Inventory as tabs. Rewards hosts Daily, Challenges, Events and Reward history. Exchange and Shop remain separate destinations reached from approved entry points.
- Back returns within the current task; Home intentionally abandons the task only after confirming destructive/pending work.
- Deep links restore a valid navigation stack and never bypass protected-identity or purchase checks.
- Route changes restore focus to the new screen heading or primary task.

### Tabs

- Used only for peer views within one destination.
- Tab label remains visible; icons are optional support.
- Active state uses underline/shape plus text/contrast.
- Tabs may horizontally scroll only when unavoidable and expose previous/next affordances.

### Carousel pagination

- Swipe, arrow buttons and pagination controls perform the same action.
- Pagination announces current slide and total count.
- Automatic advance never steals keyboard/screen-reader focus.
- A manually selected slide remains selected until the player leaves or explicitly resumes rotation.

## Icon style

- Rounded geometric silhouettes on a 24 px grid.
- Consistent 2 px stroke for outline icons.
- Filled version may indicate selected navigation.
- Icons use simple interior detail that remains clear at 20–24 px.
- No emoji as permanent interface icons.
- Currency, rarity, lock, owned, new and warning states each have distinct shapes.
- Character portraits are content, not navigation icons.

### Icon sizes

| Token | Size | Use |
|---|---:|---|
| Icon small | 16 px | Inline metadata |
| Icon standard | 24 px | Buttons, tabs and list rows |
| Icon large | 32 px | Navigation and headers |
| Icon feature | 48 px | Reward/item emphasis |

Rules:

- Icons align optically to the grid and use a consistent visual weight.
- Filled icons indicate an active destination only when paired with the label/state.
- A 24 px icon in an icon button still receives a 48 px hit area.
- Decorative icons are hidden from assistive technology; actionable icons receive an accessible name from the control.
- New icons are added to the shared icon catalogue, never embedded as one-off screen imagery.

## Card style

### Gameplay memory cards

- Stable square footprint and clear face/back states.
- Back design does not reveal item rarity or identity.
- Selected, matched, disabled and keyboard-focused states are visually distinct.
- Flip animation preserves board position and has a reduced-motion alternative.

### Collection cards

- Consistent 3:4 aspect ratio.
- Art region, item name, set, rarity, variant and ownership count occupy stable positions.
- Foil and Rare Foil are explicit item variants with a label/icon, not merely a CSS glow.
- Locked cards reveal only product-approved information.

### Product and reward cards

- Show contents, price/currency, ownership or limits, and the primary action in a predictable order.
- Chance-based products link to odds before purchase.
- Transaction state is separate from the product artwork.

### Match-3 tiles and board

- Every tile type has a unique silhouette or internal symbol as well as colour.
- Minimum visual separation preserves individual hit areas and selected/focus outlines.
- Special pieces retain a base-type cue plus a distinct special overlay.
- Swap, selected, matched, falling, blocked, power-up and disabled states use the shared motion/state tokens.
- Foil shimmer is decorative and disappears in Reduced/Off motion without hiding the foil label/state.

### Promotional card

- Uses one reusable carousel frame with art slot, eyebrow, title, supporting detail, progress/price and one action.
- Required content remains readable without the art.
- Partial adjacent-card reveal is decorative; arrow/pagination controls remain available.

### Exchange listing card

- Shows item/variant, seller identity state, quantity, Coin price, 10% fee disclosure where relevant, remaining duration and listing status.
- Buy/list/cancel actions use shared Store/confirmation/transaction patterns.
- Ownership and settlement states are server-authored and never inferred from client animation.

### Booster / pack card

- Shows eligible contents, quantity, Coin price, ownership limits and odds link before purchase.
- Opening uses Reward Theatre only after the purchase/claim outcome is committed.

### Power-up card

- Shows name, exact effect, owned quantity, availability and price/source.
- Disabled explains why; it never appears purchasable without functioning logic.

### Avatar and identity card

- Shows avatar, protected/guest state, player name where available and recovery/linking status.
- Guest state is neutral and playable; protection prompts appear only at recovery or high-value boundaries.

## Badges, chips and tabs

- Badges communicate short state: New, Owned, Locked, Foil, Sale or Limited.
- Chips filter or select; they are not miniature buttons for unrelated actions.
- Tabs switch peer views within one destination and retain a stable tab bar.
- Sale and seasonal labels include readable dates/conditions where relevant.

### Badge rules

- Maximum two badges per card; additional state moves into metadata/detail.
- Badge copy is one to two words and remains readable without colour.
- “New” clears after the item is viewed under a documented rule.
- “Sale” requires an actual lower server-authored price and end condition.
- “Limited” identifies availability, not artificial urgency.

## Form controls

All form controls use shared label, helper, error and focus primitives.

| Primitive | Contract |
|---|---|
| Text field | Persistent label, optional helper, clear error, autofill purpose and 48 px minimum height |
| Search field | Used only on content-heavy Collection/Exchange surfaces; includes clear action and result count |
| Checkbox | Multi-select/independent option with full label target |
| Radio | One choice from a visible group |
| Switch | Immediate binary setting; not used for a deferred form choice |
| Select | Native/platform picker where practical; current value remains visible |
| Slider | Visible current value, keyboard steps and text alternative |
| Stepper | Minus/value/plus with disabled limits and 48 px targets |
| Segmented control | Two or three short peer modes; never wraps into ambiguous rows |

Rules:

- Validation occurs at a useful time and never erases input.
- Required status is explicit in text and semantics.
- Placeholder text never replaces a label.
- Numeric Coin/Star inputs show limits, fee and resulting amount before submission.
- Browser or platform password fields are not introduced for start-playing identity.

## Feedback and status primitives

### Badge / status dot

- Used only when a meaningful unread/new/claimable condition exists.
- Has an accessible text equivalent and deterministic clear rule.

### Toast

- Confirms reversible, non-critical actions.
- Never carries a purchase receipt, destructive error or information required to continue.
- Pauses long enough for reading and is announced once.

### Banner

- Persistent account, offline, maintenance or eligibility information.
- Includes one primary resolution action at most.
- Does not compete visually with the promotional carousel.

### Loading

- Skeletons match final component geometry without fake data.
- A busy label is exposed to assistive technology.
- Operations over one second explain the task; long operations expose cancellation only when safe.

### Empty state

- States what is empty, why where known and one useful next action.
- Never blames the player or replaces missing data with fake items.

### Error state

- Distinguishes validation, offline, permission, server, storefront and unknown failures.
- Preserves recoverable input/state and provides retry or support reference.

### Offline state

- Read-only cached information is visibly dated.
- Economy, purchase, Exchange and reward claims do not pretend to complete offline.

## Dialog and notification philosophy

- Use a dialog only when the player must decide before continuing.
- Use a sheet for setup, details or a short secondary task.
- Use a banner for persistent system/account information.
- Use a toast for a reversible, non-critical confirmation.
- Purchases and server rewards receive durable receipt/status treatment rather than a disappearing toast.

### Dialog anatomy

1. Optional semantic icon
2. Short title
3. Consequence/context text
4. Optional structured detail
5. Primary action
6. Secondary/cancel action
7. Close control only when dismissal is safe

Rules:

- Mobile dialogs fit inside all safe areas and scroll internally only when content cannot fit.
- Destructive confirmation names the object/consequence; button copy is the action, not “Yes”.
- Purchase confirmation shows item, quantity, currency, price, resulting balance/fee and restoration eligibility.
- Escape/back follows the visible cancel/close action and never confirms.
- Opening moves focus into the dialog; closing returns it to the opener.
- Background content is inert while modal content is open.

### Reward receipt

- Displays the already committed reward, transaction/claim state and inventory/balance destination.
- Presentation skin or theatre type cannot change the outcome.
- Retry reuses the same claim/transaction identity.
- Multi-reward chests display one atomic receipt with every category.

### Continue-after-loss

- Shows loss reason, continue cost/source, remaining balance and exactly what state will be restored.
- Rewarded-ad and Coin options are distinct, availability-authored actions.
- Decline is always clear and cannot be disguised as a secondary purchase button.

### Identity protection prompt

- Appears only before recovery, cross-device, trading, Exchange, auctions or other high-value action.
- Explains the benefit and available platform-native link methods.
- Never blocks first play or demands a public username/password.

## Animation philosophy

| Motion token | Duration | Use |
|---|---:|---|
| Instant | 0 ms | Off mode and state that must not lag |
| Immediate | 100 ms | Press/focus colour and small state changes |
| Fast | 160 ms | Toggle, chip, tooltip and compact feedback |
| Standard | 220 ms | Panel, tab, list and selection transitions |
| Emphasis | 360 ms | Hero, result or important completion |
| Celebration | 600 ms | One-shot reward accent before a longer theatre sequence |

### Easing tokens

| Token | Curve intent | Use |
|---|---|---|
| Enter | Decelerating | Content arriving into rest |
| Exit | Accelerating | Content leaving |
| Move | Smooth standard | Reordering, swaps and layout movement |
| Press | Quick compression/release | Physical button response |
| Celebration | Controlled overshoot | Rare reward emphasis only |

Production easing values are defined once with the motion implementation and visually verified; screens do not invent cubic-bezier values.

### Transition contracts

| Transition | Full motion | Reduced motion | Off |
|---|---|---|---|
| Route | 220 ms fade/short depth shift | 120 ms fade | Instant |
| Dialog/sheet | 220 ms fade and short rise | 120 ms fade | Instant |
| Tab | 160 ms indicator/content crossfade | 100 ms crossfade | Instant |
| Card flip | 360 ms 3D flip | 120 ms face crossfade | Instant |
| Match-3 swap | 160–220 ms positional move | 100 ms highlight then result | Instant state |
| Cascade | 220 ms fall per resolved step, capped | Static end state with count cue | Instant state |
| Progress gain | 360 ms confirmed-value fill | 120 ms fill | Instant |
| Balance gain | One count/glow after confirmation | Static value plus status | Instant |
| Carousel | 360 ms swipe settle | Manual 120 ms crossfade | Manual instant |
| Reward reveal | Theatre-controlled, skippable | simplified reveal | outcome/receipt |

Rules:

- Navigation never waits for decorative animation.
- Routine UI motion uses transform and opacity where practical.
- Reduced motion replaces flips, shakes, parallax and large movement with fades or instant state changes.
- Reduced motion freezes the home-screen Match-3 preview, stops automatic carousel rotation, removes shimmer/pulse loops and replaces cascades or swaps with a static highlighted end state.
- A separate **Animations Off** preference removes all non-essential idle motion. Full, Reduced and Off are system-wide settings, not per-screen inventions.
- Automatically moving content that lasts longer than five seconds has a pause/stop mechanism. Focusing, touching or manually swiping a carousel pauses its automatic rotation.
- No effect flashes more than three times in one second. Bright reward effects use slower luminance changes and small affected areas.
- Reward Theatre may run longer, but only after the outcome is committed and with a skip/accelerate path after the initial reveal.
- Animation may celebrate state; it may not conceal odds, change a reward or delay a transaction retry.

### Home live-preview loop

- One quiet loop advertises authentic Match-3 behaviour: pause, small valid swap, match, short cascade, power-up pulse, foil shimmer, rest.
- Rest time is longer than motion time so the Home screen does not feel continuously busy.
- The loop is deterministic for a session, non-interactive and silent.
- The loop pauses when offscreen, the app loses focus, a dialog opens or the player enables Reduced/Off motion.
- It never displays a result impossible under the real Match-3 rules.

## Particle effects

Particles are system effects layered over reusable components, not screen artwork.

### Particle families

| Family | Shape | Use |
|---|---|---|
| Sparkle | Four-point star / tiny glint | Play edge, claimable reward and foil |
| Confetti | Small rectangles/diamonds | Major committed win or collection milestone |
| Trail | Short fading streak | Match-3 swap/cascade and carousel flourish |
| Burst | Radial dots/shards | Power-up and reward reveal |
| Dust | Low-opacity slow dots | Seasonal banner ambience |
| Coin/Star | Currency silhouette | Confirmed currency gain only |

### Density tokens

- **None:** Reduced/Off mode or quiet utility screens.
- **Low:** up to 8 visible particles in one local component.
- **Medium:** up to 24 visible particles in a hero/reward region.
- **Celebration:** a short one-shot burst capped by performance and flash testing.

Rules:

- Only one persistent particle emitter is visible in the normal Home viewport.
- Idle particles use Low density, low opacity and long rests.
- Particles never cover labels, prices, objectives, focus indicators or board targets.
- Particle layers ignore pointer input and are hidden from the accessibility tree.
- Effects stop when offscreen or the app is backgrounded.
- Reduced motion replaces trails/bursts with a static highlight; Off mode removes particles.
- Currency silhouettes appear only after an authoritative confirmed gain, never while a transaction is pending.
- Seasonal skins may change particle shapes/colours within contrast, performance and flashing limits.

## Haptic feedback guidelines

Haptics complement visible and audible feedback; they never carry unique information. Use platform-provided semantic effects first, honour the device/system preference and provide a separate in-game Haptics toggle.

### Haptic vocabulary

| Cue | Intended meaning | Typical events |
|---|---|---|
| Selection | Very light, crisp tick | Tab change, carousel snap, tile selection |
| Light impact | Discrete successful contact | Ordinary button press, valid drop |
| Medium impact | Significant player action | Signature Play, power-up activation |
| Success | Short positive pattern | Level win, claim complete, purchase confirmed |
| Warning | Distinct restrained warning | Destructive confirmation or expiring action |
| Error | Short negative pattern | Invalid swap, rejected action, failed confirmation |
| Celebration | Custom short sequence with fallback | Rare reward or major collection milestone |

Rules:

- Signature Play receives one medium cue on confirmed press, not a continuous vibration.
- Frequent Match-3 events are capped: selection may tick; ordinary matches do not vibrate per tile; a cascade gives at most one escalating cue per resolved step with a short total limit.
- Automatic Home preview, carousel rotation, idle shimmer and passive balance updates never trigger haptics.
- Reward Theatre haptics synchronise with committed reveal beats and stop immediately on skip.
- Purchase/claim success haptic occurs only after authoritative confirmation.
- Platform semantic patterns retain their documented meaning; success and error patterns are never swapped for style.
- Rich/custom effects require a clear fallback to a predefined effect. Unsupported devices remain fully usable.
- Avoid long, buzzy or repeated vibration. Haptics are optional and never used as background ambience.
- Haptic intensity follows significance, not price or monetisation pressure.

## Audio interaction guidelines

### Audio buses and settings

| Bus | Contents | Player control |
|---|---|---|
| Music | Home, gameplay, event and Reward Theatre music | Independent volume and mute |
| UI | Buttons, navigation, tabs, dialogs and confirmations | Independent volume and mute |
| Gameplay | Tiles, cascades, blockers, power-ups and game results | Independent volume and mute |
| Rewards | Claims, packs, currency and Reward Theatre accents | Independent volume and mute |
| Voice | Optional character/announcer lines | Independent volume and mute |

Master mute affects every bus. Haptics remain a separate control.

### Sound vocabulary

| Event | Sound intent |
|---|---|
| Hover/focus | None by default |
| Standard press | Short soft click |
| Signature Play | Distinct rising two-part launch cue |
| Carousel swipe | Quiet paper/glass slide; no sound on automatic rotation |
| Valid Match-3 swap | Soft tile movement |
| Invalid swap | Brief low rejection cue, never harsh |
| Match | Short pitched pop; simultaneous tiles combine rather than stack loudly |
| Cascade | Pitch/richness rises by step within a capped range |
| Power-up | Unique readable family cue plus visual label |
| Reward committed | Positive confirmation before theatre flourish |
| Purchase confirmed | Calm receipt cue, not a casino-like celebration |
| Error | Short neutral alert that does not shame the player |

Rules:

- The Home screen does not autoplay SFX from its live preview or promotional carousel.
- Audio starts only under platform/browser policy and player settings; first-visit UI remains understandable in silence.
- Music and long audio respond to audio focus, calls, headphones and app backgrounding. Playback does not continue after focus loss unless the platform/session explicitly allows it.
- Returning from interruption resumes only when context and player preference make it appropriate; effects never replay.
- UI, gameplay, reward and haptic cues are authored together so timing and intensity agree.
- Repeated Match-3 sounds use limited variations to avoid fatigue without changing their meaning.
- Multiple simultaneous effects are mixed/capped so cascades and particles do not cause clipping or a sudden loudness spike.
- Voice never delivers essential instructions without equivalent visible text.
- Sound does not encode rarity, success, timing or danger without a visible and announced equivalent.
- Reward/purchase sounds occur after authoritative confirmation and do not imply success during pending work.
- Voice lines from Demonica, Angelica or optional flavour characters never interrupt gameplay-critical audio and obey the Voice control.

### Audio asset rules

- Short UI/gameplay effects are trimmed, normalised consistently and free of leading silence.
- Loops have seamless boundaries and a defined exit/fade.
- Each event has one semantic sound family shared across screens.
- Seasonal audio may reskin a family while retaining timing, loudness class and meaning.
- Every sound has an asset ID, bus, trigger condition, cooldown and fallback/no-audio behaviour documented with it.

### Platform guidance

- Prefer system-defined haptic meanings and make haptics optional, consistent with [Apple's haptics guidance](https://developer.apple.com/design/human-interface-guidelines/playing-haptics).
- Use clear, action-oriented haptics and avoid frequent/buzzy vibration, consistent with [Android's haptics principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles).
- Respect interruption and playback context described by [Apple's audio guidance](https://developer.apple.com/design/human-interface-guidelines/playing-audio) and [Android audio focus](https://developer.android.com/media/optimize/audio-focus).

## Accessibility review and acceptance gates

This review applies to the entire design system. Individual screens may add stricter requirements but may not weaken these gates. The target is WCAG 2.2 AA plus the stronger platform touch-target conventions. A design review is not a claim of conformance: implementation must still be tested with assistive technology and real devices.

### Touch and pointer targets

- Shared controls use a minimum 48 × 48 logical-unit hit area. This exceeds WCAG 2.2 AA's 24 × 24 CSS-pixel minimum, covers WCAG's 44 × 44 enhanced target and aligns with Android's 48 dp recommendation.
- Adjacent controls retain at least 8 logical units of separation unless their complete 48-unit hit areas are non-overlapping.
- Small visible icons sit inside the full hit area; the plus buttons, carousel controls, close buttons, pagination dots and bottom navigation are never tiny standalone targets.
- The complete visible row may be the target for a collection, reward or season action, not only its arrow icon.
- The giant Play control remains the largest target and is never reduced to solve a layout problem.
- Drag and swipe actions always have a tap/button equivalent. Match-3 retains tap-to-select as an alternative to swipe.
- Pointer cancellation, disabled, pressed, pending and focus states are visually and programmatically distinct.

### Safe areas and fixed regions

- The app shell consumes runtime top, right, bottom and left safe-area insets. No device model or hardcoded top offset defines the header position.
- The fixed header contains one normal-flow header row after the top inset. Its logo, player panel, XP, Stars, Coins and store action remain inside the guaranteed visible rectangle.
- Scrollable content begins after the measured header rather than using a copied header-height constant.
- Bottom navigation includes the runtime bottom inset and never competes with gesture/home-indicator regions.
- Side gutters combine design spacing with safe-area values so rounded corners and landscape camera cut-outs cannot clip controls.
- Required physical checks include iPhone 17 Pro Max, iPhone 16 Pro, iPhone 15, Pixel 9 and Samsung Galaxy S25 in portrait. Tablet checks cover portrait and landscape.

### Responsive orientation and tablets

- Phones are locked to portrait at the native iOS and Android shells. The web requests a portrait lock where the Screen Orientation API permits it and otherwise presents a clear portrait guard in phone landscape. This is progressive enhancement because Safari does not generally permit a page-level orientation lock.
- Tablets, classified from a 600 dp/CSS-pixel smallest-width boundary, support portrait and landscape. Each tablet layout must remain genuinely usable in both orientations before release.
- At 320 CSS-pixel width, content reflows without two-dimensional page scrolling or loss of actions. A game board may retain its essential two-dimensional structure, but surrounding UI must reflow.
- Phone-landscape presentation layouts are not maintained. Rotation produces the portrait orientation guard rather than a compressed alternative interface.
- Tablets use an intentional two-column or wider composition; they never show a stretched phone layout or a narrow simulated handset floating in empty space.
- Reading and focus order remains logical when visual regions move between one and two columns.
- Split-screen, browser chrome and the on-screen keyboard may reduce available height without trapping or covering the focused control.

### Colour, contrast and colour-vision differences

- Normal text meets at least 4.5:1 contrast; large text meets at least 3:1. Required control boundaries, focus indicators and state graphics meet at least 3:1 against adjacent colours.
- Colour is never the only carrier of meaning. Selected, locked, owned, ready, sale, rarity, success and error states also use text, shape, icon or pattern.
- Stars and Coins retain distinct labels and silhouettes as well as different colours.
- Match-3 tile types differ by silhouette/symbol or pattern, not only hue. A colour-vision-safe mode may strengthen patterns without changing the board rules.
- Foil, rarity and progression use explicit labels/icons; shimmer or glow is decorative.
- Every semantic palette and seasonal skin is checked under protanopia, deuteranopia, tritanopia and monochrome simulation before release.
- Disabled controls remain readable and are not represented only by low opacity.

### Reduced motion, animation and flashing

- The system follows platform reduced-motion preferences on first launch and exposes Full, Reduced and Off choices in Settings.
- Reduced mode removes spatial travel, parallax, bounce, shake, zoom, repeated pulse and continuous shimmer. Short opacity fades or instant changes preserve state clarity.
- Off mode freezes all non-essential idle animation, including the home board preview and promotional carousel.
- The home preview's live swap, cascade, power-up pulse and foil shimmer have static equivalents that show the same current level and objective.
- Carousel auto-rotation stops in Reduced and Off modes, pauses after manual interaction and always supports buttons/dots as alternatives to swipe.
- Reward Theatre provides skip/accelerate after the initial committed-outcome cue; reduced motion cannot change or suppress the reward receipt.
- No interface or reward effect exceeds three flashes per second. Animation QA includes a recorded-screen flash review.
- Sound and haptics enhance but never replace visible and announced state changes.

### Large text and reflow

- Text supports 200% scaling without clipping, overlap, missing actions or horizontal page scrolling.
- Text containers use intrinsic height. Buttons, counters, tabs, banners and navigation may grow, wrap or reflow; they do not crop labels to preserve a fixed component height.
- The fixed header may become a taller two-row layout when text grows. Its scroll offset is measured from the resulting height.
- Currency values may abbreviate visually only when the complete value remains available to assistive technology and on focus/tap.
- Promotional copy has a defined maximum length and may wrap; text is not baked into banner artwork.
- Bottom navigation retains both icon and label at supported text sizes. If space is insufficient, the component reflows rather than hiding the label.
- Gameplay objectives, moves and timers remain readable at large text without covering the board.
- Tests include system font enlargement, browser 200% text-only zoom and 400% page zoom/reflow where applicable.

### Keyboard, switch and assistive technology

- Every action works with keyboard, switch control and assistive-technology activation; no pointer-only path is required.
- Focus is visible, ordered by task rather than visual coordinates and restored sensibly after dialogs, sheets and route changes.
- Dialogs trap focus while open, have an accessible name, provide a safe dismissal path and return focus to their opener.
- VoiceOver and TalkBack receive concise names, roles, values and state changes. Decorative particles, glows and tile motion are hidden from the accessibility tree.
- The live Match-3 preview is one labelled, non-interactive summary unless it contains explicit controls. It must not expose every decorative tile as a focus stop.
- Dynamic balances, purchase states and claimed rewards use restrained live-region announcements that do not repeat during animation.

### Timing, cognition, sound and interruption

- The home screen shows actions rather than countdown-only dead ends. Time-limited offers include a readable end time and do not rely on urgency animation.
- Players can pause non-essential auto-updating content. Important text remains available long enough to read and does not disappear only because an animation ended.
- Instructions use plain language and consistent action verbs. Destructive, paid and irreversible actions require explicit confirmation.
- Music, effects, voice and haptics are independently controllable.
- No essential instruction is sound-only, haptic-only or animation-only.

### Required accessibility test matrix

Before a shared component or screen is accepted:

1. Verify every target's computed hit area and spacing.
2. Test keyboard-only, VoiceOver, TalkBack and switch/alternative input.
3. Test 320 CSS-pixel width, short landscape, 360–430 CSS-pixel phones and tablet portrait/landscape.
4. Test the named safe-area devices in both orientations.
5. Test 200% text scaling and 400% browser reflow where applicable.
6. Test Full, Reduced and Off animation settings plus the operating-system preference.
7. Test all semantic colours and seasonal skins with contrast measurement and four colour-vision simulations.
8. Record animated screens and check pause/stop behaviour and flash frequency.
9. Confirm touch, swipe, tap-to-select and keyboard alternatives produce the same game action.
10. Record failures as design-system defects when they affect a shared primitive, rather than patching individual screens.

### Standards references

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [WCAG 2.2 use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
- [WCAG 2.2 pause, stop and hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [Apple accessibility design guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views)
- [CSS safe-area environment variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)

## Complete reusable component catalogue

This catalogue is the implementation boundary. A future screen must select from it before proposing a new primitive.

| Family | Approved reusable components |
|---|---|
| Shell | App shell, safe-area provider, adaptive page, scroll region, sticky region, content column, two-column layout, divider |
| Branding/header | Flip-Out logo slot, player identity panel, avatar, level badge, XP bar, Star counter, Coin counter, Store access |
| Navigation | Bottom navigation, screen header, back action, close action, tabs, segmented control, carousel pagination, breadcrumb/step indicator where needed |
| Buttons | Signature Play, Primary, Secondary, Quiet, Danger, Store/Purchase, Reward Claim, Icon button |
| Surfaces | Standard panel, inset panel, elevated panel, gameplay hero, reward frame, progress group, list group |
| Cards | Memory card, Match-3 tile, collection card, product card, promotional card, Exchange listing, booster/pack, power-up, avatar/identity card |
| Lists | Action row, progress row, item row, transaction row, ranking row, settings row, empty row |
| Status | Badge, chip, status dot, lock state, ownership marker, rarity marker, foil marker, new/sale/limited marker |
| Progress | Linear bar, segmented bar, objective counter, XP bar, timer, circular summary, indeterminate busy state |
| Economy | Currency counter, price, sale price, fee breakdown, balance change, transaction status, receipt, insufficient-balance prompt, conversion summary |
| Forms | Text field, search field, checkbox, radio, switch, select, slider, stepper, segmented choice, helper/error text |
| Overlays | Dialog, confirmation, transaction dialog, reward receipt, bottom sheet, side sheet, popover, banner, toast, interstitial status |
| Feedback | Loading skeleton, busy state, success, warning, error, offline, empty, locked and unavailable states |
| Gameplay | Mode brief, gameplay HUD, objective row, moves/timer counter, power-up tray, pause sheet, pass-device overlay, result screen |
| Reward Theatre | Committed reward envelope, presentation viewport, skin layer, skip/accelerate control, multi-reward receipt |
| Collection | Set/album header, completion summary, filter/sort bar, item grid/list, item detail, variant selector, milestone row |
| Exchange | Listing card, filters, price/fee summary, ownership proof state, listing confirmation, purchase settlement receipt, transaction history |
| Shop | Catalogue section, product card, offer carousel, odds link, Store purchase sheet, restoration status, sale state |
| Development-only | Component gallery, accessibility controls, responsive viewport harness, contrast/motion/particle toggles, mock transaction states |

## Component composition rules

- Screens consume component data and callbacks; they do not reach directly into economy/save internals to invent display state.
- Economy components receive authoritative pending/confirmed/error models and never mutate balances locally.
- Reward Theatre receives a committed reward envelope; its presentation and skin layers cannot reroll or modify it.
- Collection, Exchange and Shop reuse item identity, rarity, foil, ownership, price and receipt primitives.
- Gameplay modes reuse HUD, objective, power-up, pause and result patterns while retaining mode-specific board components.
- Every component defines its empty, loading, error, disabled, large-text, Reduced-motion and Offline behaviour before release.
- Reusable visual primitives own their CSS/animation. Screen styles may control composition only.

## Design-system completion gate

The design system is considered implemented—not merely documented—only when:

1. All tokens are available from one theme source.
2. Every catalogue component required by the first target screen exists in the component gallery.
3. Every required state is demonstrated with representative content and long/localised text.
4. Responsive checks pass at the documented phone, landscape and tablet sizes.
5. Accessibility checks pass for targets, contrast, keyboard, VoiceOver, TalkBack, large text and motion modes.
6. Motion, particles, sound and haptics use shared tokens/event names rather than screen-local values.
7. Visual regression tests cover the canonical states.
8. Unit/interaction tests cover semantics, keyboard operation, pending/duplicate actions and reduced-motion behaviour.
9. No screen imports obsolete prototype primitives for newly redesigned UI.

This document completes the design specification. As of 19 July 2026, the reusable Home foundation is coded and verified; the wider catalogue remains an implementation backlog for the ordered screen packages below.

## Approved implementation sequence

No additional production screen should be redesigned independently. Work proceeds in this order:

1. **Design-system foundation:** tokens, app shell, component gallery and the primitives required by Home/Match-3.
2. **Match-3 gameplay:** board, HUD, objectives, power-ups, pause and result built entirely from the system.
3. **Reward Theatre:** committed reward envelope, presentation viewport, skins, accessibility controls and receipt.
4. **Collection:** cards, variants, albums, progress, filters and item detail.
5. **Exchange:** listings, ownership, Coin price, 10% fee, confirmation and audited history.
6. **Shop:** catalogue, Coin Store, offers, odds, purchase status and restoration.

Each package must pass the completion gate for every new shared primitive before the next package begins.

## Consolidation application — 19 July 2026

Every reachable application route now applies this system. Route shells must opt into `data-concept-screen`, durable navigation remains Home / Collection / Rewards / More, and newly introduced routes must pass `tests-ui/route-consolidation.test.js`. Gameplay-specific art is allowed only inside the mechanic itself; headers, controls, dialogs, cards, spacing and typography must continue to use shared primitives and tokens.
