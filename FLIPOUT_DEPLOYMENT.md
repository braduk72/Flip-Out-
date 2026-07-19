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

The application currently reports `1.2.1-mobile-ux` from `src/version.js`. Reports must name `https://dev.flipout.gizmogames.uk` as the development URL. A generated `*.vercel.app` URL may be recorded separately as a deployment ID for diagnostics, but must not be presented as the URL Brad should use.

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
