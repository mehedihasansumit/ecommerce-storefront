#!/bin/sh
# One backup run: pg_dump -> check -> (encrypt) -> upload to <prefix>/hourly/.
# Exits non-zero on any failure; the last-success marker only moves on success.
. /usr/local/bin/lib.sh

STAMP=$(date '+%Y%m%d-%H%M%S')
NAME="$PGDATABASE-$STAMP.dump"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

pg_dump -Fc -f "$WORK/$NAME"
pg_restore --list "$WORK/$NAME" >/dev/null

FILE="$NAME"
KEY="hourly/$FILE"
SIZE=$(wc -c <"$WORK/$FILE" | tr -d ' ')
rclone copyto "$WORK/$FILE" "$REMOTE/$KEY"
REMOTE_SIZE=$(rclone size --json "$REMOTE/$KEY" | sed -n 's/.*"bytes":\([0-9]*\).*/\1/p')
if [ "$REMOTE_SIZE" != "$SIZE" ]; then
  log "upload check failed: local $SIZE bytes, remote ${REMOTE_SIZE:-?} bytes"
  exit 1
fi

mkdir -p "$STATE_DIR"
date +%s >"$STATE_DIR/last-success"
echo "uploaded $PREFIX/$KEY ($SIZE bytes)"
