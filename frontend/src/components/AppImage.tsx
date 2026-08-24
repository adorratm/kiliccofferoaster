import Image, { type ImageProps } from "next/image";

function hostnameOf(src: ImageProps["src"]): string | null {
  if (typeof src !== "string" || !/^https?:\/\//i.test(src)) return null;
  try {
    return new URL(src).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isS3Host(host: string) {
  return host === "amazonaws.com" || host.endsWith(".amazonaws.com");
}

/** Instagram/Meta CDN — kendi CORS’umuz yok; native img. */
function isInstagramCdn(host: string) {
  return (
    host === "cdninstagram.com" ||
    host.endsWith(".cdninstagram.com") ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net") ||
    host === "instagram.com" ||
    host.endsWith(".instagram.com")
  );
}

/**
 * S3: next/image unoptimized (doğrudan bucket URL).
 * Instagram CDN: native <img> (Meta CORS vermez).
 * crossOrigin koyma: görüntüleme için gerekmez; S3’te cache’lenmiş
 * Origin’süz yanıt + crossOrigin tarayıcıda sahte CORS hatası üretir.
 */
export function AppImage({ unoptimized, ...props }: ImageProps) {
  const host = hostnameOf(props.src);
  const src = props.src;

  if (host && isInstagramCdn(host) && typeof src === "string") {
    const { alt, className, fill, width, height, style, priority, loading } =
      props;
    const imgClass = fill
      ? ["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")
      : className;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- IG CDN CORS yok
      <img
        src={src}
        alt={alt || ""}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={imgClass}
        style={style}
        loading={loading ?? (priority ? "eager" : "lazy")}
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }

  const s3 = Boolean(host && isS3Host(host));
  return <Image {...props} unoptimized={unoptimized ?? s3} />;
}
