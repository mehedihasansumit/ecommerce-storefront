/**
 * What an uploaded file really is, from its first bytes (its "magic number"),
 * not from the type the browser reports, which the uploader controls.
 *
 * Uploads are decoded by sharp/libvips. Each format goes through its own
 * decoder library (librsvg for SVG, libheif for HEIC/AVIF, ...), and those
 * libraries are where image exploits live. Checking the bytes first means a
 * customer upload only ever reaches the decoders for everyday photo formats.
 */
export type ImageType = "jpeg" | "png" | "gif" | "webp" | "avif" | "heic" | "svg";

/** Formats a shopper may upload (avatars, review photos). */
export const CUSTOMER_IMAGE_TYPES: readonly ImageType[] = ["jpeg", "png", "webp", "gif", "avif"];

/** Admins may also upload SVG (e.g. a store logo). */
export const ADMIN_IMAGE_TYPES: readonly ImageType[] = [...CUSTOMER_IMAGE_TYPES, "svg"];

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"]);

function ascii(buf: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...buf.subarray(start, end));
}

/** The ISO-BMFF ("ftyp") brands of an AVIF/HEIC file: major brand + compatible brands. */
function ftypBrands(buf: Uint8Array): string[] | null {
  if (buf.length < 16 || ascii(buf, 4, 8) !== "ftyp") return null;
  const size = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3];
  const end = Math.min(size > 0 ? size : 16, buf.length, 256);
  const brands = [ascii(buf, 8, 12)];
  for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(buf, i, i + 4));
  return brands;
}

export function detectImageType(buf: Uint8Array): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && ascii(buf, 0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (buf.length >= 6 && (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a")) return "gif";
  if (buf.length >= 12 && ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "webp";

  const brands = ftypBrands(buf);
  if (brands) {
    if (brands.includes("avif") || brands.includes("avis")) return "avif";
    if (brands.some((b) => HEIC_BRANDS.has(b)) || brands.includes("mif1") || brands.includes("msf1")) return "heic";
    return null;
  }

  // SVG is text: an optional BOM and whitespace, then an XML declaration, a comment or <svg.
  const head = new TextDecoder().decode(buf.subarray(0, 512)).replace(/^﻿/, "").trimStart().toLowerCase();
  if (head.startsWith("<svg") || ((head.startsWith("<?xml") || head.startsWith("<!--") || head.startsWith("<!doctype svg")) && head.includes("<svg"))) {
    return "svg";
  }
  return null;
}

/** True when the file's real type is one of `allowed`. */
export function isAllowedImage(buf: Uint8Array, allowed: readonly ImageType[]): boolean {
  const type = detectImageType(buf);
  return type !== null && allowed.includes(type);
}
