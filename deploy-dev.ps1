# Deploy to dev.gizmogames.uk
# Run this instead of "git push origin dev"

$ErrorActionPreference = "Stop"

Write-Host "Pushing to git..." -ForegroundColor Cyan
git push origin dev

Write-Host "Deploying to Vercel and getting URL..." -ForegroundColor Cyan
$deployUrl = (npx vercel deploy --yes --scope chattocal 2>&1 | Select-String "https://flip-" | Select-Object -Last 1).ToString().Trim()

if (-not $deployUrl) {
    Write-Host "Could not get deployment URL" -ForegroundColor Red
    exit 1
}

Write-Host "Deployed: $deployUrl" -ForegroundColor Yellow
Write-Host "Aliasing to dev.gizmogames.uk..." -ForegroundColor Cyan
npx vercel alias set $deployUrl dev.gizmogames.uk --scope chattocal

Write-Host "Done. Visit: https://dev.gizmogames.uk" -ForegroundColor Green
