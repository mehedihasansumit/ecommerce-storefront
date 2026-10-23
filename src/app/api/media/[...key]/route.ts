import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, s3Client } from "@/shared/lib/storage";
import { parseRange } from "@/shared/lib/media-range";

const IMMUTABLE = "public, max-age=31536000, immutable";

/** S3 SDK errors carry the HTTP status of the storage response. */
function storageStatus(err: unknown): number | undefined {
  return (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
}

// Dev and fallback path for media; production serves the same keys from the
// bucket's CDN domain (S3_PUBLIC_URL). Supports byte ranges (video playback and
// seeking) and ETag revalidation.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");
  const ifNoneMatch = req.headers.get("if-none-match") ?? undefined;
  const rangeHeader = req.headers.get("range");

  try {
    let range: { start: number; end: number } | null = null;
    let size: number | undefined;
    if (rangeHeader) {
      const head = await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: objectKey }));
      size = head.ContentLength ?? 0;
      const parsed = parseRange(rangeHeader, size);
      if (parsed === "unsatisfiable") {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
        });
      }
      range = parsed;
    }

    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        IfNoneMatch: range ? undefined : ifNoneMatch,
        Range: range ? `bytes=${range.start}-${range.end}` : undefined,
      })
    );

    // Stream the object straight through instead of buffering it in the Node
    // process — large banners/images no longer pin memory per request.
    const stream = result.Body!.transformToWebStream();

    const headers: Record<string, string> = {
      "Content-Type": result.ContentType ?? "application/octet-stream",
      "Cache-Control": result.CacheControl ?? IMMUTABLE,
      "Accept-Ranges": "bytes",
    };
    if (result.ETag) headers["ETag"] = result.ETag;
    if (result.ContentLength != null) {
      headers["Content-Length"] = String(result.ContentLength);
    }
    if (range) {
      headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
      return new NextResponse(stream as ReadableStream, { status: 206, headers });
    }
    return new NextResponse(stream as ReadableStream, { headers });
  } catch (err) {
    if (storageStatus(err) === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: ifNoneMatch ?? "", "Cache-Control": IMMUTABLE },
      });
    }
    return new NextResponse("Not found", { status: 404 });
  }
}
