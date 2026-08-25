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

function shouldUseNativeImg(host: string | null) {
  if (!host) return false;
  // S3: next/image (unoptimized olsa bile) bazen crossOrigin/preload ile
  // Origin gönderir. Origin’süz + immutable cache’lenmiş yanıtta ACAO yokken
  // tarayıcı sahte CORS hatası verir ve görsel kırılır. Native <img> yeterli.
  return isS3Host(host) || isInstagramCdn(host);
}

/**
 * S3 ve Instagram CDN: native <img> (CORS gerekmez, görüntüleme bozulmaz).
 * Diğer remote URL’ler: next/image.
 */
export function AppImage({ unoptimized, ...props }: ImageProps) {
  const host = hostnameOf(props.src);
  const src = props.src;

  if (shouldUseNativeImg(host) && typeof src === "string") {
    const { alt, className, fill, width, height, style, priority, loading } =
      props;
    const imgClass = fill
      ? ["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")
      : className;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- S3/IG: CORS’suz native img
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

  return <Image {...props} unoptimized={unoptimized} />;
}
