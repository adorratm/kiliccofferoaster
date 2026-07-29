import Image, { type ImageProps } from "next/image";

/** S3 — Next 16 /_next/image bazen remotePatterns’e rağmen reddeder. */
function shouldBypassOptimizer(src: ImageProps["src"]) {
  if (typeof src !== "string") return false;
  try {
    if (!/^https?:\/\//i.test(src)) return false;
    const host = new URL(src).hostname;
    return host === "amazonaws.com" || host.endsWith(".amazonaws.com");
  } catch {
    return src.includes("amazonaws.com");
  }
}

/**
 * next/image sarmalayıcı: S3 kaynaklarında unoptimized (doğrudan URL).
 * CDN / Unsplash vb. optimize edilmeye devam eder.
 */
export function AppImage({ unoptimized, ...props }: ImageProps) {
  const bypass = shouldBypassOptimizer(props.src);
  return <Image {...props} unoptimized={unoptimized ?? bypass} />;
}
