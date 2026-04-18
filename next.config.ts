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

// When no CDN URL is configured, images are served through /api/media proxy (relative
// URLs). Next.js image optimization is skipped to avoid the private-IP SSRF check.
const usingMediaProxy = !process.env.S3_PUBLIC_URL;

const nextConfig: NextConfig = {
  images: {
    unoptimized: usingMediaProxy,
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
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withNextIntl(nextConfig);
