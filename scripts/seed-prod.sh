#!/usr/bin/env bash
# Run the seed script inside the running app container on the VPS.
# Requires Garage bucket + key already configured and .env.production filled.
#
# Usage:
#   bash scripts/seed-prod.sh                  # reads .env.deploy at repo root
#   VPS_USER=root VPS_HOST=1.2.3.4 VPS_PATH=/opt/ecommerce bash scripts/seed-prod.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load deploy config from file (default .env.deploy at repo root).
# File should define VPS_USER, VPS_HOST, VPS_PATH (and optional overrides).
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
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}

# The runner image does not include tsx or source files — seed must run from the
# builder stage, OR via a one-shot node container that mounts the source.
# Simplest reliable path: run a throwaway node container against the same network
# with the source rsynced on the VPS.

echo "==> Syncing source files to VPS…"
rsync -az -e "ssh $SSH_OPTS" \
  --include="src/db/***" \
  --include="src/" \
  --include="package.json" \
  --include="package-lock.json" \
  --include="tsconfig.json" \
  --include="drizzle.config.ts" \
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
  sh -c "apk add --no-cache libc6-compat >/dev/null && npm ci --no-audit --no-fund && npx drizzle-kit migrate && npx tsx src/db/seed.ts"
EOF
