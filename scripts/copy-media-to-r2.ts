import "dotenv/config";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Copies every media object from the current bucket (RustFS/Garage) to the
 * Cloudflare R2 bucket, keeping keys, Content-Type and Cache-Control. Keys that
 * already exist in R2 with the same size are skipped, so it can be re-run after
 * an interruption.
 *
 * Source: SRC_S3_ENDPOINT, SRC_S3_ACCESS_KEY, SRC_S3_SECRET_KEY, SRC_S3_BUCKET, SRC_S3_REGION
 * Destination (R2): S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (S3_REGION=auto)
 *
 * Usage:
 *   npx tsx scripts/copy-media-to-r2.ts --dry-run
 *   npx tsx scripts/copy-media-to-r2.ts [--prefix=<storeId>/]
 */

function client(prefix: "SRC_S3_" | "S3_"): { s3: S3Client; bucket: string; label: string } {
  const env = (name: string) => process.env[prefix + name];
  const endpoint = env("ENDPOINT");
  const bucket = env("BUCKET");
  if (!endpoint || !bucket || !env("ACCESS_KEY") || !env("SECRET_KEY")) {
    console.error(`Missing ${prefix}ENDPOINT / ${prefix}BUCKET / ${prefix}ACCESS_KEY / ${prefix}SECRET_KEY.`);
    process.exit(1);
  }
  const s3 = new S3Client({
    endpoint,
    region: env("REGION") || "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: env("ACCESS_KEY")!, secretAccessKey: env("SECRET_KEY")! },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { s3, bucket, label: `${endpoint}/${bucket}` };
}

async function existingSize(s3: S3Client, bucket: string, key: string): Promise<number | null> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const prefix = args.find((a) => a.startsWith("--prefix="))?.slice("--prefix=".length);
  const src = client("SRC_S3_");
  const dst = client("S3_");
  console.log(`${dryRun ? "[dry run] " : ""}${src.label} → ${dst.label}`);

  let token: string | undefined;
  let copied = 0, skipped = 0, bytes = 0;
  do {
    const page = await src.s3.send(
      new ListObjectsV2Command({ Bucket: src.bucket, Prefix: prefix, ContinuationToken: token })
    );
    for (const obj of page.Contents ?? []) {
      const key = obj.Key!;
      const size = obj.Size ?? 0;
      if ((await existingSize(dst.s3, dst.bucket, key)) === size) {
        skipped++;
        continue;
      }
      copied++;
      bytes += size;
      if (dryRun) continue;
      const got = await src.s3.send(new GetObjectCommand({ Bucket: src.bucket, Key: key }));
      await dst.s3.send(
        new PutObjectCommand({
          Bucket: dst.bucket,
          Key: key,
          Body: await got.Body!.transformToByteArray(),
          ContentType: got.ContentType,
          CacheControl: got.CacheControl ?? "public, max-age=31536000, immutable",
        })
      );
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  const mb = (bytes / 1024 / 1024).toFixed(1);
  console.log(`${dryRun ? "Would copy" : "Copied"} ${copied} object(s), ${mb} MB; ${skipped} already in place.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
