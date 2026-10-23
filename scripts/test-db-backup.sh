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
  # Empty the bucket (needs the key's access) before revoking access and deleting it.
  [ -n "${ACCESS_KEY:-}" ] && rcl purge "r2:$BUCKET" >/dev/null 2>&1 || true
  garage bucket deny --read --write --owner "$BUCKET" --key "$KEY_NAME" >/dev/null 2>&1 || true
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

# rclone mtime string for "N units ago", e.g. ago "3 days"
ago() { date -u -d "$1 ago" '+%Y-%m-%dT%H:%M:%S'; }
stamp_ago() { date -u -d "$1 ago" '+%Y%m%d-%H%M%S'; }
plant() { rcl touch -t "$(ago "$2")" "r2:$BUCKET/$1" >/dev/null; }
count() { objects "$1" | grep -c . || true; }

case_tiers() {
  reset_bucket
  EXTRA_ENV=()
  run_backup >/dev/null || fail "first run failed"
  [ "$(count postgres/hourly)" -eq 1 ] && [ "$(count postgres/daily)" -eq 1 ] && [ "$(count postgres/monthly)" -eq 1 ] \
    || fail "first run should fill hourly, daily and monthly: $(objects postgres)"
  sleep 1
  run_backup >/dev/null || fail "second run failed"
  [ "$(count postgres/hourly)" -eq 2 ] && [ "$(count postgres/daily)" -eq 1 ] && [ "$(count postgres/monthly)" -eq 1 ] \
    || fail "second run the same day should only add an hourly backup: $(objects postgres)"
  pass "tiers"
}

case_retention() {
  reset_bucket
  EXTRA_ENV=()
  plant "postgres/hourly/ecommerce-$(stamp_ago "3 days").dump" "3 days"
  plant "postgres/daily/ecommerce-$(stamp_ago "40 days").dump" "40 days"
  plant "postgres/daily/ecommerce-$(stamp_ago "10 days").dump" "10 days"
  plant "postgres/monthly/ecommerce-$(stamp_ago "400 days").dump" "400 days"
  plant "postgres/monthly/ecommerce-$(stamp_ago "100 days").dump" "100 days"
  plant "other/keep.txt" "400 days"
  run_backup >/dev/null || fail "backup failed"
  local all; all=$(objects "")
  echo "$all" | grep -q "hourly/ecommerce-$(stamp_ago "3 days" | cut -c1-8)" && fail "3-day-old hourly not removed"
  echo "$all" | grep -q "daily/ecommerce-$(stamp_ago "40 days" | cut -c1-8)" && fail "40-day-old daily not removed"
  echo "$all" | grep -q "monthly/ecommerce-$(stamp_ago "400 days" | cut -c1-8)" && fail "400-day-old monthly not removed"
  echo "$all" | grep -q "daily/ecommerce-$(stamp_ago "10 days" | cut -c1-8)" || fail "10-day-old daily removed"
  echo "$all" | grep -q "monthly/ecommerce-$(stamp_ago "100 days" | cut -c1-8)" || fail "100-day-old monthly removed"
  echo "$all" | grep -q "^other/keep.txt$" || fail "object outside the prefix removed"
  [ "$(count postgres/hourly)" -eq 1 ] || fail "new hourly backup missing"
  pass "retention"
}

case_upload_failure() {
  EXTRA_ENV=()
  run_backup >/dev/null || fail "setup backup failed"
  local before after
  before=$(in_image cat /var/lib/db-backup/last-success)
  sleep 1
  # shellcheck disable=SC2046
  if docker run --rm --network host -v "$STATE_VOLUME:/var/lib/db-backup" "${PG_ENV[@]}" $(s3_env http://127.0.0.1:1) \
      -e RCLONE_RETRIES=1 -e RCLONE_LOW_LEVEL_RETRIES=1 "$IMAGE" /usr/local/bin/backup.sh >/dev/null 2>&1; then
    fail "backup to an unreachable bucket exited 0"
  fi
  after=$(in_image cat /var/lib/db-backup/last-success)
  [ "$before" = "$after" ] || fail "last-success moved after a failed upload"
  pass "upload failure"
}

case_lock() {
  reset_bucket
  EXTRA_ENV=()
  # Another run holds the lock (a process keeps it with flock) → this run skips.
  # shellcheck disable=SC2046
  docker run -d --rm --name dbb-lock-holder -v "$STATE_VOLUME:/var/lib/db-backup" "$IMAGE" \
    sh -c 'exec 9>/var/lib/db-backup/lock; flock 9; sleep 60' >/dev/null
  sleep 2
  local out; out=$(run_backup 2>&1) || { docker rm -f dbb-lock-holder >/dev/null; fail "locked run should exit 0"; }
  docker rm -f dbb-lock-holder >/dev/null
  echo "$out" | grep -q "another backup is running" || fail "locked run did not report the lock: $out"
  [ "$(count postgres/hourly)" -eq 0 ] || fail "locked run uploaded a backup"
  # A lock file left by a crashed run (nobody holds it) does not block the next run.
  in_image sh -c 'touch /var/lib/db-backup/lock' >/dev/null
  run_backup >/dev/null || fail "run after a crashed run failed"
  [ "$(count postgres/hourly)" -eq 1 ] || fail "run after a crashed run did not upload"
  pass "lock"
}

case_encryption() {
  reset_bucket
  local keydir; keydir=$(mktemp -d)
  docker run --rm -v "$keydir:/k" "$IMAGE" sh -c 'age-keygen -o /k/key.txt 2>/dev/null; chmod 644 /k/key.txt'
  local pub; pub=$(grep -o 'age1[0-9a-z]*' "$keydir/key.txt" | head -1)
  EXTRA_ENV=(-e "BACKUP_AGE_RECIPIENT=$pub")
  local out; out=$(run_backup) || fail "encrypted backup failed"
  echo "$out" | grep -q "\.dump\.age " || fail "uploaded key is not .dump.age: $out"
  objects postgres | grep -q "\.dump$" && fail "a plain .dump was uploaded"
  local key; key=$(objects postgres/hourly | head -1)
  EXTRA_ENV=(-v "$keydir:/k:ro")
  in_image sh -c "rclone cat r2:$BUCKET/postgres/hourly/$key | age -d -i /k/key.txt | pg_restore --list >/dev/null" \
    || fail "encrypted backup does not decrypt to a valid dump"
  EXTRA_ENV=()
  rm -rf "$keydir"
  pass "encryption"
}

TARGET_DB=ecommerce_restore_test
psql_q() { docker exec ecommerce-postgres psql -U ecommerce -d "$1" -At -c "$2"; }
drop_target() { docker exec ecommerce-postgres psql -U ecommerce -d postgres -c "drop database if exists $TARGET_DB" >/dev/null; }
db_exists() { [ "$(psql_q postgres "select count(*) from pg_database where datname='$1'")" = "1" ]; }

case_restore_latest() {
  reset_bucket
  drop_target
  EXTRA_ENV=()
  run_backup >/dev/null || fail "backup failed"
  in_image /usr/local/bin/restore.sh latest --target-db "$TARGET_DB" >/dev/null || fail "restore exited non-zero"
  for t in stores products categories orders product_images; do
    local a b
    a=$(psql_q ecommerce "select count(*) from $t"); b=$(psql_q "$TARGET_DB" "select count(*) from $t")
    [ "$a" = "$b" ] || fail "row count differs for $t: source $a, restored $b"
  done
  # A database that already has tables is not overwritten without --force.
  local out
  if out=$(in_image /usr/local/bin/restore.sh latest --target-db "$TARGET_DB" 2>&1); then
    fail "restore into a non-empty database was not refused"
  fi
  echo "$out" | grep -qi "already has tables" || fail "non-empty refusal message missing: $out"
  in_image /usr/local/bin/restore.sh latest --target-db "$TARGET_DB" --force >/dev/null \
    || fail "forced restore into the same database failed"
  drop_target
  pass "restore latest into a new DB"
}

case_restore_refuses_live_db() {
  EXTRA_ENV=()
  local out
  if out=$(in_image /usr/local/bin/restore.sh latest --target-db ecommerce 2>&1); then
    fail "restore into the live DB was not refused"
  fi
  echo "$out" | grep -qi "refusing" || fail "refusal message missing: $out"
  if out=$(in_image /usr/local/bin/restore.sh latest 2>&1); then
    fail "restore without --target-db was not refused"
  fi
  if out=$(in_image /usr/local/bin/restore.sh latest --target-db "x'; drop database ecommerce; --" 2>&1); then
    fail "restore accepted an unsafe database name"
  fi
  echo "$out" | grep -qi "invalid database name" || fail "unsafe name message missing: $out"
  pass "restore refuses the live DB"
}

case_restore_encrypted_without_key() {
  reset_bucket
  drop_target
  local keydir; keydir=$(mktemp -d)
  docker run --rm -v "$keydir:/k" "$IMAGE" sh -c 'age-keygen -o /k/key.txt 2>/dev/null; chmod 644 /k/key.txt'
  EXTRA_ENV=(-e "BACKUP_AGE_RECIPIENT=$(grep -o 'age1[0-9a-z]*' "$keydir/key.txt" | head -1)")
  run_backup >/dev/null || fail "encrypted backup failed"
  EXTRA_ENV=()
  local out
  if out=$(in_image /usr/local/bin/restore.sh latest --target-db "$TARGET_DB" 2>&1); then
    fail "restoring an encrypted backup without AGE_IDENTITY succeeded"
  fi
  echo "$out" | grep -q "AGE_IDENTITY" || fail "message does not mention AGE_IDENTITY: $out"
  db_exists "$TARGET_DB" && fail "target DB was created before the key check"
  EXTRA_ENV=(-v "$keydir:/k:ro" -e AGE_IDENTITY=/k/key.txt)
  in_image /usr/local/bin/restore.sh latest --target-db "$TARGET_DB" >/dev/null || fail "restore with the key failed"
  [ "$(psql_q "$TARGET_DB" "select count(*) from stores")" = "$(psql_q ecommerce "select count(*) from stores")" ] \
    || fail "encrypted restore has different store count"
  EXTRA_ENV=()
  drop_target
  rm -rf "$keydir"
  pass "encrypted restore needs the key"
}

# The app must not get the backup token, and the backup container must not get
# app secrets: each reads its own env file.
case_env_separation() {
  local t; t=$(mktemp -d)
  cp "$REPO_ROOT/docker-compose.prod.yml" "$t/"
  mkdir -p "$t/docker/db-backup"
  printf 'JWT_SECRET=app-secret\n' >"$t/.env.production"
  printf 'BACKUP_S3_SECRET_KEY=backup-secret\n' >"$t/.env.backup"
  local json; json=$(docker compose -f "$t/docker-compose.prod.yml" config --format json 2>/dev/null) || fail "compose config failed"
  rm -rf "$t"
  local app bak
  app=$(echo "$json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["app"].get("environment",{}))')
  bak=$(echo "$json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["db-backup"].get("environment",{}))')
  echo "$app" | grep -q backup-secret && fail "app gets the backup secret"
  echo "$bak" | grep -q app-secret && fail "db-backup gets app secrets"
  echo "$bak" | grep -q backup-secret || fail "db-backup lacks its own secret"
  pass "env separation"
}

ALL_CASES=(backup_uploads_valid_dump tiers retention upload_failure lock encryption restore_latest restore_refuses_live_db restore_encrypted_without_key env_separation)

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
