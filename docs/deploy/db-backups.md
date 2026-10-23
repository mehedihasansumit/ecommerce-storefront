# Database backups on Cloudflare R2

The `db-backup` service in `docker-compose.prod.yml` backs up the production
Postgres database every hour to a private R2 bucket:

| Folder | What | Kept |
|---|---|---|
| `postgres/hourly/` | every backup | 48 hours |
| `postgres/daily/` | first backup of each day | 30 days |
| `postgres/monthly/` | first backup of each month | 365 days |

Each run: `pg_dump -Fc` → checked with `pg_restore --list` → (optionally
encrypted) → uploaded → remote size checked → old backups expired, each folder
only within itself. A failed run exits with an error and does not count as a
success. The container turns **unhealthy** when no backup has succeeded for 26
hours.

At worst the last hour of data is lost (orders placed since the last backup).

## 1. Bucket and token (Cloudflare dashboard)

1. **R2 → Create bucket**, e.g. `lour-haus-db-backups`. Do not connect a public
   domain to it, and do not use the media bucket.
2. **R2 → Manage API tokens → Create API token**: *Object Read & Write*, limited
   to this bucket only. Keep the Access Key ID and Secret.

## 2. Optional: encrypt the backups

With encryption, someone who gets the bucket key still cannot read customer
data, and the server cannot decrypt its own backups.

On your own computer (not the server):

```bash
age-keygen -o lour-haus-backup.key     # prints "Public key: age1..."
```

Put the **public** key on the server (`BACKUP_AGE_RECIPIENT`). Keep
`lour-haus-backup.key` in a password manager and one more safe place: without
it the backups cannot be restored.

## 3. Settings in `.env.backup`

The backup container reads its own file, `.env.backup`, next to
`docker-compose.prod.yml` on the server. Do not put these in `.env.production`:
the app must not hold a key that can delete backups.

```bash
touch .env.backup && chmod 600 .env.backup
```

```env
BACKUP_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
BACKUP_S3_ACCESS_KEY=<backup token Access Key ID>
BACKUP_S3_SECRET_KEY=<backup token Secret>
BACKUP_S3_BUCKET=lour-haus-db-backups
BACKUP_AGE_RECIPIENT=age1...           # optional
```

Optional overrides: `BACKUP_CRON` (default `0 * * * *`),
`BACKUP_KEEP_HOURLY_HOURS` (48), `BACKUP_KEEP_DAILY_DAYS` (30),
`BACKUP_KEEP_MONTHLY_DAYS` (365), `BACKUP_PREFIX` (`postgres`).

`scripts/deploy.sh` builds the backup image on the server and starts it.

## 4. Check it works

```bash
docker compose -f docker-compose.prod.yml exec db-backup /usr/local/bin/backup.sh   # run one now
docker compose -f docker-compose.prod.yml ps db-backup                                # "healthy" after the first success
docker compose -f docker-compose.prod.yml logs --tail 20 db-backup
```

## 5. Restore drill (do this once a month)

Restore the newest backup into a scratch database and look at it. This never
touches the live database.

```bash
docker compose -f docker-compose.prod.yml exec db-backup \
  /usr/local/bin/restore.sh latest --target-db ecommerce_restore_check
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ecommerce -d ecommerce_restore_check -c "select count(*) from orders"
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ecommerce -d postgres -c "drop database ecommerce_restore_check"
```

For an encrypted backup, copy the private key to the server only for the drill
and pass it in, then delete it:

```bash
docker compose -f docker-compose.prod.yml run --rm -v "$PWD/backup.key:/k/key.txt:ro" \
  -e AGE_IDENTITY=/k/key.txt db-backup /usr/local/bin/restore.sh latest --target-db ecommerce_restore_check
rm backup.key
```

A specific backup: pass its folder and file instead of `latest`, e.g.
`daily/ecommerce-20261023-000003.dump`.

## 6. Disaster recovery (the live database is lost or damaged)

Restore into a **new** database, check it, then swap names. Restoring over the
live database is not a clean rollback: tables created after the backup (for
example by a later migration) would stay.

1. Stop the app so nothing writes: `docker compose -f docker-compose.prod.yml stop app`.
2. Restore the chosen backup into a new database (`latest`, or an older one from
   `hourly/` or `daily/` to go back to before a mistake):
   ```bash
   docker compose -f docker-compose.prod.yml exec db-backup \
     /usr/local/bin/restore.sh latest --target-db ecommerce_restored
   ```
3. Check it (`select count(*) from orders` etc.), then swap:
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres psql -U ecommerce -d postgres -c \
     "alter database ecommerce rename to ecommerce_broken; alter database ecommerce_restored rename to ecommerce;"
   ```
4. Start the app: `docker compose -f docker-compose.prod.yml start app`. Drop
   `ecommerce_broken` once you are sure.

`restore.sh` runs in one transaction: if it fails, the target is left as it
was. It refuses the live database, and any database that already has tables,
unless you add `--force`.

## Garage

Production no longer runs Garage. The compose file does not define it, but
`docker compose up -d` does not stop a container it no longer knows, and Docker
keeps its volumes. Until it is removed it still listens on ports 3900-3904:
keep those blocked in the firewall. Do not run `docker compose up
--remove-orphans` or `down --remove-orphans` before the media copy to R2 is
verified. Copy the media to R2 first (`docs/deploy/cloudflare-r2.md`, step 2),
then remove it:

```bash
docker stop ecommerce-garage && docker rm ecommerce-garage
docker volume ls | grep garage      # delete these only after checking the R2 copy
```
