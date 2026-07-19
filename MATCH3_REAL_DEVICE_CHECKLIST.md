# Match-3 real-device development checklist

No personal information should be entered. After each run, use **Development feedback → Export JSON** and attach the local file to the test record.

## Device matrix

- [ ] iPhone portrait: current iOS/Safari, touch and swipe.
- [ ] iPhone landscape: current iOS/Safari, board and modal fit.
- [ ] iPad portrait and landscape: Safari, touch targets and unused space.
- [ ] Android phone portrait and landscape: Chrome, touch and swipe.
- [ ] Android tablet portrait and landscape: Chrome, touch targets and scaling.
- [ ] Browser viewport exactly 320 CSS pixels wide.

Record model/OS/browser version only if useful; do not record a tester name, email, advertising ID, IP address or account identifier.

## Controls

- [ ] Tap one token then an adjacent token; valid move resolves once.
- [ ] Tap an invalid/non-adjacent target; no move is spent.
- [ ] Swipe in all four directions near board edges.
- [ ] Mouse selection works without accidental drag.
- [ ] Keyboard arrows move focus; Enter/Space selects; focus remains visible.
- [ ] Hammer target selection is clear and invalid targets do not consume it.
- [ ] Pause, resume, restart confirmation, quit confirmation and loss continue work.
- [ ] Refresh during a level resumes the authoritative board.

## Accessibility

- [ ] VoiceOver announces the board summary, cells, selection, blockers and specials.
- [ ] TalkBack announces the same information and supports activation.
- [ ] Tokens remain distinguishable with colour filters/grayscale.
- [ ] Text at 200% scaling does not hide objectives or controls.
- [ ] Reduced-motion OS setting removes non-essential motion.
- [ ] Portrait core levels remain timer-free.
- [ ] Modal focus order, escape/back behaviour and status announcements are understandable.

## Visual and performance observations

- [ ] Board never overflows or falls below a practical touch size.
- [ ] Score, moves and every objective remain visible and readable.
- [ ] Crate layers, ice, chains, holes, drops and specials are distinguishable.
- [ ] Move response feels immediate on Wi-Fi and mobile data; note visible network pauses.
- [ ] Play at least 20 consecutive levels/retries and note heat, battery, stutter or memory symptoms.
- [ ] Rate perceived difficulty 1–5 and record control/clarity problems in the development export.
