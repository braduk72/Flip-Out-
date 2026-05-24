#!/bin/bash
set -e
echo "Pushing to git..."
git push origin dev
echo "Waiting for Vercel build..."
sleep 30
LATEST=$(npx vercel ls --scope chattocal 2>&1 | grep "flip-out " | grep "Ready.*Preview" | head -1 | awk '{print $3}' | sed 's|https://||')
echo "Latest deployment: $LATEST"
npx vercel alias set $LATEST dev.gizmogames.uk --scope chattocal
echo "Done. https://dev.gizmogames.uk is live."
