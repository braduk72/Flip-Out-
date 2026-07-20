# Flip-Out deployment

## Permanent development environment

- URL: `https://dev.flipout.gizmogames.uk`
- Vercel scope/project: `chattocal/flip-out`
- Vercel project ID: `prj_tskEuyq6wLvM93HP9hH0lBoYugzD`
- Assignment: custom domain `dev.flipout.gizmogames.uk`, Git branch `dev`, Vercel Preview environment
- Behaviour: every successful Vercel Git deployment from `dev` updates the custom domain automatically. Do not manually alias individual deployment URLs.
- Git integration: GitHub `braduk72/Flip-Out-`, automatic deployments enabled; the production branch remains `main`.

The production domain, root DNS records and production deployments are outside the development workflow. Never change or promote production unless Brad explicitly requests it.

## Cloudflare DNS

`gizmogames.uk` uses authoritative Cloudflare nameservers. The live development record is:

| Type | Name | Target | Proxy status | TTL |
|---|---|---|---|---|
| CNAME | `dev.flipout` | `39622341da5cfe42.vercel-dns-016.com` | DNS only | Auto |

Keep the record DNS-only (grey cloud). Do not change the root record or nameservers.

Verify DNS and Vercel configuration with:

```powershell
Resolve-DnsName dev.flipout.gizmogames.uk -Type CNAME
npx vercel domains verify dev.flipout.gizmogames.uk --scope chattocal
Invoke-WebRequest https://dev.flipout.gizmogames.uk -UseBasicParsing
```

## Deploying development

Push the `dev` branch and let the connected Vercel project build it:

```powershell
git branch --show-current
git push origin dev
```

The first command must print `dev`. A successful Ready deployment updates `https://dev.flipout.gizmogames.uk` through the Vercel branch-domain assignment. `deploy-dev.ps1` and `deploy-dev.sh` enforce the branch guard and no longer create manual aliases.

## Verifying the deployed build

Confirm the Vercel assignment still contains `"gitBranch": "dev"`:

```powershell
npx vercel api /v9/projects/prj_tskEuyq6wLvM93HP9hH0lBoYugzD/domains --scope chattocal
```

Then inspect the permanent URL and compare its deployment ID with the newest Ready Preview deployment:

```powershell
npx vercel inspect https://dev.flipout.gizmogames.uk --scope chattocal
npx vercel ls flip-out --scope chattocal
```

The application currently reports `1.10.1-exchange-fee` from `src/version.js`. Reports must name `https://dev.flipout.gizmogames.uk` as the development URL. A generated `*.vercel.app` URL may be recorded separately as a deployment ID for diagnostics, but must not be presented as the URL Brad should use.

## Verification record - Exchange commission update, 20 July 2026

- Rule change: Exchange commission is now 20%; sellers receive 80%.
- Local verification before deployment: focused Node **14 passed / 0 failed / 1 Preview DB skip**, focused lint passed, production build passed.
- No schema migration was required.
- Production was not touched.

## Verification record - Preview Developer Toolkit, 20 July 2026

- Hidden route: `https://dev.flipout.gizmogames.uk/?dev=toolkit` after deployment.
- Backend service: `/api/fo-game?service=dev-tools`.
- Required Preview env var: `DEV_TOOLKIT_SECRET`, configured as Sensitive for Preview branch `dev`.
- Production guard: service returns 404 outside `VERCEL_ENV=preview`; normal authenticated player session is still required.
- Local verification before deployment: focused Node **4/4**, focused UI **2/2**, focused lint passed, production build passed.
- Deployment: commit `e093a6a` plus report/env trigger commit `6575843`; Vercel Ready Preview `https://flip-6axzz5ohh-chattocal.vercel.app`.
- URL verification: `https://dev.flipout.gizmogames.uk` and the generated Preview both returned HTTP 200 and ETag `"859865aa8a9dc13357b1cd0adc3896e7"`.
- Bundle verification: permanent URL served `/assets/index-BHpPfOdN.js` at 412,670 bytes and contained `1.10.0-preview-dev-toolkit`.
- API guard verification: `/api/fo-game?service=dev-tools` with the saved local secret and no Bearer player session returned HTTP 401.
- Production was not touched.

## Verification record — Official Theme Album Collection UI, 20 July 2026

- Code commit `7fdb453` was pushed from `dev`; `main` and production were not changed.
- Vercel Ready Preview: `dpl_8zVSfKKKkKVJjiVvhpCb3VtJWd91`, generated URL `https://flip-fh7x3wnkw-chattocal.vercel.app`, target `preview`, created Mon 20 Jul 2026 03:19:14 BST.
- Vercel inspect for both the generated URL and `https://dev.flipout.gizmogames.uk` resolved to the same Ready deployment.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 and served byte-identical HTML to the generated Preview URL.
- Both URLs returned ETag `"0b98da1361681ff70cc9997521afd2ef"`.
- The permanent URL served `/assets/index-Bw3DN3ii.js` at HTTP 200 (412,078 bytes), containing application version `1.9.0-theme-albums-ui`.
- Browser acceptance reached Home after disposable onboarding, opened Collection, displayed the 15-theme Official Album landing, opened Super Cars, displayed the Collector Card pyramid, displayed numbered Normal/Foil paired slots with rarity stars/text, and passed responsive overflow/touch-target measurements at 360x740, 820x1180 and 1280x900.
- Live Stick placement was not executed because the disposable Preview browser account had no eligible inventory card and no approved development card-grant UI exists. Automated UI and server tests cover that path until a QA seed exists.
- Vercel still lists the old `dev.flipout.app` alias on the deployment, but no production domain, production deployment, root DNS record, nameserver or database was changed.

## Verification record — mobile UX polish, 19 July 2026

- Commits `6aa2916` and `2c76e42` were pushed from `dev`; `main` and `origin/main` remained at `157344e5f6deaaa6540418c514448a976753688c`.
- Vercel Ready Preview: `dpl_JAn3NGNQJSLttPuV2x5krL5JwWD2`, generated URL `https://flip-dfex0oe42-chattocal.vercel.app`, target `preview`.
- At application/API verification time, `https://dev.flipout.gizmogames.uk` mapped to that deployment and returned HTTP 200 from Vercel. Subsequent report-only commits do not change the verified bundle/API.
- Permanent and generated URLs returned byte-identical HTML and ETag `"4e722771f70cac7ee939a5bf1260c5d4"`.
- The permanent URL serves `/assets/index-VU0UgckH.js` at HTTP 200 (425,095 bytes), containing `1.2.1-mobile-ux`.
- A disposable development guest claimed the authoritative Daily Reward: 0 to 50 Stars, first response non-duplicate, immediate retry duplicate with the same account-scoped claim ID, final availability false.
- No production deployment, production domain, root DNS record or nameserver was changed.

## Verification record — Match-3 card-art tokens, 19 July 2026

- Git commit `9ad2af5` was pushed from `dev`; `main` and production were not changed.
- Vercel Ready Preview: `dpl_FdZJ9q6EkfNTtR3nJ6pwQKxZHa3X`, generated URL `https://flip-e39n6phzr-chattocal.vercel.app`, target `preview`.
- Vercel domain verification returns `configured_correctly`, attached and verified, with no issues or conflicts.
- The permanent and generated URLs return HTTP 200, identical HTML and ETag `"34270eb23741281a64afe26aa2003532"`.
- The permanent URL serves `/assets/index-DCscBX58.js` (415,549 bytes) containing version `1.1.1-card-tokens`.
- All six card-derived token WebPs and `quality-report.json` return HTTP 200. The removed geometric `token-sun.svg` returns Vercel `NOT_FOUND`, confirming it is not retained as a deployed fallback.

## Verification record — 19 July 2026

- Git commit `c4e34bc` was pushed from `dev`; `main` was not touched.
- DNS resolves with TTL 60 to `39622341da5cfe42.vercel-dns-016.com`.
- HTTPS returns 200 from Vercel. Last-Modified is `Sun, 19 Jul 2026 00:42:19 GMT`; ETag is `"76dfb8a66ab3338e7fd8ab136b6d027f"`.
- The permanent URL loads `/assets/index-BYVmyWFx.js` (412,286 bytes), which contains application version `1.1.0-ui4d`.
- New Concept 4D logo, Coin Store WebP and Match-3 token assets each return HTTP 200 from the permanent URL.
- Unauthenticated player-state API returns the expected 401.
- Vercel reports `configured_correctly`, attached and verified, with no issues or conflicts. The hostname maps to Ready Preview deployment `dpl_Agvh9BKAVH1DCdzYP5pMMbvcjbDb` (`https://flip-6ji7jlyxe-chattocal.vercel.app`), target `preview`, created 19 July 2026 at 01:41:40 BST. No manual alias or production action was attempted.

## Verification record — 18 July 2026

- DNS resolves with TTL 60 to `39622341da5cfe42.vercel-dns-016.com`.
- Vercel reports `configured_correctly`, no issues or conflicts, and CNAME configuration through Cloudflare.
- HTTPS returns HTTP 200 OK from Vercel at `https://dev.flipout.gizmogames.uk/`.
- Vercel maps the hostname to Ready Preview deployment `dpl_693xRL9beiopYKwPdEa8oGyga7B2`, the newest Preview deployment at verification time.
- The permanent hostname and generated Preview hostname return ETag `"dcd93590b11bf3077955f1427fb9f43d"` and load the same `/assets/index-qT1Bc9CI.js` bundle.
- The deployed bundle contains the reported application version `1.0.0`.
- No production domain, production deployment, root DNS record or nameserver was changed.

## Verification record — UI consolidation, 19 July 2026

- Commit `0aea330` was pushed from `dev`; `main` remained at `157344e5f6deaaa6540418c514448a976753688c`.
- Vercel Ready Preview: `dpl_GhFqJfGYz7THYAPYiCankgZxpQKX`, generated URL `https://flip-b8g7olmaq-chattocal.vercel.app`, target `preview`.
- `https://dev.flipout.gizmogames.uk` and the generated URL returned HTTP 200, identical HTML and ETag `"150f8c376c132b013ed793ed2049bc2a"`.
- The permanent URL served `/assets/index-BEnrUUXJ.js` at HTTP 200 (404,621 bytes), containing application version `1.3.0-ui-consolidation`.
- Domain verification returned `configured_correctly`, attached and verified, with the expected CNAME and no issues or conflicts.
- No production branch, production domain, production deployment, root DNS record, nameserver or database was changed.

## Verification record — Collection 2.0, 19 July 2026

- Final UI commit `2107ebf` was pushed from `dev`; `main` remained at `157344e5f6deaaa6540418c514448a976753688c`.
- Vercel Ready Preview: `dpl_GSupG15aohkMJ5b7s9V54AzSsKRc`, generated URL `https://flip-e250izsku-chattocal.vercel.app`, target `preview`.
- The generated and permanent development URLs returned HTTP 200, byte-identical HTML and ETag `"8f87cb8b050d9740c6a34d8b38f8dbca"`.
- The permanent URL served `/assets/index-C1HtgBKc.js` (405,111 bytes) containing `1.4.0-collection2` and `/assets/Inventory-l_c7LhSB.js` (23,563 bytes) at HTTP 200.
- Deployed browser checks passed at 320×568, 390×844 and 1024×768 with no horizontal overflow or undersized visible interactions.
- No production deployment, production domain, DNS, root records, nameservers, database or economy balance was changed.

## Verification record — one-time nickname onboarding, 19 July 2026

- Preview-only migration deployment: `dpl_368z9mE7nK2hdLURCb2jVLBP3dBD`, generated URL `https://flip-kvmytmlnv-chattocal.vercel.app`.
- The Vercel Preview build targeted Railway `railway/public` at `yamanote.proxy.rlwy.net` with `VERCEL_ENV=preview`; migration `012_player_display_name.sql` committed at `2026-07-19T14:54:07.959Z`.
- The nullable `fo_accounts.display_name` column and its 3–12 alphanumeric database constraint were verified after migration.
- Preview verification passed 7/7 server/database tests, including duplicate display-name allowance and one-time retry/no-overwrite behavior, plus 9/9 focused UI tests. The 142-module Vite production build passed.
- `https://dev.flipout.gizmogames.uk` inspected as the same Ready Preview deployment and returned HTTP 200. Its `/assets/index-BzRAlMbJ.js` bundle contains both the nickname screen text and the `set-display-name` API action.
- This was a Preview deployment only. The production domain, root DNS records, nameservers and Production deployment were not changed.

## Booster Store revision — 19 July 2026

The supplied booster artwork is bundled as `public/ui/shop/booster-packs.webp`. Booster purchases remain disabled pending a server-authoritative receipt and approved foil configuration. Preview only.

## Verification record — approved themed booster opening, 19 July 2026

- Commit `8955e75` was pushed to `dev`; no production branch, production deployment, production domain, root DNS record or nameserver was changed.
- Vercel Ready Preview: `dpl_6mi6fKuPFTg6EyTE9w32zWRGLJDZ`, generated diagnostic URL `https://flip-modjhhhfr-chattocal.vercel.app`, target `preview`.
- Vercel inspection confirms `https://dev.flipout.gizmogames.uk` aliases that Ready Preview deployment. The permanent development URL returned HTTP 200 with ETag `"30351a96e2565d210ba42a58681aa805"` and entry `assets/index-ChIs5IAc.js`.
- The permanent URL returned HTTP 200 for `/ui/booster-opening/themed/frames.json` (11 frames), `/ui/booster-opening/themed/booster-open-10.webp` (`image/webp`) and `/?dev=booster-opening`.
- The Preview-only review route was browser-checked and rendered the expected Frame 01 metadata/control surface. Production was not touched.

## Verification record - Theme Album ownership boundary, 20 July 2026

- Commit `beb609e` was pushed from `dev`; no production branch, production deployment, production domain, root DNS record or nameserver was changed.
- Preview migration deployment `https://flip-qarcd90x7-chattocal.vercel.app` applied `014_theme_albums.sql` to Railway Preview `railway/public` at `yamanote.proxy.rlwy.net`; `fo_schema_migrations` records `014_theme_albums.sql` at `2026-07-20T00:07:32.319Z`.
- New Preview tables verified by migration output: `fo_theme_album_entries`, `fo_theme_album_collectors`, `fo_theme_album_transactions`, including `fo_theme_album_entries_player_theme_idx`, `fo_theme_album_collectors_player_idx`, `fo_theme_album_transactions_player_idx` and the unique Theme slot index.
- The all-tests migration deployment failed after migration because `tests/mobile-ux.test.js` expects the gitignored Android file `android/app/src/main/java/uk/gizmogames/flipout/MainActivity.java` inside Vercel's packaged source. This was the same known packaging issue, not a Theme Album migration failure.
- Focused remote verification deployment `dpl_3M3Uzqbjwk89718krBfbAnwWYbWt` is Ready at `https://flip-p36h9raqr-chattocal.vercel.app`; its build command checked migrations, ran `tests/theme-albums.test.js`, `tests/theme-albums-db.test.js` and `tests/collection-data.test.js`, then ran `vite build`.
- Focused remote verification passed **11/11** tests with no skips and built 152 modules.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 with ETag `"be3912ae6871ac7573eac57951315bfd"`, served `assets/index-CA3iEtWW.js`, and that asset contains `1.6.0-theme-albums`. The generated Preview URL returned the same ETag, same asset and same build marker.

## Verification record - Personal Album ownership boundary, 20 July 2026

- Commit `ddac2a0` was pushed from `dev`; no production branch, production deployment, production domain, root DNS record or nameserver was changed.
- Focused Preview deployment `dpl_6ccL6Ax8ruuTcQ4EsaygnxnKbyoy` is Ready at `https://flip-e5h8vfaq9-chattocal.vercel.app`.
- Its build command ran `node scripts/run-economy-migration.mjs --apply`, then `node --test tests/personal-albums.test.js tests/personal-albums-db.test.js tests/collection-data.test.js tests/nickname.test.js`, then `vite build`.
- Migration output targeted Railway Preview `railway/public` at `yamanote.proxy.rlwy.net` with `VERCEL_ENV=preview`; `fo_schema_migrations` records `015_personal_albums.sql` at `2026-07-20T00:34:00.384Z`.
- New Preview tables verified by migration output: `fo_personal_albums`, `fo_personal_album_cards`, `fo_personal_album_transactions`, including `fo_personal_albums_player_idx`, `fo_personal_album_cards_player_idx` and `fo_personal_album_transactions_player_idx`.
- Focused remote verification passed **18/18** tests with no skips and built 152 modules.
- `https://dev.flipout.gizmogames.uk` returned HTTP 200 with ETag `"d3051c0efe0a55d4215bc78e917a8646"`, served `assets/index-kPR7Ipt_.js`, and that asset contains `1.7.0-personal-albums`. The generated Preview URL returned the same ETag, same asset and same build marker.
- A first focused deployment attempt timed out locally and left `flip-dvrd1c1j3-chattocal.vercel.app` queued with no permanent dev alias; it was removed before rerunning verification.

## Verification record - Inventory capacity boundary, 20 July 2026

- Commit `e9659ae` was pushed from `dev`; no production branch, production deployment, production domain, root DNS record or nameserver was changed.
- Implemented files: `api/_inventoryCapacity.js`, `api/migrations/016_inventory_capacity.sql`, `api/_gameServices.js`, `api/_playerState.js`, `src/ui/collectionData.js`, `src/version.js`, `tests/inventory-capacity.test.js`, `tests/inventory-capacity-db.test.js`, `tests/collection-data.test.js`, and `vercel.inventory-capacity-verify.json`.
- Local verification passed:
  - `node --test tests/inventory-capacity.test.js tests/inventory-capacity-db.test.js tests/collection-data.test.js` -> **10 passed / 2 expected Preview DB skips**.
  - `npx.cmd eslint api/_inventoryCapacity.js api/_gameServices.js api/_playerState.js src/ui/collectionData.js tests/inventory-capacity.test.js tests/inventory-capacity-db.test.js tests/collection-data.test.js` -> passed with no output.
  - `npm.cmd test` -> **137 Node passed / 15 expected Preview-only skips**, **50 UI passed**.
  - `npm.cmd run build` -> passed, **152 transformed modules**, entry `dist/assets/index-b0rTx18c.js`.
- Earlier focused Preview deployment attempts temporarily failed to reach Ready:
  - `npx.cmd vercel deploy --yes --scope chattocal --local-config vercel.inventory-capacity-verify.json` timed out locally after 604 seconds.
  - Vercel then listed `flip-q6dgi12es-chattocal.vercel.app` and `flip-cbdp99o79-chattocal.vercel.app` as `● Queued`; both were removed with `npx.cmd vercel remove ... --yes --scope chattocal`.
  - `npx.cmd vercel deploy --yes --force --scope chattocal --local-config vercel.inventory-capacity-verify.json` timed out locally after 904 seconds and left `flip-6yrlaxzte-chattocal.vercel.app` queued.
  - `npx.cmd vercel inspect https://flip-6yrlaxzte-chattocal.vercel.app --scope chattocal --wait --timeout 180s --logs` stopped after 3 minutes with `status ● Queued`; the URL served Vercel's "Deployment is building" placeholder rather than a Flip-Out bundle. It was removed.
- Fallback verification notes:
  - `npx.cmd vercel env ls preview --scope chattocal` confirms encrypted `DATABASE_URL` exists for **Preview (dev)**.
  - `npx.cmd vercel env pull .env.preview.local --environment=preview --scope chattocal --local-config vercel.inventory-capacity-verify.json --yes` did not expose `DATABASE_URL`, so the migration runner correctly refused to run locally with `DATABASE_URL is required`.
  - `npx.cmd vercel build --target=preview --scope chattocal --local-config vercel.inventory-capacity-verify.json` failed before project code with `spawn cmd.exe ENOENT`; retrying with explicit `ComSpec` and `PATH` produced the same Vercel CLI error.
- Final focused Preview verification succeeded:
  - `npx.cmd vercel deploy --yes --force --no-wait --scope chattocal --local-config vercel.inventory-capacity-verify.json --meta githubCommitRef=dev --meta githubCommitSha=496f301` created `dpl_25Up7bWqFHdTdKTwuihHWM991L52` at `https://flip-i960o2j5u-chattocal.vercel.app`.
  - `npx.cmd vercel inspect https://flip-i960o2j5u-chattocal.vercel.app --scope chattocal --local-config vercel.inventory-capacity-verify.json --wait --timeout 300s --logs` reached `● Ready`.
  - Migration output targeted Railway Preview `railway/public`, host `yamanote.proxy.rlwy.net`, user `postgres`, schema `public`, `VERCEL_ENV=preview`.
  - `016_inventory_capacity.sql` committed at `2026-07-20T01:31:19.497Z`.
  - Verification output included `fo_player_inventory_settings` and `fo_player_inventory_settings_pkey`.
  - Focused remote tests passed **12/12** with no skips; production-mode Vite build passed with **152 transformed modules** and entry `assets/index-Bpenq1xH.js`.
- Permanent development URL status: `https://dev.flipout.gizmogames.uk` returned HTTP 200 with ETag `"2e3dd0f773c9aa762d8f80c044472f14"`, served `assets/index-Bpenq1xH.js`, and that asset contains `1.8.0-inventory-capacity`. The focused generated Preview URL returned the same ETag, same asset and same build marker.
- Result: Inventory capacity is implemented, migrated, tested against Preview Railway and served from the permanent development URL. Production was not touched.
