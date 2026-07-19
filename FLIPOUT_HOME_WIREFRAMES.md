# Flip-Out Home Screen Wireframes

## Status

Five layout directions for discussion only. They contain boxes and labels, no artwork, styling or implementation. Each treats collection, progression, rewards and economy as the product centre.

The diagrams are schematic and do not define a fixed viewport. The permanent layout uses the 360–430 CSS-pixel modern mobile range as its design baseline, supports 320 CSS-pixel narrow phones, respects safe-area/system insets and deliberately reflows for larger phones, landscape and tablets. It must never recreate the prototype's fixed 390 × 844 frame.

## 1. Progress Dashboard

The home screen answers “what should I do now?” and uses a conventional persistent bottom navigation.

```text
┌──────────────────────────────────┐
│ PROFILE       STARS       COINS  │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ CONTINUE                   │  │
│  │ Current mode / level       │  │
│  │ Progress             PLAY  │  │
│  └────────────────────────────┘  │
│                                  │
│  DAILY GOALS                     │
│  ┌────────────────────────────┐  │
│  │ Goal 1          Progress   │  │
│  │ Goal 2          Progress   │  │
│  └────────────────────────────┘  │
│                                  │
│  PLAY                            │
│  ┌─────────────┐ ┌────────────┐ │
│  │ MEMORY      │ │ MATCH-3    │ │
│  └─────────────┘ └────────────┘ │
│  ┌─────────────┐ ┌────────────┐ │
│  │ SEASON      │ │ MORE MODES │ │
│  └─────────────┘ └────────────┘ │
│                                  │
├──────────────────────────────────┤
│ HOME  PLAY  COLLECTION  EXCHANGE│
│                  SHOP            │
└──────────────────────────────────┘
```

Navigation solution: five persistent destinations with Home acting as a personalised summary.

Strengths:

- Familiar and immediately understandable.
- Makes the next action, goals and main modes visible together.
- Collection and Exchange remain first-class destinations.

Trade-offs:

- Bottom navigation becomes crowded at five destinations.
- The dashboard can become noisy if every system demands a panel.

Landscape/tablet: two columns, with Continue and goals on the left and modes on the right; navigation remains on the bottom or becomes a side rail.

## 2. Destination Tabs

The top of the screen is the navigation. Home is replaced by five peer destinations; the default Play tab serves as the launch surface.

```text
┌──────────────────────────────────┐
│ PROFILE       STARS       COINS  │
├──────────────────────────────────┤
│ PLAY | JOURNEY | COLLECTION      │
│ SOCIAL | SHOP                    │
├──────────────────────────────────┤
│                                  │
│  FEATURED                        │
│  ┌────────────────────────────┐  │
│  │ Current event or mode      │  │
│  │                      OPEN  │  │
│  └────────────────────────────┘  │
│                                  │
│  GAME MODES                      │
│  ┌────────────────────────────┐  │
│  │ Memory Match          PLAY │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Match-3              PLAY │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Reveal               PLAY │  │
│  └────────────────────────────┘  │
│                                  │
│  RECENT REWARD / DAILY STATUS    │
└──────────────────────────────────┘
```

Navigation solution: top-level tabs replace both a home dashboard and bottom navigation.

Strengths:

- Very clear information architecture.
- Each system gets a full destination without a home page duplicating it.
- Works well for a collection-heavy product with frequent browsing.

Trade-offs:

- Six concepts must fit into five labels; Exchange would need to live under Social or Shop unless the tabs change.
- Less one-thumb friendly on tall phones.

Landscape/tablet: tabs remain across the top and content may use two or three columns.

## 3. Journey Feed

The home is a chronological feed of progression, claims, events and collection activity. A single menu opens all permanent destinations.

```text
┌──────────────────────────────────┐
│ PROFILE       STARS       COINS  │
├──────────────────────────────────┤
│ TODAY                            │
│                                  │
│  ┌────────────────────────────┐  │
│  │ NEXT STEP                  │  │
│  │ Level / mode / objective   │  │
│  │                      PLAY  │  │
│  └────────────────────────────┘  │
│          │                       │
│  ┌────────────────────────────┐  │
│  │ DAILY REWARD         CLAIM │  │
│  └────────────────────────────┘  │
│          │                       │
│  ┌────────────────────────────┐  │
│  │ COLLECTION UPDATE          │  │
│  │ Set progress          VIEW │  │
│  └────────────────────────────┘  │
│          │                       │
│  ┌────────────────────────────┐  │
│  │ SEASON / EVENT             │  │
│  │ Progress              OPEN │  │
│  └────────────────────────────┘  │
│                                  │
├──────────────────────────────────┤
│       [ ALL SECTIONS ]           │
└──────────────────────────────────┘
```

The All Sections action opens:

```text
┌──────────────────────────────────┐
│ PLAY         COLLECTION          │
│ JOURNEY      EXCHANGE            │
│ SHOP         SOCIAL              │
│ SETTINGS     HELP                │
└──────────────────────────────────┘
```

Navigation solution: a task feed for daily use plus one explicit directory for everything else.

Strengths:

- Makes progression and returning-player value very clear.
- Supports events and daily systems without adding permanent navigation tabs.
- Can show collection milestones as part of play rather than a separate advertisement.

Trade-offs:

- Players who want a specific destination need an extra tap.
- Feed ordering requires strict product rules to prevent promotional clutter.

Landscape/tablet: the feed stays a readable central column; the section directory can become a persistent side rail.

## 4. Hub and Spoke

The screen is a spatial launcher. Play occupies the centre; the four major collecting/economy destinations surround it. A contextual tray changes with the selected spoke.

```text
┌──────────────────────────────────┐
│ PROFILE       STARS       COINS  │
├──────────────────────────────────┤
│                                  │
│  ┌────────────┐  ┌────────────┐ │
│  │ COLLECTION │  │  JOURNEY   │ │
│  └────────────┘  └────────────┘ │
│                                  │
│         ┌──────────────┐         │
│         │              │         │
│         │     PLAY     │         │
│         │              │         │
│         └──────────────┘         │
│                                  │
│  ┌────────────┐  ┌────────────┐ │
│  │ EXCHANGE   │  │    SHOP    │ │
│  └────────────┘  └────────────┘ │
│                                  │
├──────────────────────────────────┤
│ CONTEXT TRAY                     │
│ Resume / status / one action     │
├──────────────────────────────────┤
│ PROFILE  SOCIAL  SETTINGS        │
└──────────────────────────────────┘
```

Navigation solution: a fixed spatial relationship between the five core destinations, with secondary utilities kept separate.

Strengths:

- Strong, memorable structure without depending on characters or scenery.
- Makes Play, Collection, Journey, Exchange and Shop visibly equal parts of the loop.
- The contextual tray can preview progress without filling the hub.

Trade-offs:

- Less room for daily goals or event information.
- Spatial navigation must remain accessible in linear reading order and at large text sizes.

Landscape/tablet: retains the hub geometry especially well; on 320 px or large text it collapses into a labelled 2 × 2 grid with Play first.

## 5. Searchable Launcher

The home behaves like a compact game library. Search, recent actions and labelled groups replace promotional tiles.

```text
┌──────────────────────────────────┐
│ PROFILE       STARS       COINS  │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ SEARCH MODES, ITEMS, SETS    │ │
│ └──────────────────────────────┘ │
│                                  │
│ RECENT                           │
│ ┌──────────────────────────────┐ │
│ │ Resume current level    PLAY │ │
│ └──────────────────────────────┘ │
│                                  │
│ PLAY                             │
│ ┌──────────────────────────────┐ │
│ │ Memory Match              >  │ │
│ ├──────────────────────────────┤ │
│ │ Match-3                  >  │ │
│ ├──────────────────────────────┤ │
│ │ All modes                >  │ │
│ └──────────────────────────────┘ │
│                                  │
│ YOUR COLLECTION                  │
│ ┌──────────────────────────────┐ │
│ │ Cards / Decks / Albums     > │ │
│ └──────────────────────────────┘ │
│                                  │
├──────────────────────────────────┤
│ PLAY  COLLECT  JOURNEY  MORE     │
└──────────────────────────────────┘
```

The More destination contains Exchange, Shop, Social, Settings and Help. Search can find a named mode, set, item category or destination; it does not search other players by default.

Navigation solution: searchable, grouped lists plus a four-item one-thumb quick dock.

Strengths:

- Scales cleanly as modes, collections and systems grow.
- Text-led navigation is accessible and resilient to missing artwork.
- Recent actions reduce the cost of a deeper hierarchy.

Trade-offs:

- Least theatrical option.
- Search requires careful indexing and cannot replace a well-organised browse structure.

Landscape/tablet: groups become two columns while search and recent actions remain full width.

## Approval checkpoint

No option is recommended or selected by this document. The next UI action should be to choose one layout, combine explicitly approved elements from named layouts, or request a sixth direction. No React, CSS, routing or asset work should begin before that decision.
