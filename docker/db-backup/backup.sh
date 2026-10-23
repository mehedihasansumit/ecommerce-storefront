#!/bin/sh
# One backup run: pg_dump -> check -> (encrypt) -> upload to <prefix>/hourly/,
# copy to daily/ and monthly/ when it is the first of the day / month, then
# expire old backups per tier. Exits non-zero on any failure; the last-success
# marker only moves on success.
. /usr/local/bin/lib.sh

KEEP_HOURLY="${BACKUP_KEEP_HOURLY_HOURS:-48}"
KEEP_DAILY="${BACKUP_KEEP_DAILY_DAYS:-30}"
KEEP_MONTHLY="${BACKUP_KEEP_MONTHLY_DAYS:-365}"

# One run at a time (a slow dump must not overlap the next hour's run). The
# kernel lock is held by this process and released when it exits or dies, so a
# crashed run never blocks later ones and no run can release another's lock.
mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/lock"
if ! flock -n 9; then
  log "another backup is running; skipping"
  echo "another backup is running"
  exit 0
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

STAMP=$(date '+%Y%m%d-%H%M%S')
DAY=$(date '+%Y%m%d')
MONTH=$(date '+%Y%m')
NAME="$PGDATABASE-$STAMP.dump"

# Give up instead of queueing forever behind a long table lock (e.g. a migration).
pg_dump -Fc --lock-wait-timeout=10min -f "$WORK/$NAME"
pg_restore --list "$WORK/$NAME" >/dev/null

FILE="$NAME"
if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then
  age -r "$BACKUP_AGE_RECIPIENT" -o "$WORK/$NAME.age" "$WORK/$NAME"
  rm -f "$WORK/$NAME"
  FILE="$NAME.age"
fi

SIZE=$(wc -c <"$WORK/$FILE" | tr -d ' ')
rclone copyto "$WORK/$FILE" "$REMOTE/hourly/$FILE"
REMOTE_SIZE=$(rclone size --json "$REMOTE/hourly/$FILE" | sed -n 's/.*"bytes":\([0-9]*\).*/\1/p')
if [ "$REMOTE_SIZE" != "$SIZE" ]; then
  log "upload check failed: local $SIZE bytes, remote ${REMOTE_SIZE:-?} bytes"
  exit 1
fi
echo "uploaded $PREFIX/hourly/$FILE ($SIZE bytes)"

# First backup of the day / month is also kept as the daily / monthly one
# (server-side copy, no second upload).
if ! rclone lsf "$REMOTE/daily" 2>/dev/null | grep -q "^$PGDATABASE-$DAY-"; then
  rclone copyto "$REMOTE/hourly/$FILE" "$REMOTE/daily/$FILE"
  echo "kept as daily"
fi
if ! rclone lsf "$REMOTE/monthly" 2>/dev/null | grep -q "^$PGDATABASE-$MONTH"; then
  rclone copyto "$REMOTE/hourly/$FILE" "$REMOTE/monthly/$FILE"
  echo "kept as monthly"
fi

# Expire each tier only inside its own folder, after a verified upload.
rclone delete "$REMOTE/hourly" --min-age "${KEEP_HOURLY}h"
rclone delete "$REMOTE/daily" --min-age "${KEEP_DAILY}d"
rclone delete "$REMOTE/monthly" --min-age "${KEEP_MONTHLY}d"

date +%s >"$STATE_DIR/last-success"
