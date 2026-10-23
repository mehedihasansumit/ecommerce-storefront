# Media on Cloudflare R2

Production serves every upload (product and category images, banners, hero
videos, logos) straight from an R2 bucket on your own domain, through
Cloudflare's CDN. The Next.js server no longer streams media. Dev keeps using
local RustFS and the `/api/media` proxy.

## 1. Bucket and domain (Cloudflare dashboard)

1. **R2 → Create bucket**, e.g. `lour-haus-media`. Location: automatic.
2. **Bucket → Settings → Custom Domains → Connect Domain**, e.g.
   `media.example.com`. The domain must be on Cloudflare. Do not use the
   `r2.dev` URL in production: it is rate-limited and not cached.
3. **R2 → Manage API tokens → Create API token**: permission *Object Read &
   Write*, limited to this bucket. Keep the **Access Key ID**, **Secret Access
   Key**, and your **Account ID** (shown on the R2 overview page).

No CORS rule is needed: pages load media with plain `<img>` and `<video>` tags.
Uploads already carry `Cache-Control: public, max-age=31536000, immutable`, and
R2 answers range requests, so video seeking and Safari playback work.

## 2. Move the existing media

Run from a machine that can reach both the current storage and R2.

```bash
# Source = current RustFS/Garage, destination = R2
export SRC_S3_ENDPOINT=... SRC_S3_ACCESS_KEY=... SRC_S3_SECRET_KEY=... SRC_S3_BUCKET=ecommerce-uploads SRC_S3_REGION=garage
export S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com S3_ACCESS_KEY=... S3_SECRET_KEY=... S3_BUCKET=lour-haus-media S3_REGION=auto

npx tsx scripts/copy-media-to-r2.ts --dry-run   # counts and size
npx tsx scripts/copy-media-to-r2.ts             # safe to re-run; skips what is already there
```

## 3. Point stored links at the domain

Rows written before the switch hold `/api/media/<key>` links. Back up first,
then dry run, then run:

```bash
pg_dump -Fc "$DATABASE_URL" > before-r2.dump
S3_PUBLIC_URL=https://media.example.com npx tsx scripts/rewrite-media-urls.ts --allow-db=<db name> --dry-run
S3_PUBLIC_URL=https://media.example.com npx tsx scripts/rewrite-media-urls.ts --allow-db=<db name>
```

The script finds every text/jsonb column that holds `/api/media/`, rewrites
those values in one transaction, and leaves external URLs alone. A second run
changes nothing.

## 4. Deploy with the R2 settings

```env
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<Access Key ID>
S3_SECRET_KEY=<Secret Access Key>
S3_BUCKET=lour-haus-media
S3_REGION=auto
S3_PUBLIC_URL=https://media.example.com
```

New uploads then get `https://media.example.com/<key>` links directly. Any
`/api/media/...` link that is still around keeps working: the proxy reads the
same keys from R2.

## Check

```bash
curl -sI https://media.example.com/<storeId>/banners/<file>.mp4 | grep -i "cf-cache-status\|cache-control"
curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-1023" https://media.example.com/<storeId>/banners/<file>.mp4   # 206
```

`cf-cache-status: HIT` on a second request means the CDN is serving it.
