import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
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

const PUBLIC_URL = (process.env.S3_PUBLIC_URL || ENDPOINT).replace(/\/$/, "");

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
  return `${PUBLIC_URL}/${BUCKET}/${key}`;
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
