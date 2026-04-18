import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || process.env.RUSTFS_ENDPOINT || "http://localhost:3900",
  region: process.env.S3_REGION || "garage",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.RUSTFS_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.RUSTFS_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || process.env.RUSTFS_BUCKET || "ecommerce-uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const result = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: objectKey })
    );

    const body = await result.Body!.transformToByteArray();

    return new NextResponse(body, {
      headers: {
        "Content-Type": result.ContentType ?? "application/octet-stream",
        "Cache-Control": result.CacheControl ?? "public, max-age=31536000, immutable",
        "Content-Length": String(result.ContentLength ?? body.byteLength),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
