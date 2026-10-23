# Hourly Postgres backups to an S3-compatible bucket (Cloudflare R2 in production).
# See docs/deploy/db-backups.md.
FROM postgres:16-alpine

RUN apk add --no-cache rclone age tzdata

COPY lib.sh backup.sh restore.sh entrypoint.sh healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh && mkdir -p /var/lib/db-backup

ENV TZ=Asia/Dhaka \
    BACKUP_CRON="0 * * * *" \
    BACKUP_PREFIX=postgres \
    BACKUP_S3_PROVIDER=Cloudflare \
    BACKUP_S3_REGION=auto

HEALTHCHECK --interval=30m --timeout=10s --start-period=2h CMD /usr/local/bin/healthcheck.sh
CMD ["/usr/local/bin/entrypoint.sh"]
