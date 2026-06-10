import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const ENDPOINT =
  process.env.S3_ENDPOINT ||
  process.env.RUSTFS_ENDPOINT ||
  "http://localhost:3900";

const ACCESS_KEY =
  process.env.S3_ACCESS_KEY || process.env.RUSTFS_ACCESS_KEY || "";

const SECRET_KEY =
  process.env.S3_SECRET_KEY || process.env.RUSTFS_SECRET_KEY || "";

const REGION = process.env.S3_REGION || "garage";

export const BUCKET =
  process.env.S3_BUCKET || process.env.RUSTFS_BUCKET || "ecommerce-uploads";

// When a real CDN URL is configured, use it directly. Otherwise serve through the
// Next.js /api/media proxy so no public bucket access or /etc/hosts is needed in dev.
const CDN_URL = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");

const s3Client = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true,
});

export function publicUrlFor(key: string): string {
  if (CDN_URL) return `${CDN_URL}/${key}`;
  return `/api/media/${key}`;
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return publicUrlFor(key);
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function getFile(key: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
  return response.Body;
}

export function generateFileKey(
  storeId: string,
  folder: string,
  filename: string
): string {
  const id = randomBytes(8).toString("hex");
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${storeId}/${folder}/${id}.${safeExt}`;
}

export function variantKey(originalKey: string, suffix: string): string {
  const dot = originalKey.lastIndexOf(".");
  const base = dot >= 0 ? originalKey.slice(0, dot) : originalKey;
  return `${base}-${suffix}.webp`;
}

export interface StoredBlob {
  key: string;
  size: number;
  lastModified?: Date;
}

/**
 * Lists all objects in the bucket, optionally under a key prefix (e.g. `${storeId}/`).
 * Handles pagination via ContinuationToken.
 */
export async function listFiles(prefix?: string): Promise<StoredBlob[]> {
  const out: StoredBlob[] = [];
  let token: string | undefined;
  do {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      out.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified,
      });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/**
 * Inverse of publicUrlFor: converts a stored URL or bare key back to an object key.
 * Returns null for external URLs (not served from our bucket) or empty/data values.
 */
export function urlToKey(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v || v.startsWith("data:")) return null;

  // Next.js media proxy form: /api/media/{key}
  const mediaIdx = v.indexOf("/api/media/");
  if (mediaIdx >= 0) {
    return decodeURIComponent(v.slice(mediaIdx + "/api/media/".length)) || null;
  }

  // CDN form: {CDN_URL}/{key}
  if (CDN_URL && v.startsWith(`${CDN_URL}/`)) {
    return decodeURIComponent(v.slice(CDN_URL.length + 1)) || null;
  }

  // Bare key form: {storeUuid}/folder/file
  if (!v.includes("://") && /^[0-9a-f-]{36}\//i.test(v)) {
    return v;
  }

  return null;
}

const VARIANT_SUFFIXES = ["w400", "w800", "w1200", "w2000"] as const;

/** Best-effort delete of an object key plus its responsive variants. Never throws. */
export async function deleteBlobWithVariants(key: string): Promise<void> {
  await Promise.allSettled([
    deleteFile(key),
    ...VARIANT_SUFFIXES.map((s) => deleteFile(variantKey(key, s))),
  ]);
}

/**
 * Best-effort cleanup of blobs that are no longer referenced.
 *
 * Resolves each value in `removed` to an object key (via urlToKey) and deletes it
 * along with its variants — unless the same key still appears in `keep` (i.e. the
 * image was retained across an update). Non-bucket URLs and empty values are ignored.
 * Never throws; intended to run after a successful DB write.
 */
export async function deleteUnreferencedBlobs(
  removed: Iterable<string>,
  keep: Iterable<string> = []
): Promise<void> {
  const keepKeys = new Set<string>();
  for (const v of keep) {
    const k = urlToKey(v);
    if (k) keepKeys.add(k);
  }
  const toDelete = new Set<string>();
  for (const v of removed) {
    const k = urlToKey(v);
    if (k && !keepKeys.has(k)) toDelete.add(k);
  }
  await Promise.allSettled(
    Array.from(toDelete).map((k) => deleteBlobWithVariants(k))
  );
}

/** Best-effort delete of every object under a key prefix (e.g. `${storeId}/`). Returns count deleted. */
export async function deleteBlobsByPrefix(prefix: string): Promise<number> {
  const blobs = await listFiles(prefix);
  const res = await Promise.allSettled(blobs.map((b) => deleteFile(b.key)));
  return res.filter((r) => r.status === "fulfilled").length;
}
