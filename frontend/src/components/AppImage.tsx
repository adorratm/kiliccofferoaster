import Image, { type ImageProps } from "next/image";

/** Hotlink / optimizer uyumsuz hostlar — doğrudan CDN URL. */
function shouldBypassOptimizer(src: ImageProps["src"]) {
  if (typeof src !== "string") return false;
  try {
    if (!/^https?:\/\//i.test(src)) return false;
    const host = new URL(src).hostname.toLowerCase();
    return (
      host === "amazonaws.com" ||
      host.endsWith(".amazonaws.com") ||
      host === "cdninstagram.com" ||
      host.endsWith(".cdninstagram.com") ||
      host === "fbcdn.net" ||
      host.endsWith(".fbcdn.net") ||
      host === "instagram.com" ||
      host.endsWith(".instagram.com")
    );
  } catch {
    return (
      src.includes("amazonaws.com") ||
      src.includes("cdninstagram.com") ||
      src.includes("fbcdn.net")
    );
  }
}

/**
 * next/image sarmalayıcı: S3 / Instagram CDN’de unoptimized (doğrudan URL).
 * Diğer uzak görseller optimize edilmeye devam eder.
 */
export function AppImage({ unoptimized, ...props }: ImageProps) {
  const bypass = shouldBypassOptimizer(props.src);
  return <Image {...props} unoptimized={unoptimized ?? bypass} />;
}
