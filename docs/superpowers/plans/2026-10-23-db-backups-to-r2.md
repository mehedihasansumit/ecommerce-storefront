# Database Backups to Cloudflare R2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The production Postgres database is backed up every hour to a private Cloudflare R2 bucket, old backups expire on their own, and a documented restore brings any backup back.

**Architecture:** A small `db-backup` service in `docker-compose.prod.yml` (image built from `postgres:16-alpine` plus `rclone` and `age`) runs busybox `crond`. Each hourly run takes a `pg_dump -Fc`, checks it with `pg_restore --list`, optionally encrypts it with `age`, uploads it with `rclone` to R2 under `hourly/`, copies it server-side to `daily/` (first backup of the day) and `monthly/` (first of the month), deletes backups past each tier's retention, and records the time of the last success for a healthcheck. `restore.sh` in the same image downloads, decrypts and restores a chosen backup.

**Tech Stack:** Docker Compose (VPS, host network), Postgres 16 client tools, rclone (S3 provider Cloudflare / Other), age, busybox crond and sh.

**Spec:** No separate design doc; the user skipped the design questions ("shuru koro"), then asked for hourly backups and R2-only production (no Garage) and approved tiered retention ("ok shuru koro"). Requirements are restated in Global Constraints.

## Global Constraints

- Backups go to a **separate private bucket** with its **own R2 API token** scoped to that bucket; never the media bucket.
- Schedule: every hour on the hour, Asia/Dhaka (`BACKUP_CRON`, default `0 * * * *`, `TZ=Asia/Dhaka`).
- Tiers and retention: `hourly/` kept `BACKUP_KEEP_HOURLY_HOURS` (default `48`), `daily/` kept `BACKUP_KEEP_DAILY_DAYS` (default `30`), `monthly/` kept `BACKUP_KEEP_MONTHLY_DAYS` (default `365`).
- Object key: `<BACKUP_PREFIX>/<tier>/<db>-<YYYYMMDD-HHMMSS>.dump[.age]`, `BACKUP_PREFIX` default `postgres`.
- Production uses R2 only: the `garage` service leaves `docker-compose.prod.yml`; its data volumes are never deleted by these changes.
- Format: `pg_dump -Fc` (compressed, restorable with `pg_restore`); a dump that fails `pg_restore --list` is never uploaded.
- Encryption: when `BACKUP_AGE_RECIPIENT` (an age public key) is set, upload only the `.age` file; the private key never lives on the server.
- Env names: `BACKUP_S3_ENDPOINT`, `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY`, `BACKUP_S3_BUCKET`, `BACKUP_S3_PROVIDER` (default `Cloudflare`), `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.
- Healthcheck: unhealthy when the last success is older than 26 hours.
- Scripts are POSIX `sh` with `set -eu`; no secrets in logs.
- No `git push`; any write to the `ecommerce` DB needs a backup first (restore tests only touch a throwaway DB).

## Review Focus

1. Upload or network failure halfway → the run must exit non-zero, leave no partial object counted as a backup, and not update the last-success marker. Task 2's test makes the bucket unreachable and checks the marker is unchanged.
2. Retention must never delete the backup that was just made, nor anything outside `BACKUP_PREFIX`, and must keep each tier's own window. Task 2's test plants old objects in every tier and one outside the prefix.
3. A restore aimed at the live database by mistake → `restore.sh` refuses unless `--target-db` is given and differs from `PGDATABASE`, or `--force` is passed. Task 3's test checks the refusal.
4. Encrypted backup restored without the key → clear error, no partial restore. Task 3's test runs restore without `AGE_IDENTITY`.
5. Two runs overlapping (slow dump + cron) → second run exits early via a lock. Task 2's test starts two runs at once.

---

### Task 1: Backup image and `backup.sh`

**Files:**
- Create: `docker/db-backup/Dockerfile` (`FROM postgres:16-alpine`, `apk add --no-cache rclone age tzdata`, copies scripts, `CMD ["/usr/local/bin/entrypoint.sh"]`)
- Create: `docker/db-backup/backup.sh`, `docker/db-backup/entrypoint.sh` (writes the crontab from `BACKUP_CRON`, runs `crond -f`)
- Create: `docker/db-backup/healthcheck.sh` (exit 1 when `/var/lib/db-backup/last-success` is missing or older than 26h)
- Test: `scripts/test-db-backup.sh` (end-to-end against local Garage and Postgres)

**Interfaces:**
- Produces: `backup.sh` (no args) exits 0 on success and prints `uploaded <key> (<bytes> bytes)`; rclone remote is configured purely from env (`RCLONE_CONFIG_R2_TYPE=s3`, `RCLONE_CONFIG_R2_PROVIDER`, `..._ENDPOINT`, `..._ACCESS_KEY_ID`, `..._SECRET_ACCESS_KEY`, `RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true`), remote name `r2:`.

- [ ] **Step 1: Write the failing test** `scripts/test-db-backup.sh` (case "backup uploads a valid dump"): creates bucket `db-backups-test` in local Garage with its own key, builds the image, runs `backup.sh` once in a container (host network, env pointing at local Postgres `ecommerce` and Garage), then asserts: exit 0; exactly one object under `postgres/` named `ecommerce-YYYYMMDD-HHMMSS.dump`; downloading it and running `pg_restore --list` succeeds; `last-success` marker exists.
- [ ] **Step 2:** Run `bash scripts/test-db-backup.sh` → FAIL (image/scripts missing).
- [ ] **Step 3:** Implement Dockerfile, `backup.sh` (lock with `flock`-free `mkdir` lock dir; dump to temp; `pg_restore --list`; optional `age -r`; `rclone copyto`; verify remote size with `rclone size --json`; then retention; then marker), `entrypoint.sh`, `healthcheck.sh`.
- [ ] **Step 4:** Run the test → PASS.
- [ ] **Step 5:** Commit `feat(ops): nightly Postgres backup container`.

### Task 2: Failure, retention and lock behaviour

**Files:**
- Modify: `docker/db-backup/backup.sh`
- Test: `scripts/test-db-backup.sh` (new cases)

- [ ] **Step 1: Add failing cases:**
  - "tiers": first run of a day/month → the new backup exists in `hourly/`, `daily/` and `monthly/`; a second run the same day → only `hourly/` gains an object.
  - "retention": plant (mtime via `rclone touch -t`) `hourly/` 3 days old, `daily/` 40 and 10 days old, `monthly/` 400 and 100 days old, and `other/keep.txt` 400 days old; run → removed: hourly 3d, daily 40d, monthly 400d; kept: daily 10d, monthly 100d, `other/keep.txt`, and the new backups.
  - "upload failure": run with `BACKUP_S3_ENDPOINT=http://127.0.0.1:1` → exit non-zero, `last-success` unchanged (compare mtime before/after).
  - "lock": start two runs concurrently → one prints `another backup is running` and exits 0 without uploading; total new objects = 1.
  - "encryption": with `BACKUP_AGE_RECIPIENT` set from a test key → uploaded key ends in `.dump.age`, no plain `.dump` uploaded by that run, and `age -d -i key | pg_restore --list -` succeeds.
- [ ] **Step 2:** Run → the new cases FAIL.
- [ ] **Step 3:** Implement (tier copy with remote-to-remote `rclone copyto` when `rclone lsf` shows no object for today/this month in that tier; retention with `rclone delete r2:$BUCKET/$PREFIX/<tier> --min-age <age>` per tier, run only after a verified upload).
- [ ] **Step 4:** Run → all PASS.
- [ ] **Step 5:** Commit `feat(ops): backup retention, lock and encryption`.

### Task 3: `restore.sh`

**Files:**
- Create: `docker/db-backup/restore.sh` — usage: `restore.sh [<key>|latest] --target-db <name> [--force]`; `latest` picks the newest object in `hourly/` (any `<tier>/<file>` key is also accepted); decrypts with `AGE_IDENTITY` (path to the private key file mounted at restore time) when the key ends in `.age`; creates the target DB if missing; `pg_restore --no-owner --clean --if-exists -d <target>`.
- Test: `scripts/test-db-backup.sh` (new cases)

- [ ] **Step 1: Add failing cases:**
  - "restore latest into a new DB": restore into `ecommerce_restore_test` → table row counts for `stores`, `products`, `categories`, `orders` equal the source; then drop the DB.
  - "refuses the live DB": `restore.sh latest --target-db ecommerce` without `--force` → non-zero, message contains `refusing`.
  - "encrypted without key": restore an `.age` backup with no `AGE_IDENTITY` → non-zero, message contains `AGE_IDENTITY`, target DB not created.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(ops): restore script for R2 database backups`.

### Task 4: Compose service, env example, docs, ADR

**Files:**
- Modify: `docker-compose.prod.yml` (service `db-backup`: build `docker/db-backup`, `network_mode: host`, `env_file: .env.production`, `environment: PGHOST=127.0.0.1, PGUSER/PGPASSWORD/PGDATABASE=ecommerce, TZ=Asia/Dhaka`, volume `db_backup_state:/var/lib/db-backup`, `healthcheck: /usr/local/bin/healthcheck.sh` every 30m, `depends_on: postgres`, `restart: unless-stopped`)
- Modify: `docker-compose.prod.yml` remove the `garage` service, the app's `depends_on: garage` and the `garage_*` volume declarations (Docker keeps existing volumes on the VPS until someone runs `docker volume rm`)
- Modify: `scripts/deploy.sh` (drop the Garage first-time setup notes, point to `docs/deploy/cloudflare-r2.md` and `docs/deploy/db-backups.md`; ship the backup image if the script only ships prebuilt images — check and rule)
- Modify: `.env.example` (BACKUP_* block, commented)
- Create: `docs/deploy/db-backups.md` (create bucket + token; optional age key pair kept off the server; set env; check `docker compose ps` health; run a backup now; restore drill into a scratch DB; disaster restore steps)
- Create: `docs/adr/0003-database-backups-to-r2.md`

- [ ] **Step 1:** `docker compose -f docker-compose.prod.yml config` → valid.
- [ ] **Step 2:** Bring the service up locally with a throwaway env file pointing at local Garage (stand-in for R2), `BACKUP_CRON="* * * * *"`; within 2 minutes an object appears and `docker inspect` health becomes `healthy`. Stop and remove the test container and volume.
- [ ] **Step 3:** Commit `docs(ops): backup service, env and restore runbook`.

### Task 5: Cleanup and final check

- [ ] **Step 1:** Remove the local test bucket and key from Garage; `bash scripts/test-db-backup.sh` re-creates them, so it stays runnable.
- [ ] **Step 2:** Full `bash scripts/test-db-backup.sh` → all cases PASS; `npm test` still green.
