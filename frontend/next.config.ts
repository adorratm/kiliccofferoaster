import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    // S3 / CDN — Unsplash kullanılmıyor
    {
      protocol: "https",
      hostname: "**.amazonaws.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname:
        "kilic-coffee-roaster.s3.eu-central-1.amazonaws.com",
      pathname: "/**",
    },
  ];

  const cdnUrl = process.env.AWS_CDN_URL || process.env.NEXT_PUBLIC_CDN_URL;
  if (cdnUrl) {
    try {
      const { hostname, protocol } = new URL(cdnUrl);
      patterns.push({
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
        pathname: "/**",
      });
    } catch {
      // ignore invalid CDN URL
    }
  }

  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = (process.env.AWS_REGION || "eu-central-1").trim();
  if (bucket) {
    patterns.push(
      {
        protocol: "https",
        hostname: `${bucket}.s3.${region}.amazonaws.com`,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: `${bucket}.s3.amazonaws.com`,
        pathname: "/**",
      },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const { hostname, protocol } = new URL(apiUrl);
      patterns.push({
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
        pathname: "/**",
      });
    } catch {
      // ignore
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: imageRemotePatterns(),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ["@/components"],
  },
};

export default nextConfig;
