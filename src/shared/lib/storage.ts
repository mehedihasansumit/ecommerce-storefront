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

export const s3Client = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true,
  // Cloudflare R2 rejects some of the SDK's default flexible checksums; only send
  // them when an operation requires one (also fine for RustFS/Garage in dev).
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export function publicUrlFor(key: string): string {
  if (CDN_URL) return `${CDN_URL}/${key}`;
  return `/api/media/${key}`;
}

/** Inverse of publicUrlFor — extract the storage key from a public URL, or null. */
export function keyFromUrl(url: string): string | null {
  if (!url) return null;
  if (CDN_URL && url.startsWith(`${CDN_URL}/`)) return url.slice(CDN_URL.length + 1);
  const marker = "/api/media/";
  const idx = url.indexOf(marker);
  if (idx >= 0) return url.slice(idx + marker.length);
  return null;
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

export function variantKey(originalKey: string, suffix: string, ext: "webp" | "avif" = "webp"): string {
  const dot = originalKey.lastIndexOf(".");
  const base = dot >= 0 ? originalKey.slice(0, dot) : originalKey;
  return `${base}-${suffix}.${ext}`;
}

/** Widths of the WebP copies an upload gets (`variants.w600` → `<base>-w600.webp`). */
export const VARIANT_WIDTHS = [400, 600, 800, 1200, 2000] as const;
/**
 * Widths of the AVIF copies a banner upload also gets (`variants.avif600` →
 * `<base>-w600.avif`). Banners only: AVIF is slow to encode, and the hero photo is the
 * one image where the smaller file shortens Largest Contentful Paint.
 */
export const AVIF_VARIANT_WIDTHS = [400, 600, 800, 1200] as const;

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

/** Best-effort delete of an object key plus its responsive variants. Never throws. */
export async function deleteBlobWithVariants(key: string): Promise<void> {
  await Promise.allSettled([
    deleteFile(key),
    ...VARIANT_WIDTHS.map((w) => deleteFile(variantKey(key, `w${w}`))),
    ...AVIF_VARIANT_WIDTHS.map((w) => deleteFile(variantKey(key, `w${w}`, "avif"))),
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
  // A saved URL may point at a variant (a category keeps its `-w400.webp` copy);
  // resolve it to the original so the original and all its variants go together.
  const toOriginal = (v: string) => {
    const k = urlToKey(v);
    return k ? k.replace(/-w\d+\.(?:webp|avif)$/, ".webp") : null;
  };
  const keepKeys = new Set<string>();
  for (const v of keep) {
    const k = toOriginal(v);
    if (k) keepKeys.add(k);
  }
  const toDelete = new Set<string>();
  for (const v of removed) {
    const k = toOriginal(v);
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
