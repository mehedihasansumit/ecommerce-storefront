#!/bin/sh
# Restore a backup from the bucket into a database.
#
#   restore.sh latest --target-db <name>            newest hourly backup
#   restore.sh <tier>/<file> --target-db <name>     a specific one (e.g. daily/ecommerce-20261023-030000.dump)
#   restore.sh ... --target-db <name> --force       overwrite a database that already has tables
#
# Encrypted backups (.age) need AGE_IDENTITY: path to the age private key file,
# mounted only for the restore. The target database is created when missing.
. /usr/local/bin/lib.sh

usage() { echo "usage: restore.sh <latest|tier/file> --target-db <name> [--force]" >&2; exit 2; }

WHICH=""
TARGET=""
FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --target-db) TARGET="${2:-}"; shift 2 ;;
    --force) FORCE=1; shift ;;
    -*) usage ;;
    *) WHICH="$1"; shift ;;
  esac
done
[ -n "$WHICH" ] || usage
if [ -z "$TARGET" ]; then
  echo "refusing: pass --target-db <name> (a new database is safest)" >&2
  exit 2
fi
case "$TARGET" in
  *[!a-zA-Z0-9_]*) echo "invalid database name '$TARGET': letters, digits and _ only" >&2; exit 2 ;;
esac
if [ "$TARGET" = "$PGDATABASE" ] && [ "$FORCE" -ne 1 ]; then
  echo "refusing to overwrite the live database '$TARGET'; restore into another database, or add --force" >&2
  exit 2
fi

if [ "$WHICH" = "latest" ]; then
  FILE=$(rclone lsf --files-only "$REMOTE/hourly" | grep "^$PGDATABASE-" | sort | tail -1)
  [ -n "$FILE" ] || { echo "no backups found in $PREFIX/hourly" >&2; exit 1; }
  KEY="hourly/$FILE"
else
  KEY="$WHICH"
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
DUMP="$WORK/restore.dump"

case "$KEY" in
  *.age)
    if [ -z "${AGE_IDENTITY:-}" ] || [ ! -r "$AGE_IDENTITY" ]; then
      echo "$KEY is encrypted: set AGE_IDENTITY to the age private key file" >&2
      exit 1
    fi
    rclone copyto "$REMOTE/$KEY" "$WORK/backup.age"
    age -d -i "$AGE_IDENTITY" -o "$DUMP" "$WORK/backup.age"
    ;;
  *)
    rclone copyto "$REMOTE/$KEY" "$DUMP"
    ;;
esac
pg_restore --list "$DUMP" >/dev/null

if [ "$(psql -d postgres -Atc "select count(*) from pg_database where datname = '$TARGET'")" = "0" ]; then
  createdb "$TARGET"
elif [ "$(psql -d "$TARGET" -Atc "select count(*) from pg_tables where schemaname not in ('pg_catalog', 'information_schema')")" != "0" ] \
     && [ "$FORCE" -ne 1 ]; then
  echo "refusing: '$TARGET' already has tables; restore into a new database, or add --force" >&2
  exit 2
fi
log "restoring $PREFIX/$KEY into $TARGET"
# One transaction: an error rolls everything back instead of leaving the target
# half dropped. --clean only replaces objects that are in the dump; tables added
# after the backup stay, so a full rollback should restore into a new database.
pg_restore --no-owner --clean --if-exists --single-transaction --exit-on-error -d "$TARGET" "$DUMP"
echo "restored $PREFIX/$KEY into $TARGET"
