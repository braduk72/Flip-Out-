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

The application currently reports `v1.1.0-ui4d` from `src/version.js`. Reports must name `https://dev.flipout.gizmogames.uk` as the development URL. A generated `*.vercel.app` URL may be recorded separately as a deployment ID for diagnostics, but must not be presented as the URL Brad should use.

## Verification record — 19 July 2026

- Git commit `c4e34bc` was pushed from `dev`; `main` was not touched.
- DNS resolves with TTL 60 to `39622341da5cfe42.vercel-dns-016.com`.
- HTTPS returns 200 from Vercel. Last-Modified is `Sun, 19 Jul 2026 00:37:21 GMT`; ETag is `"76dfb8a66ab3338e7fd8ab136b6d027f"`.
- The permanent URL loads `/assets/index-BYVmyWFx.js` (412,286 bytes), which contains application version `1.1.0-ui4d`.
- New Concept 4D logo, Coin Store WebP and Match-3 token assets each return HTTP 200 from the permanent URL.
- Unauthenticated player-state API returns the expected 401.
- Vercel CLI deployment-ID inspection was unavailable because the external-tool usage cap rejected the read; no manual alias or production action was attempted.

## Verification record — 18 July 2026

- DNS resolves with TTL 60 to `39622341da5cfe42.vercel-dns-016.com`.
- Vercel reports `configured_correctly`, no issues or conflicts, and CNAME configuration through Cloudflare.
- HTTPS returns HTTP 200 OK from Vercel at `https://dev.flipout.gizmogames.uk/`.
- Vercel maps the hostname to Ready Preview deployment `dpl_693xRL9beiopYKwPdEa8oGyga7B2`, the newest Preview deployment at verification time.
- The permanent hostname and generated Preview hostname return ETag `"dcd93590b11bf3077955f1427fb9f43d"` and load the same `/assets/index-qT1Bc9CI.js` bundle.
- The deployed bundle contains the reported application version `1.0.0`.
- No production domain, production deployment, root DNS record or nameserver was changed.
