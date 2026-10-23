#!/bin/sh
# Shared setup for backup.sh and restore.sh: the rclone remote "r2:" comes from
# BACKUP_S3_* env vars (no config file, no secrets on the command line).
set -eu

: "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT is required}"
: "${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY is required}"
: "${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${PGDATABASE:?PGDATABASE is required}"

# No config file: the remote is defined entirely by the variables below.
export RCLONE_CONFIG=/dev/null
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER="${BACKUP_S3_PROVIDER:-Cloudflare}"
export RCLONE_CONFIG_R2_ENDPOINT="$BACKUP_S3_ENDPOINT"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY"
export RCLONE_CONFIG_R2_REGION="${BACKUP_S3_REGION:-auto}"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

PREFIX="${BACKUP_PREFIX:-postgres}"
REMOTE="r2:$BACKUP_S3_BUCKET/$PREFIX"
STATE_DIR=/var/lib/db-backup

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }
