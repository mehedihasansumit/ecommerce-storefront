#!/usr/bin/env bash
# Deploy ecommerce-website to a VPS over SSH.
#
# Pipeline:
#   1. docker build image locally (host arch must match VPS arch — see BUILD_PLATFORM)
#   2. docker save | gzip | ssh docker load        (no source files leave the host)
#   3. rsync compose file + docker/ config + scripts/ to VPS:$VPS_PATH
#   4. ssh in, docker compose up -d (uses pre-loaded image, no remote build)
#   5. print docker compose ps
#
# First-time VPS setup (one-time, manual):
#   - Install Docker + compose plugin (https://docs.docker.com/engine/install/)
#   - mkdir -p $VPS_PATH
#   - copy .env.production.example -> .env.production, fill secrets
#   - ufw allow 22, 80, 443; deny 5000, 27017, 3900, 3901, 3902, 3903
#       (host-mode containers bind these on host — they MUST NOT be public)
#   - Garage cluster init (after first 'docker compose up -d garage'):
#       docker compose -f docker-compose.prod.yml exec garage /garage status
#       NODE_ID=<id from status>
#       docker compose -f docker-compose.prod.yml exec garage /garage layout assign -z dc1 -c 1G $NODE_ID
#       docker compose -f docker-compose.prod.yml exec garage /garage layout apply --version 1
#       docker compose -f docker-compose.prod.yml exec garage /garage bucket create ecommerce-uploads
#       docker compose -f docker-compose.prod.yml exec garage /garage key new --name app-key
#       docker compose -f docker-compose.prod.yml exec garage /garage bucket allow --read --write --owner ecommerce-uploads --key app-key
#     -> paste the key id + secret into .env.production (S3_ACCESS_KEY / S3_SECRET_KEY)
#   - Nginx reverse-proxy to 127.0.0.1:5000 with `proxy_set_header Host $host;`
#     (multi-tenant routing depends on the original Host header)
#   - First seed: bash scripts/seed-prod.sh
#
# Usage:
#   VPS_USER=root VPS_HOST=1.2.3.4 VPS_PATH=/opt/ecommerce bash scripts/deploy.sh
#
# Cross-arch (Apple Silicon -> linux/amd64 VPS):
#   BUILD_PLATFORM=linux/amd64 VPS_USER=... VPS_HOST=... VPS_PATH=... bash scripts/deploy.sh

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

SSH_OPTS=${SSH_OPTS:-"-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=240 -o TCPKeepAlive=yes"}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}
IMAGE_NAME=${IMAGE_NAME:-ecommerce-website}
IMAGE_TAG=${IMAGE_TAG:-latest}
IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
BUILD_PLATFORM=${BUILD_PLATFORM:-}

# Multiplex: one auth, reuse for all ssh/rsync calls below.
SSH_CTRL_DIR="${TMPDIR:-/tmp}/ecommerce-deploy-ssh-$$"
mkdir -p "$SSH_CTRL_DIR"
chmod 700 "$SSH_CTRL_DIR"
SSH_CTRL_PATH="$SSH_CTRL_DIR/cm-%r@%h:%p"
SSH_OPTS="$SSH_OPTS -o ControlMaster=auto -o ControlPath=$SSH_CTRL_PATH -o ControlPersist=600"
trap 'ssh $SSH_OPTS -O exit "$VPS_USER@$VPS_HOST" 2>/dev/null || true; rm -rf "$SSH_CTRL_DIR"' EXIT

echo "==> Open SSH master connection (one auth reused for all steps)"
ssh $SSH_OPTS -Nf "$VPS_USER@$VPS_HOST"

cd "$REPO_ROOT"

echo "==> Build image locally: $IMAGE_REF"
if [ -n "$BUILD_PLATFORM" ]; then
  # buildx required for cross-platform; --load puts result in local docker image store
  docker buildx build --platform "$BUILD_PLATFORM" -t "$IMAGE_REF" --load .
else
  docker build -t "$IMAGE_REF" .
fi

echo "==> Stream image -> $VPS_USER@$VPS_HOST (docker save | ssh docker load)"
docker save "$IMAGE_REF" | gzip | ssh $SSH_OPTS "$VPS_USER@$VPS_HOST" "gunzip | docker load"

echo "==> Rsync compose + config -> $VPS_USER@$VPS_HOST:$VPS_PATH"
ssh $SSH_OPTS "$VPS_USER@$VPS_HOST" "mkdir -p '$VPS_PATH'"
rsync -avz \
  --include='docker-compose.prod.yml' \
  --include='docker/' \
  --include='docker/**' \
  --include='scripts/' \
  --include='scripts/**' \
  --exclude='*' \
  ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"

echo "==> Up on VPS (no rebuild — image already loaded)"
ssh $SSH_OPTS "$VPS_USER@$VPS_HOST" bash -se <<EOF
set -euo pipefail
cd "$VPS_PATH"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production missing on VPS at $VPS_PATH"
  echo "Copy .env.production.example -> .env.production and fill secrets, then re-run."
  exit 1
fi

docker compose -f $COMPOSE_FILE up -d
docker compose -f $COMPOSE_FILE ps
EOF

echo "==> Done. Logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker compose -f $COMPOSE_FILE logs -f app'"
