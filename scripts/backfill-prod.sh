#!/usr/bin/env bash
# Run the image-optimization backfill against the VPS database + Garage bucket.
#
# The runner image ships no source/tsx, so (like seed-prod.sh) we rsync the
# source to the VPS and run a throwaway node container on the host network with
# .env.production. --network host lets 127.0.0.1 reach Postgres + Garage.
#
# Run this ONCE, after deploying the optimized build (new uploads are already
# optimized; this fixes images stored before that).
#
# Usage:
#   bash scripts/backfill-prod.sh                 # process everything
#   bash scripts/backfill-prod.sh --dry           # report only, no writes
#   bash scripts/backfill-prod.sh --force         # re-process even if optimized
#   VPS_USER=root VPS_HOST=1.2.3.4 VPS_PATH=/opt/ecommerce bash scripts/backfill-prod.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEPLOY_ENV_FILE=${DEPLOY_ENV_FILE:-"$REPO_ROOT/.env.deploy"}
if [ -f "$DEPLOY_ENV_FILE" ]; then
  echo "==> Loading deploy config: $DEPLOY_ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$DEPLOY_ENV_FILE"
  set +a
fi

: "${VPS_USER:?set VPS_USER (in $DEPLOY_ENV_FILE or env)}"
: "${VPS_HOST:?set VPS_HOST (in $DEPLOY_ENV_FILE or env)}"
: "${VPS_PATH:?set VPS_PATH e.g. /opt/ecommerce (in $DEPLOY_ENV_FILE or env)}"

SSH_OPTS=${SSH_OPTS:-"-o StrictHostKeyChecking=accept-new"}
BACKFILL_ARGS="$*"   # forwarded to the script (e.g. --dry / --force)

echo "==> Syncing source files to VPS…"
rsync -az -e "ssh $SSH_OPTS" \
  --include="src/***" \
  --include="scripts/***" \
  --include="package.json" \
  --include="package-lock.json" \
  --include="tsconfig.json" \
  --exclude="*" \
  "$REPO_ROOT/" "$VPS_USER@$VPS_HOST:$VPS_PATH/"

ssh $SSH_OPTS "$VPS_USER@$VPS_HOST" bash -se <<EOF
set -euo pipefail
cd "$VPS_PATH"

docker run --rm \
  --network host \
  --env-file .env.production \
  -v "\$PWD":/app \
  -w /app \
  node:22-alpine \
  sh -c "apk add --no-cache libc6-compat >/dev/null && npm ci --no-audit --no-fund && npx tsx scripts/backfill-image-optimization.ts $BACKFILL_ARGS"
EOF

echo "==> Backfill done."
