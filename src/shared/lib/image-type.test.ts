import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ADMIN_IMAGE_TYPES, CUSTOMER_IMAGE_TYPES, detectImageType, isAllowedImage } from "./image-type";

const pixel = () => sharp({ create: { width: 4, height: 4, channels: 3, background: "#c00" } });
const svg = Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"></svg>');
/** The start of an iPhone HEIC file: an ftyp box with the "heic" brand. */
const heic = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from("ftypheic"),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from("mif1heic"),
]);

describe("detectImageType reads the real type from the bytes", () => {
  it("recognises real photos sharp writes", async () => {
    expect(detectImageType(await pixel().jpeg().toBuffer())).toBe("jpeg");
    expect(detectImageType(await pixel().png().toBuffer())).toBe("png");
    expect(detectImageType(await pixel().webp().toBuffer())).toBe("webp");
    expect(detectImageType(await pixel().gif().toBuffer())).toBe("gif");
    expect(detectImageType(await pixel().avif().toBuffer())).toBe("avif");
  });

  it("recognises SVG and HEIC", () => {
    expect(detectImageType(svg)).toBe("svg");
    expect(detectImageType(Buffer.from('﻿  <svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe("svg");
    expect(detectImageType(heic)).toBe("heic");
  });

  it("returns null for anything else", () => {
    expect(detectImageType(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(detectImageType(Buffer.from("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("who may upload what", () => {
  it("shoppers: everyday photo formats only, never SVG or HEIC", async () => {
    expect(isAllowedImage(await pixel().jpeg().toBuffer(), CUSTOMER_IMAGE_TYPES)).toBe(true);
    expect(isAllowedImage(svg, CUSTOMER_IMAGE_TYPES)).toBe(false);
    expect(isAllowedImage(heic, CUSTOMER_IMAGE_TYPES)).toBe(false);
  });

  it("admins may also upload SVG, but not HEIC", () => {
    expect(isAllowedImage(svg, ADMIN_IMAGE_TYPES)).toBe(true);
    expect(isAllowedImage(heic, ADMIN_IMAGE_TYPES)).toBe(false);
  });

  it("a file named .jpg that is really SVG is refused for shoppers", () => {
    // The browser-reported type is ignored; only the bytes count.
    expect(isAllowedImage(svg, CUSTOMER_IMAGE_TYPES)).toBe(false);
  });
});
