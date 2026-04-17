import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  uploadFile,
  deleteFile,
  generateFileKey,
  variantKey,
  publicUrlFor,
} from "@/shared/lib/storage";
import { getAdminDbUser } from "@/shared/lib/auth";
import { canAccessStore } from "@/shared/lib/permissions";
import {
  errorResponse,
  unauthorizedResponse,
  storeAccessDeniedResponse,
} from "@/shared/lib/api-response";

const ALLOWED_FOLDERS = ["products", "categories", "stores", "banners"] as const;
type Folder = (typeof ALLOWED_FOLDERS)[number];

const VARIANT_WIDTHS = [400, 800, 1200] as const;

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const form = await request.formData();
    const file = form.get("file");
    const storeId = String(form.get("storeId") || "");
    const folder = String(form.get("folder") || "") as Folder;

    if (!(file instanceof File)) return errorResponse("file is required", 400);
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return errorResponse("invalid folder", 400);
    }
    if (!canAccessStore(admin, storeId)) return storeAccessDeniedResponse();

    if (file.size > MAX_BYTES) {
      return errorResponse(`file too large (max ${MAX_BYTES} bytes)`, 413);
    }
    if (!file.type.startsWith("image/")) {
      return errorResponse("only images are allowed", 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const image = sharp(buffer, { failOn: "error" }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      return errorResponse("unreadable image", 400);
    }

    const originalKey = generateFileKey(storeId, folder, file.name);
    const originalUrl = await uploadFile(originalKey, buffer, file.type);

    const variants: Record<string, string> = {};
    for (const w of VARIANT_WIDTHS) {
      if (w >= metadata.width) continue;
      const vKey = variantKey(originalKey, `w${w}`);
      const vBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await uploadFile(vKey, vBuffer, "image/webp");
      variants[`w${w}`] = publicUrlFor(vKey);
    }

    return NextResponse.json(
      {
        url: originalUrl,
        key: originalKey,
        width: metadata.width,
        height: metadata.height,
        variants,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload failed";
    return errorResponse(message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const key = request.nextUrl.searchParams.get("key");
    if (!key) return errorResponse("key is required", 400);

    const storeId = key.split("/")[0];
    if (!canAccessStore(admin, storeId)) return storeAccessDeniedResponse();

    await deleteFile(key);
    await Promise.allSettled(
      VARIANT_WIDTHS.map((w) => deleteFile(variantKey(key, `w${w}`)))
    );

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("delete failed", 500);
  }
}
