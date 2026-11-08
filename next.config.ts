import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

function patternFromEnv(url: string | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return { hostname: u.hostname, port: u.port };
  } catch {
    return null;
  }
}

const s3Pattern =
  patternFromEnv(process.env.S3_PUBLIC_URL) ||
  patternFromEnv(process.env.S3_ENDPOINT) ||
  patternFromEnv(process.env.RUSTFS_ENDPOINT);

// Images are never run through the Next.js optimizer: uploads already get 400/800px
// WebP variants (srcSet), served from the bucket's CDN domain (S3_PUBLIC_URL, e.g.
// Cloudflare R2) in production or the /api/media proxy in dev.

const nextConfig: NextConfig = {
  output: "standalone",
  // Data cache shared by every app instance via Redis (ADR 0005). Without
  // REDIS_URL it falls back to in-process memory. Next's own memory layer is off
  // so every read goes through the handler and sees other instances' expiries.
  cacheHandler: require.resolve("./cache-handler.mjs"),
  cacheMaxMemorySize: 0,
  experimental: {
    // Cloudflare caches storefront responses by URL only (it ignores `Vary: rsc`;
    // docs/deploy/cloudflare-page-cache.md). Next's router puts a hash of the
    // headers an RSC response depends on in `?_rsc=`; with this on, the server
    // checks that hash and redirects a mismatch, so nobody can store a response
    // for one set of headers under another's URL. Makes `?_rsc=` requests safe
    // to cache.
    validateRSCRequestHeaders: true,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...(s3Pattern
        ? [
            { protocol: "http" as const, hostname: s3Pattern.hostname, port: s3Pattern.port },
            { protocol: "https" as const, hostname: s3Pattern.hostname, port: s3Pattern.port },
          ]
        : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.freepik.com" },
      { protocol: "https", hostname: "static.vecteezy.com" },
    ],
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withNextIntl(nextConfig);
