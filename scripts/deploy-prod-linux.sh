#!/bin/sh
# Build and publish production from an amd64 Linux machine on OrbStack.
#
# The prebuilt guard (scripts/check-vercel-prebuilt.mjs) requires x86_64
# functions, which a build on an arm64 Mac cannot produce: `vercel build`
# stamps the architecture of the machine it ran on, so the guard rejects the
# artifact before it reaches the publish step. This script clones the current
# HEAD into an OrbStack machine, installs the pinned toolchain there, runs the
# deploy:prod chain, and promotes the result.
#
# The GitHub Actions workflow does the same thing on a hosted x86_64 runner,
# but it needs a VERCEL_TOKEN secret and Vercel has no OIDC route for CLI
# deploys. This script is the path that works from the Mac with no token,
# reading the Vercel CLI's own login.
#
# Requirements on the Mac: OrbStack, and a logged-in Vercel CLI with access to
# the danielhowells team.
#
# Usage: pnpm deploy:prod:linux [--no-publish]
set -eu

REPO=$(cd "$(dirname "$0")/.." && pwd)
MACHINE=${ORB_MACHINE:-scaffold-build}
NODE_VERSION=24.15.0
PNPM_VERSION=$(node -p "require('$REPO/package.json').packageManager.split('@')[1]")
VERCEL_CLI_VERSION=59.11.1
PUBLISH=1
[ "${1:-}" = "--no-publish" ] && PUBLISH=0

command -v orb >/dev/null || { echo "deploy-prod-linux: OrbStack (orb) is not installed" >&2; exit 1; }
[ -f "$REPO/.vercel/project.json" ] || { echo "deploy-prod-linux: run vercel link first" >&2; exit 1; }
AUTH="$HOME/Library/Application Support/com.vercel.cli/auth.json"
[ -f "$AUTH" ] || { echo "deploy-prod-linux: vercel login first" >&2; exit 1; }

if ! orb list 2>/dev/null | grep -q "^$MACHINE "; then
  echo "deploy-prod-linux: creating amd64 machine $MACHINE"
  orb create -a amd64 ubuntu:noble "$MACHINE"
fi

REMOTE="$HOME/.cache/scaffold/deploy-prod-linux.remote.sh"
mkdir -p "$(dirname "$REMOTE")"
cat > "$REMOTE" <<EOF
set -eu
export DEBIAN_FRONTEND=noninteractive
if ! command -v git >/dev/null || ! command -v curl >/dev/null; then
  sudo apt-get update -qq >/dev/null
  sudo apt-get install -y -qq git curl xz-utils ca-certificates python3 >/dev/null
fi
if ! command -v node >/dev/null || [ "\$(node -v)" != "v$NODE_VERSION" ]; then
  curl -fsSL https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz -o /tmp/node.tar.xz
  sudo tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
fi
if [ "\$(pnpm -v 2>/dev/null)" != "$PNPM_VERSION" ] || [ "\$(vercel --version 2>/dev/null | head -1)" != "$VERCEL_CLI_VERSION" ]; then
  sudo npm install -g --silent pnpm@$PNPM_VERSION vercel@$VERCEL_CLI_VERSION >/dev/null
fi

rm -rf ~/scaffold
git clone -q "$REPO" ~/scaffold
cd ~/scaffold
git remote set-url origin https://github.com/howells/scaffold.git
mkdir -p .vercel && cp "$REPO/.vercel/project.json" .vercel/project.json

export VERCEL_TOKEN=\$(python3 -c "import json;print(json.load(open('$AUTH'))['token'])")
export VERCEL_GIT_COMMIT_SHA=\$(git rev-parse HEAD)
echo "deploy-prod-linux: building \$VERCEL_GIT_COMMIT_SHA on \$(uname -m)"

pnpm install --frozen-lockfile
pnpm deploy:prod:pull
pnpm deploy:prod:stamp
pnpm deploy:prod:build
pnpm deploy:prod:verify
if [ "$PUBLISH" = "1" ]; then
  pnpm deploy:prod:publish
else
  echo "deploy-prod-linux: built and verified; skipped publish"
fi
EOF

orb -m "$MACHINE" sh "$REMOTE"
