$branch = git branch --show-current
if ($branch -ne 'dev') {
  throw "Development deployments must run from branch dev (current: $branch)."
}

$buildOutput = npx vercel build --yes --scope chattocal 2>&1
$buildOutput | Write-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Vercel development build failed.'
}

$output = npx vercel deploy --prebuilt --scope chattocal --yes 2>&1
$output | Write-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Vercel development deployment failed.'
}

Write-Host "`nThe Vercel dev-branch domain updates automatically after a successful deployment."
Write-Host "Permanent development URL: https://dev.flipout.gizmogames.uk"
