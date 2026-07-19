# Flip-Out mobile UX polish report

Date: 19 July 2026

Environment: development / Vercel Preview only

Application version: `1.2.1-mobile-ux`

## Outcome

The development build now has an explicit phone/tablet orientation policy, runtime safe-area handling, a native momentum-scrolling promotional carousel, retry-safe Daily Reward interaction and a shared coarse-pointer touch-target floor. No economy balance, gameplay rules, production domain or production deployment was changed.

## Orientation and safe areas

- iPhone advertises portrait only through `UISupportedInterfaceOrientations`; iPad continues to advertise portrait and both landscape orientations through the device-specific iPad key.
- Android classifies a tablet at `smallestScreenWidthDp >= 600`. Phones request sensor portrait; tablets use the full user orientation preference. The application is marked as a game so Android large-screen orientation compatibility rules do not unintentionally override the intended game policy.
- The web manifest no longer locks tablets to portrait. A runtime policy requests portrait on phone-sized web viewports and unlocks tablet-sized viewports where the Screen Orientation API is available.
- Safari and other browsers that decline programmatic locking receive a full-screen portrait guard when a coarse-pointer phone is physically in landscape. The guard is an accessible dialog and does not maintain a second compressed phone-landscape UI.
- Shared `env(safe-area-inset-top/right/bottom/left)` variables cover Dynamic Island/notches, punch holes, rounded corners, system bars and home-indicator space. Header, content, bottom navigation and the orientation guard consume those runtime values.
- Removed the compact phone-landscape rules from Home, shared components and Match-3. Tablet responsive layouts remain.

## Promotional carousel

- Replaced synthetic pointer-distance slide switching with native horizontal overflow, CSS scroll snapping and `-webkit-overflow-scrolling: touch`.
- Finger swipe and native momentum update the current slide from the settled scroll position.
- Autoplay remains enabled only in Full motion mode and while the document is visible; hover, focus and active touch/scroll interaction pause it.
- Previous/next controls, pause/resume and labelled indicators remain available without requiring a swipe.
- All controls sit in a dedicated row below the slide. Arrows no longer overlay promotion artwork, text or calls to action.
- Carousel arrows, pause and indicators provide at least a 44 x 44 CSS-pixel hit area.

## Daily Reward

- The Home card calls the authenticated `daily-login` Preview API; the server transaction remains the authority for eligibility and the Star grant.
- The card remains a real disabled button while collection is pending, exposes `aria-busy`, and cannot be submitted twice during the same React render tick.
- A successful response immediately applies the confirmed server amount, removes the claimable card and presents the authoritative receipt, then refreshes player state from the server.
- Timezone detection now falls back to `UTC` when Safari/Intl does not return an IANA timezone.
- The first deployed API check exposed a pre-existing global-ID collision: `daily-login:<date>` let one development account block every other account on that date. Daily claim/transaction IDs now include the authenticated player ID, so retries for one account remain stable while different accounts cannot collide.
- No placeholder reward animation or client-invented reward is used.

## Touch and button review

- Coarse-pointer environments enforce a minimum 44 x 44 CSS-pixel hit area for buttons, links and role buttons, excluding Match-3 grid cells whose board interaction has its own accessible input contract.
- `touch-action: manipulation` is shared across actionable controls.
- The Play button, progress rows, bottom navigation, modal actions, secondary game links, carousel actions and store access retain semantic button behaviour, disabled states and keyboard activation.
- Carousel dots were enlarged from a 26-38 px visual hit area to a fixed 44 px target.

## Files changed

- Native policy: `ios/App/App/Info.plist`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/uk/gizmogames/flipout/MainActivity.java`.
- Web policy/shell: `public/manifest.json`, `src/mobile/orientationPolicy.js`, `src/components/OrientationGuard.jsx`, `src/main.jsx`, `src/index.css`.
- Carousel and touch primitives: `src/ui/components.jsx`, `src/ui/components.module.css`.
- Home/Daily Reward: `src/screens/Home.jsx`, `src/screens/Home.module.css`, `src/ui/homeData.js`, `src/utils/gameApi.js`, `src/utils/timeZone.js`.
- Match-3 responsive cleanup: `src/screens/Match3.module.css`.
- Tests: `tests/mobile-ux.test.js`, `tests-ui/components.test.jsx`, `tests-ui/home.test.jsx`, `tests-ui/responsive-contract.test.js`.
- Documentation/version: `FLIPOUT_DESIGN_SYSTEM.md`, `FLIPOUT_CURRENT_STATE.md`, `FLIPOUT_COMPLETION_REPORT.md`, `FLIPOUT_UI_IMPLEMENTATION_REPORT.md`, `FLIPOUT_DEPLOYMENT.md`, `src/version.js`, this report.

## Verification results

- Final full automated suite: Node 108 total, 100 passed, 0 failed, 8 Preview-database tests skipped because their restricted database secrets are not exposed to the local shell; UI 20 passed, 0 failed across 5 files. The new per-account Daily claim-ID regression test passed.
- Focused lint: passed with no findings.
- Production build: passed; 137 modules. Main JS 424.82 kB / 133.32 kB gzip; main CSS 96.01 kB / 20.34 kB gzip; Match-3 JS 16.23 kB / 5.75 kB gzip.
- Preview build: passed with the same output.
- Capacitor Android sync: passed.
- Capacitor iOS sync: passed.
- Native Android compile: blocked before compilation because this Windows environment has neither `JAVA_HOME` nor a `java` executable.
- Local Chromium built-app smoke: HTTP 200; carousel controls rendered below the promotion and exposed expected accessible names. The local Vite static preview has no Vercel API runtime, so it was not used as Daily Reward evidence.
- Preview deployment: commits `6aa2916` and `2c76e42` were pushed only to `dev`. Ready deployment `dpl_JAn3NGNQJSLttPuV2x5krL5JwWD2` (`https://flip-dfex0oe42-chattocal.vercel.app`) is target `preview`; the permanent URL maps to it.
- Permanent URL verification: `https://dev.flipout.gizmogames.uk` returned HTTP 200 from Vercel and byte-identical HTML to the generated Preview with ETag `"4e722771f70cac7ee939a5bf1260c5d4"`. `/assets/index-VU0UgckH.js` returned 200, 425,095 bytes and contains `1.2.1-mobile-ux`.
- Authoritative Daily Reward verification: a disposable Preview guest began at 0 Stars. The first claim returned `duplicate: false`, reward `stars: 50` and claim ID `daily-login:7bfe277c-a3bc-401d-87db-88ee355a2aa0:2026-07-19`. The immediate identical retry returned `duplicate: true` with the same ID. Final balance was exactly 50 Stars, delta exactly 50, and `available` was `false`.
- Branch safety: `main` and `origin/main` both remained at `157344e5f6deaaa6540418c514448a976753688c`. No production target or production domain was modified.

One combined shell invocation accidentally overlapped the production and Preview builds against the shared `dist` directory; Preview reported `ENOTEMPTY`. The same commands were immediately rerun separately and both passed with the exact results above. No code change was made to conceal or work around that command-concurrency error.

## Remaining physical-device work

Windows cannot run Apple Safari, Xcode or an iOS simulator, and no Android SDK/JDK is installed in this workspace. The automated browser available here is Chromium-based. Therefore engine-independent contracts, responsive CSS, API behaviour and Chromium interaction are verified here, while the following are explicitly still human/native-device checks:

- iPhone Safari installation and physical rotation lock.
- Dynamic Island/notch, home-indicator and rounded-corner inspection on an iPhone.
- Android Chrome physical rotation and punch-hole/system-bar inspection.
- Tablet portrait/landscape usability on iPad and Android hardware.
- Momentum feel, touch latency, overscroll and every control's physical tap comfort.

These are not concealed as complete and require the existing real-device checklist before release beyond development.
