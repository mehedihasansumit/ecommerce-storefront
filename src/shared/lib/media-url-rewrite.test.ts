import { describe, expect, it } from "vitest";
import { rewriteMediaUrls } from "./media-url-rewrite";

const BASE = "https://media.example.com";

describe("rewriteMediaUrls", () => {
  it("rewrites a proxied media path to the public base", () => {
    expect(rewriteMediaUrls("/api/media/s1/products/a.webp", BASE)).toBe(
      "https://media.example.com/s1/products/a.webp"
    );
  });

  it("rewrites inside objects and arrays", () => {
    expect(
      rewriteMediaUrls(
        { url: "/api/media/k.webp", variants: { w400: "/api/media/k-w400.webp" }, list: ["/api/media/v.mp4"] },
        BASE
      )
    ).toEqual({
      url: "https://media.example.com/k.webp",
      variants: { w400: "https://media.example.com/k-w400.webp" },
      list: ["https://media.example.com/v.mp4"],
    });
  });

  it("leaves external URLs, nulls and numbers alone", () => {
    expect(rewriteMediaUrls("https://images.unsplash.com/x.jpg", BASE)).toBe("https://images.unsplash.com/x.jpg");
    expect(rewriteMediaUrls(null, BASE)).toBeNull();
    expect(rewriteMediaUrls({ n: 3, ok: true }, BASE)).toEqual({ n: 3, ok: true });
  });

  it("is idempotent", () => {
    const once = rewriteMediaUrls("/api/media/k.webp", BASE);
    expect(rewriteMediaUrls(once, BASE)).toBe(once);
  });

  it("joins a base with a trailing slash using a single slash", () => {
    expect(rewriteMediaUrls("/api/media/k.webp", "https://media.example.com/")).toBe(
      "https://media.example.com/k.webp"
    );
  });

  it("rewrites an absolute proxy URL on the app's own host", () => {
    expect(rewriteMediaUrls("http://localhost:3000/api/media/k.webp", BASE)).toBe(
      "https://media.example.com/k.webp"
    );
  });
});
