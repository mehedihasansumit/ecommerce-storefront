import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

function hostFromEnv(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const s3Host =
  hostFromEnv(process.env.S3_PUBLIC_URL) ||
  hostFromEnv(process.env.S3_ENDPOINT) ||
  hostFromEnv(process.env.RUSTFS_ENDPOINT);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...(s3Host
        ? [
            { protocol: "http" as const, hostname: s3Host },
            { protocol: "https" as const, hostname: s3Host },
          ]
        : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.freepik.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withNextIntl(nextConfig);
