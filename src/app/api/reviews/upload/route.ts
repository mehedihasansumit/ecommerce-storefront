import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadFile, generateFileKey } from "@/shared/lib/storage";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { publicErrorMessage } from "@/shared/lib/api-response";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { RATE_RULES, checkRateLimits, tooManyRequestsResponse } from "@/shared/lib/rate-limit";
import { CUSTOMER_IMAGE_TYPES, isAllowedImage } from "@/shared/lib/image-type";

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;
const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 70;

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Uploads cost storage; one customer can't fill the bucket.
    const limited = await checkRateLimits([[RATE_RULES.uploadUser, (payload as JwtCustomerPayload).userId]]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "only images are allowed" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `file too large (max ${MAX_BYTES} bytes)` }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Check the real file type from its bytes before any image library reads it:
    // shoppers can't send SVG or HEIC, whose decoders are where image exploits live.
    if (!isAllowedImage(buffer, CUSTOMER_IMAGE_TYPES)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, WebP, GIF or AVIF image" }, { status: 415 });
    }

    // Compress to a single small webp: cap longest side, strip metadata via rotate.
    const out = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const key = generateFileKey(storeId, "reviews", "review.webp");
    const url = await uploadFile(key, out, "image/webp");

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (err) {
    const message = publicErrorMessage(err) ?? "upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
