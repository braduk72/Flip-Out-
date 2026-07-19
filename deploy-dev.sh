#!/bin/bash
set -e
if [ "$(git branch --show-current)" != "dev" ]; then
  echo "Development deployments must run from branch dev."
  exit 1
fi
echo "Pushing to git..."
git push origin dev
echo "Vercel will update the dev-branch domain after the deployment is Ready."
echo "Permanent development URL: https://dev.flipout.gizmogames.uk"
