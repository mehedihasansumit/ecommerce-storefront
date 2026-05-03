# Garage Setup & Configuration

Garage is an S3-compatible object storage system used for file uploads (product images, banners, etc.). Runs locally in Docker.

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Garage (S3 API) | 3900 | S3-compatible file storage API |
| Garage RPC | 3901 | Inter-node communication |
| Garage Web UI | 3902 | Web interface for stored files |
| Garage Admin | 3903 | Admin API (metrics, cluster management) |
| Filestash UI | 8334 | File browser interface |

## Start Garage

```bash
# From project root
docker compose -f docker/docker-compose.yml up -d

# Verify running
docker ps | grep garage
```

## Initialize Node

Must run once after first start:

```bash
# Get node ID
docker exec ecommerce-garage garage node id

# Copy the node ID from output, then configure via admin API
NODE_ID="<copied_from_above>"
ADMIN_TOKEN="104338fe224d67524c9e8c9b6215d48b8d6f049cc538d21775108a8e6bad0475"

curl -X POST http://localhost:3903/api/v0/admin/cluster/nodes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$NODE_ID\",
    \"zone\": \"dc1\",
    \"capacity\": 1000,
    \"tags\": [\"ecommerce\"]
  }"

# Verify cluster status
curl http://localhost:3903/api/v0/admin/cluster/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Create Bucket & Access Key

```bash
# Create bucket
docker exec ecommerce-garage garage bucket create ecommerce-uploads

# Create access key (returns access_key & secret_key)
docker exec ecommerce-garage garage key new --name admin

# Allow key to read/write bucket
docker exec ecommerce-garage garage bucket allow \
  --read ecommerce-uploads \
  --write ecommerce-uploads \
  --key admin
```

Use returned keys in `.env.local`:

```
RUSTFS_ACCESS_KEY=<access_key>
RUSTFS_SECRET_KEY=<secret_key>
```

## Configuration

**File:** `docker/garage/garage.toml`

Key settings:
- `s3_region = "garage"` — S3 region name
- `root_domain = ".s3.garage.localhost"` — Bucket domain pattern
- `rpc_secret` — Node authentication token (change in production)
- `admin_token` — Admin API access token
- `metadata_dir` & `data_dir` — Persistent storage paths (Docker volumes)

## Environment Variables

Add to `.env.local`:

```
RUSTFS_ENDPOINT=http://localhost:3900
RUSTFS_ACCESS_KEY=minioadmin
RUSTFS_SECRET_KEY=minioadmin
RUSTFS_BUCKET=ecommerce-uploads
RUSTFS_REGION=garage
```

## Usage in App

Garage is accessed via `@aws-sdk/client-s3` (S3-compatible). Use `src/shared/lib/storage.ts` helpers:

```typescript
import { uploadFile, deleteFile } from "@/shared/lib/storage";

// Upload
const url = await uploadFile(bucket, key, file);

// Delete
await deleteFile(bucket, key);
```

## Web Interfaces

- **Garage Admin:** `http://localhost:3903` (token-protected)
- **Filestash:** `http://localhost:8334` (file browser)
- **Bucket access:** `http://ecommerce-uploads.s3.garage.localhost:3900`

## Additional Buckets

To create more buckets after initial setup:

```bash
docker exec ecommerce-garage garage bucket create my-bucket
docker exec ecommerce-garage garage key new --name my-app
docker exec ecommerce-garage garage bucket allow --read my-bucket --write my-bucket --key my-app
```

Or use S3 client (after credentials created):

```bash
aws s3 mb s3://my-bucket \
  --endpoint-url http://localhost:3900 \
  --region garage
```

## Stop & Clean

```bash
# Stop
docker compose -f docker/docker-compose.yml down

# Remove volumes (delete all data)
docker compose -f docker/docker-compose.yml down -v
```

## Troubleshooting

**Connection refused on port 3900?**
- Check `docker ps` — container running?
- `docker logs garage` for errors
- Restart: `docker compose -f docker/docker-compose.yml restart garage`

**Files not persisting?**
- Verify Docker volumes exist: `docker volume ls | grep garage`
- Check `garage_meta` and `garage_data` are mounted

**S3 access denied?**
- Verify bucket exists: `garage bucket list` (in container)
- Check `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY` match config
- Default creds: `minioadmin` / `minioadmin`

## Production Notes

- Change `rpc_secret` and `admin_token` to random values
- Use persistent storage backend (not LMDB for scale)
- Enable encryption at rest
- Configure S3 bucket policies for data isolation
- Monitor via `/metrics` endpoint on admin port (3903)
