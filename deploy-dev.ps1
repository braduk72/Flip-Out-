$output = npx vercel deploy --scope chattocal --yes 2>&1
$output | Write-Host
$url = ($output | Select-String 'https://flip-[a-z0-9]+-chattocal\.vercel\.app').Matches[0].Value
if ($url) {
  Write-Host "`nAliasing $url -> dev.gizmogames.uk"
  npx vercel alias $url dev.gizmogames.uk --scope chattocal
} else {
  Write-Host "Could not extract preview URL from deploy output"
}
