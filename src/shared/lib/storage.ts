import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY || "",
    secretAccessKey: process.env.RUSTFS_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.RUSTFS_BUCKET || "ecommerce-uploads";

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
    })
  );

  const endpoint = process.env.RUSTFS_ENDPOINT || "http://localhost:9000";
  return `${endpoint}/${BUCKET}/${key}`;
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
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${storeId}/${folder}/${timestamp}-${sanitized}`;
}
