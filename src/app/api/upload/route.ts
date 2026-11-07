import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  uploadFile,
  generateFileKey,
  variantKey,
  publicUrlFor,
  deleteBlobWithVariants,
  VARIANT_WIDTHS,
  AVIF_VARIANT_WIDTHS,
} from "@/shared/lib/storage";
import { getAdminDbUser } from "@/shared/lib/auth";
import { canAccessStore, hasPermission, PERMISSIONS, type Permission } from "@/shared/lib/permissions";
import {
  errorResponse,
  unauthorizedResponse,
  storeAccessDeniedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";

const ALLOWED_FOLDERS = ["products", "categories", "stores", "banners"] as const;
type Folder = (typeof ALLOWED_FOLDERS)[number];

/** Who may add or remove images in each folder: the people who edit what they belong to. */
const FOLDER_PERMISSIONS: Record<Folder, { upload: Permission[]; remove: Permission[] }> = {
  products: {
    upload: [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT],
    remove: [PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE],
  },
  categories: {
    upload: [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT],
    remove: [PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE],
  },
  stores: { upload: [PERMISSIONS.STORES_EDIT], remove: [PERMISSIONS.STORES_EDIT] },
  banners: { upload: [PERMISSIONS.STORES_EDIT], remove: [PERMISSIONS.STORES_EDIT] },
};

type Admin = NonNullable<Awaited<ReturnType<typeof getAdminDbUser>>>;
const hasAny = (admin: Admin, permissions: Permission[]) =>
  permissions.some((p) => hasPermission(admin, p));

/**
 * An image this route uploaded: `<storeId>/<folder>/<file>`, nothing else. Keeps
 * DELETE away from avatars, review photos and anything outside these folders.
 */
const UPLOAD_KEY = new RegExp(
  `^([0-9a-f-]{36})/(${ALLOWED_FOLDERS.join("|")})/([A-Za-z0-9_-]+\\.[a-z0-9]{1,8})$`,
  "i",
);

// Longest side of the stored "full" image (feeds hover-zoom + lightbox). Capped
// and re-encoded to WebP so a 4000px camera photo doesn't ship as a 1-2MB blob.
const FULL_MAX = 2048;

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const form = await request.formData();
    const file = form.get("file");
    const storeId = String(form.get("storeId") || "");
    const folder = String(form.get("folder") || "") as Folder;
    const kind = String(form.get("kind") || "");

    if (!(file instanceof File)) return errorResponse("file is required", 400);
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return errorResponse("invalid folder", 400);
    }
    if (!canAccessStore(admin, storeId)) return storeAccessDeniedResponse();
    if (!hasAny(admin, FOLDER_PERMISSIONS[folder].upload)) {
      return forbiddenResponse(`Missing permission to upload ${folder} images`);
    }

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

    if (kind === "favicon") {
      const SIZE = 256;
      const out = await sharp(buffer)
        .rotate()
        .resize(SIZE, SIZE, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      const key = generateFileKey(storeId, folder, "favicon.png");
      const url = await uploadFile(key, out, "image/png");
      return NextResponse.json(
        { url, key, width: SIZE, height: SIZE, variants: {}, blurDataURL: "" },
        { status: 201 }
      );
    }

    // Stored "full" image: capped + re-encoded to WebP (replaces the raw original).
    const originalKey = generateFileKey(storeId, folder, "image.webp");
    const fullBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const fullMeta = await sharp(fullBuffer).metadata();
    const fullWidth = fullMeta.width ?? metadata.width;
    const fullHeight = fullMeta.height ?? metadata.height;
    const originalUrl = await uploadFile(originalKey, fullBuffer, "image/webp");

    const [variantsResult, blurBuffer] = await Promise.all([
      (async () => {
        const variants: Record<string, string> = {};
        for (const w of VARIANT_WIDTHS) {
          if (w >= fullWidth!) continue;
          const vKey = variantKey(originalKey, `w${w}`);
          const vBuffer = await sharp(buffer)
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          await uploadFile(vKey, vBuffer, "image/webp");
          variants[`w${w}`] = publicUrlFor(vKey);
        }
        if (folder === "banners") {
          for (const w of AVIF_VARIANT_WIDTHS) {
            if (w >= fullWidth!) continue;
            const aKey = variantKey(originalKey, `w${w}`, "avif");
            const aBuffer = await sharp(buffer)
              .rotate()
              .resize({ width: w, withoutEnlargement: true })
              .avif({ quality: 55 })
              .toBuffer();
            await uploadFile(aKey, aBuffer, "image/avif");
            variants[`avif${w}`] = publicUrlFor(aKey);
          }
        }
        return variants;
      })(),
      sharp(buffer)
        .rotate()
        .resize({ width: 24, withoutEnlargement: true })
        .webp({ quality: 50 })
        .toBuffer(),
    ]);

    const blurDataURL = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

    return NextResponse.json(
      {
        url: originalUrl,
        key: originalKey,
        width: fullWidth,
        height: fullHeight,
        variants: variantsResult,
        blurDataURL,
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

    const match = UPLOAD_KEY.exec(key);
    if (!match) return errorResponse("invalid key", 400);
    const [, storeId, folder] = match;
    if (!canAccessStore(admin, storeId)) return storeAccessDeniedResponse();
    if (!hasAny(admin, FOLDER_PERMISSIONS[folder.toLowerCase() as Folder].remove)) {
      return forbiddenResponse(`Missing permission to delete ${folder} images`);
    }

    await deleteBlobWithVariants(key);

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("delete failed", 500);
  }
}
