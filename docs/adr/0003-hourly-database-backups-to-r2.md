---
status: accepted
date: 2026-10-23
---

# Hourly logical database backups to a separate R2 bucket; no Garage in production

The production database had no off-server backup. We decided to run a small
`db-backup` container next to Postgres that takes a `pg_dump` every hour and
stores it in its own private Cloudflare R2 bucket (own API token, never the
media bucket), keeping hourly backups for 48 hours, the first of each day for
30 days and the first of each month for a year. Production now uses R2 for both
media and backups, so the Garage service was removed from the production stack.

## Considered options

- **Nightly dumps:** simplest, but up to 24 hours of orders could be lost.
- **Hourly dumps, keep all for 30 days:** ~720 copies; tiers give the same
  recovery points for recent mistakes with ~120 copies plus a year of monthly
  history.
- **Continuous WAL archiving (WAL-G / pgBackRest to R2):** minutes of data loss
  instead of up to an hour, but more moving parts (base backups, WAL retention,
  a more involved restore). Not worth it while the database is small; revisit
  when it grows to several GB or an hour of lost orders becomes unacceptable.
- **Managed Postgres with built-in backups:** would also move the database off
  the VPS; out of scope for now.

## Consequences

- Worst case is losing the data written since the last hourly backup.
- Full dumps every hour stay cheap only while the database is small; a
  multi-GB database makes this the point to switch to WAL archiving.
- Encryption is optional (`BACKUP_AGE_RECIPIENT`, age public key on the
  server). When used, the private key must be kept off the server; losing it
  makes every encrypted backup unusable.
- Restores are only trustworthy if tried: the runbook
  (`docs/deploy/db-backups.md`) includes a monthly restore drill into a scratch
  database. `restore.sh` refuses the live database without `--force`.
- Retention is done by the backup job with the same token that writes, so a
  leaked backup token can also delete backups. An R2 bucket lock or a second
  copy elsewhere would close that; not done yet.
- `scripts/test-db-backup.sh` tests backup, tiers, retention, failure, lock,
  encryption and restore end to end against a local S3 (Garage) in place of R2.
