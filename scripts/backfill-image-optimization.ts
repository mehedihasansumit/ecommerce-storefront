import "dotenv/config";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { productImages, products } from "../src/db/schema";
import {
  getFile,
  uploadFile,
  variantKey,
  publicUrlFor,
  urlToKey,
} from "../src/shared/lib/storage";

/**
 * Backfill: re-encode already-stored product images to capped WebP and (for
 * gallery images) regenerate responsive variants + blur placeholder.
 *
 * Why: images uploaded before the upload-pipeline optimization are stored as raw
 * 1-2MB originals. This re-processes them in place — the storage KEY is unchanged,
 * so existing URLs keep working; we just overwrite the blob with a smaller WebP and
 * refresh the DB metadata (variants / blur / dimensions).
 *
 * Idempotent. Re-running on an already-optimized image is a cheap no-op re-encode.
 *
 * Keep these constants in sync with src/app/api/upload/route.ts.
 *
 * Usage:
 *   npm run backfill:images            # process everything
 *   npm run backfill:images -- --dry   # report only, no writes
 *   npm run backfill:images -- --force # re-process even if already optimized
 */

const VARIANT_WIDTHS = [400, 800, 1200, 2000] as const;
const FULL_MAX = 2048;

const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

function kb(bytes: number) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function fetchBytes(key: string): Promise<Buffer | null> {
  try {
    const body = await getFile(key);
    if (!body) return null;
    const arr = await body.transformToByteArray();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

/** Re-encode + cap a source buffer to the stored "full" WebP. */
async function encodeFull(buffer: Buffer) {
  const out = await sharp(buffer)
    .rotate()
    .resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const meta = await sharp(out).metadata();
  return { out, width: meta.width ?? 0, height: meta.height ?? 0 };
}

async function buildVariants(buffer: Buffer, key: string, fullWidth: number) {
  const variants: Record<string, string> = {};
  for (const w of VARIANT_WIDTHS) {
    if (w >= fullWidth) continue;
    const vBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    if (!DRY) await uploadFile(variantKey(key, `w${w}`), vBuffer, "image/webp");
    variants[`w${w}`] = publicUrlFor(variantKey(key, `w${w}`));
  }
  return variants;
}

async function makeBlur(buffer: Buffer) {
  const b = await sharp(buffer)
    .rotate()
    .resize({ width: 24, withoutEnlargement: true })
    .webp({ quality: 50 })
    .toBuffer();
  return `data:image/webp;base64,${b.toString("base64")}`;
}

let processed = 0;
let skipped = 0;
let failed = 0;
let savedBytes = 0;

/** Re-process one gallery image row (full + variants + blur, updates DB). */
async function processGalleryImage(row: typeof productImages.$inferSelect) {
  const key = row.key || urlToKey(row.url);
  if (!key) {
    skipped++;
    return; // external URL — not ours
  }

  const src = await fetchBytes(key);
  if (!src) {
    console.warn(`  ! fetch failed: ${key}`);
    failed++;
    return;
  }

  const before = src.length;
  const { out, width, height } = await encodeFull(src);

  // Already optimized: re-encode isn't smaller AND metadata is fully populated.
  // (Dimensions alone aren't a signal — a small-dimension raw PNG can still be huge.)
  const hasMeta =
    !!row.variants &&
    Object.keys(row.variants as Record<string, string>).length > 0 &&
    !!row.blurDataUrl;
  if (out.length >= before && hasMeta && !FORCE) {
    skipped++;
    return;
  }
  // Re-encode variants/blur from the freshly-decoded source for best quality.
  const [variants, blurDataURL] = await Promise.all([
    buildVariants(src, key, width),
    makeBlur(src),
  ]);

  if (!DRY) {
    await uploadFile(key, out, "image/webp");
    await db
      .update(productImages)
      .set({ variants, blurDataUrl: blurDataURL, width, height })
      .where(eq(productImages.id, row.id));
  }

  savedBytes += Math.max(0, before - out.length);
  processed++;
  console.log(`  ✓ image ${key}  ${kb(before)} → ${kb(out.length)}`);
}

/** Re-process a product.thumbnail blob in place (no variants/blur columns). */
async function processThumbnail(url: string) {
  const key = urlToKey(url);
  if (!key) {
    skipped++;
    return;
  }
  const src = await fetchBytes(key);
  if (!src) {
    console.warn(`  ! fetch failed: ${key}`);
    failed++;
    return;
  }
  const before = src.length;
  const { out } = await encodeFull(src);
  if (out.length >= before && !FORCE) {
    // Already as small or smaller — skip the overwrite.
    skipped++;
    return;
  }
  if (!DRY) await uploadFile(key, out, "image/webp");
  savedBytes += Math.max(0, before - out.length);
  processed++;
  console.log(`  ✓ thumb ${key}  ${kb(before)} → ${kb(out.length)}`);
}

async function main() {
  console.log(
    `Backfill image optimization${DRY ? " [DRY RUN]" : ""}${FORCE ? " [FORCE]" : ""}\n`
  );

  console.log("Gallery images…");
  const images = await db.select().from(productImages);
  for (const row of images) await processGalleryImage(row);

  console.log("\nProduct thumbnails…");
  const rows = await db
    .select({ thumbnail: products.thumbnail })
    .from(products);
  const thumbs = new Set(
    rows.map((r) => r.thumbnail).filter((t): t is string => Boolean(t))
  );
  for (const url of thumbs) await processThumbnail(url);

  console.log(
    `\nDone. processed=${processed} skipped=${skipped} failed=${failed} saved≈${kb(savedBytes)}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
