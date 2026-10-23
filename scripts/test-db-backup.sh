#!/usr/bin/env bash
# End-to-end test for the db-backup image (docker/db-backup), run locally.
#
# Uses the local Garage (S3-compatible, standing in for Cloudflare R2) and the
# local Postgres container. Creates its own bucket "db-backups-test" and key;
# never writes to the "ecommerce" database (restores go to a throwaway DB).
#
# Usage: bash scripts/test-db-backup.sh [case ...]     (default: all cases)
#        bash scripts/test-db-backup.sh --cleanup      (remove test bucket and key)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE=ecommerce-db-backup:test
GARAGE=garage
BUCKET=db-backups-test
KEY_NAME=db-backup-test
S3_ENDPOINT=http://127.0.0.1:3900
STATE_VOLUME=db-backup-test-state
PG_ENV=(-e PGHOST=127.0.0.1 -e PGPORT=5432 -e PGUSER=ecommerce -e PGPASSWORD=ecommerce -e PGDATABASE=ecommerce)

garage() { docker exec "$GARAGE" /garage "$@" 2>/dev/null; }

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

cleanup() {
  garage bucket deny --read --write --owner "$BUCKET" --key "$KEY_NAME" >/dev/null 2>&1 || true
  # Empty the bucket before deleting it.
  [ -n "${ACCESS_KEY:-}" ] && rcl purge "r2:$BUCKET" >/dev/null 2>&1 || true
  garage bucket delete --yes "$BUCKET" >/dev/null 2>&1 || true
  garage key delete --yes "$KEY_NAME" >/dev/null 2>&1 || true
  docker volume rm -f "$STATE_VOLUME" >/dev/null 2>&1 || true
  echo "cleaned up test bucket, key and state volume"
}

setup() {
  garage bucket info "$BUCKET" >/dev/null 2>&1 || garage bucket create "$BUCKET" >/dev/null
  if ! garage key info "$KEY_NAME" >/dev/null 2>&1; then
    garage key create "$KEY_NAME" >/dev/null
  fi
  local info
  info=$(garage key info --show-secret "$KEY_NAME")
  ACCESS_KEY=$(echo "$info" | awk '/Key ID:/ {print $3}')
  SECRET_KEY=$(echo "$info" | awk '/Secret key:/ {print $3}')
  [ -n "$ACCESS_KEY" ] && [ -n "$SECRET_KEY" ] || fail "could not read test key from Garage"
  garage bucket allow --read --write --owner "$BUCKET" --key "$KEY_NAME" >/dev/null
  docker build -q -t "$IMAGE" "$REPO_ROOT/docker/db-backup" >/dev/null
}

s3_env() {
  echo -e "-e BACKUP_S3_ENDPOINT=${1:-$S3_ENDPOINT} -e BACKUP_S3_ACCESS_KEY=$ACCESS_KEY -e BACKUP_S3_SECRET_KEY=$SECRET_KEY -e BACKUP_S3_BUCKET=$BUCKET -e BACKUP_S3_PROVIDER=Other -e BACKUP_S3_REGION=garage"
}

# Run a command in the image with S3 + Postgres env, the "r2:" remote and the state volume.
in_image() {
  # shellcheck disable=SC2046
  docker run --rm --network host -v "$STATE_VOLUME:/var/lib/db-backup" "${PG_ENV[@]}" $(s3_env) "${EXTRA_ENV[@]}" \
    "$IMAGE" sh -c '. /usr/local/bin/lib.sh && exec "$@"' sh "$@"
}

# rclone against the test bucket, from inside the image (remote "r2:").
rcl() { in_image rclone "$@"; }

run_backup() { in_image /usr/local/bin/backup.sh; }

objects() { rcl lsf -R --files-only "r2:$BUCKET/$1" 2>/dev/null || true; }

reset_bucket() { rcl purge "r2:$BUCKET" >/dev/null 2>&1 || true; rcl mkdir "r2:$BUCKET" >/dev/null 2>&1 || true; }

# ---------------------------------------------------------------- cases

case_backup_uploads_valid_dump() {
  reset_bucket
  docker volume rm -f "$STATE_VOLUME" >/dev/null 2>&1 || true
  EXTRA_ENV=()
  local out
  out=$(run_backup) || fail "backup.sh exited non-zero: $out"
  echo "$out" | grep -q "^uploaded postgres/hourly/ecommerce-[0-9]\{8\}-[0-9]\{6\}\.dump " || fail "unexpected output: $out"
  local hourly
  hourly=$(objects postgres/hourly)
  [ "$(echo "$hourly" | grep -c .)" -eq 1 ] || fail "expected one hourly object, got: $hourly"
  echo "$hourly" | grep -q "^ecommerce-[0-9]\{8\}-[0-9]\{6\}\.dump$" || fail "bad key name: $hourly"
  in_image sh -c "rclone cat r2:$BUCKET/postgres/hourly/$hourly | pg_restore --list >/dev/null" \
    || fail "uploaded dump is not a valid pg_dump archive"
  in_image test -f /var/lib/db-backup/last-success || fail "last-success marker missing"
  in_image /usr/local/bin/healthcheck.sh || fail "healthcheck unhealthy right after a backup"
  pass "backup uploads a valid dump"
}

ALL_CASES=(backup_uploads_valid_dump)

# ---------------------------------------------------------------- main

if [ "${1:-}" = "--cleanup" ]; then
  setup >/dev/null 2>&1 || true
  cleanup
  exit 0
fi

setup
EXTRA_ENV=()
cases=("$@")
[ ${#cases[@]} -eq 0 ] && cases=("${ALL_CASES[@]}")
for c in "${cases[@]}"; do "case_$c"; done
echo "all ${#cases[@]} case(s) passed"
