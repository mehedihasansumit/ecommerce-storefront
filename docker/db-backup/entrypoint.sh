#!/bin/sh
# Runs backup.sh on BACKUP_CRON (default hourly) with busybox crond.
set -eu
mkdir -p /var/lib/db-backup
# crond does not pass the container env to jobs: keep it in a file the job sources.
export -p | grep -E ' (BACKUP_|PG|TZ=)' >/var/lib/db-backup/env.sh
chmod 600 /var/lib/db-backup/env.sh
echo "${BACKUP_CRON:-0 * * * *} . /var/lib/db-backup/env.sh && /usr/local/bin/backup.sh >/proc/1/fd/1 2>/proc/1/fd/2" >/etc/crontabs/root
echo "db-backup: schedule '${BACKUP_CRON:-0 * * * *}' ($TZ)"
exec crond -f -l 8
