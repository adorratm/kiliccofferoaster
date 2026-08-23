"use client";

import { useEffect, useCallback } from "react";
import { AppImage as Image } from "@/components/AppImage";
import { galleryCaption, galleryImageUrl, type GalleryItem } from "@/lib/gallery";

type Slide = Pick<
  GalleryItem,
  "id" | "mediaUrl" | "thumbnailUrl" | "caption" | "mediaType" | "permalink"
>;

type Props = {
  items: Slide[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function MediaLightbox({ items, index, onClose, onIndexChange }: Props) {
  const item = items[index];
  const total = items.length;

  const go = useCallback(
    (delta: number) => {
      if (!total) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, onIndexChange, total],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  if (!item) return null;

  const caption = galleryCaption(item, 220);
  const isVideo = item.mediaType === "VIDEO";
  const preview = galleryImageUrl(item);

  return (
    <div
      className="media-lightbox fixed inset-0 z-100 flex flex-col bg-deep-carbon/95"
      role="dialog"
      aria-modal="true"
      aria-label="Galeri görünümü"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Kapat"
        onClick={onClose}
      />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-outline-variant/30 px-4 py-3 md:px-8">
        <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-secondary">
          {index + 1} / {total}
        </p>
        <div className="flex items-center gap-2">
          {item.permalink ? (
            <a
              href={item.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-meta text-[10px] uppercase tracking-widest text-primary underline"
            >
              Kaynak
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="border border-outline-variant/50 px-3 py-2 font-meta text-[10px] uppercase tracking-widest text-on-surface transition hover:border-primary hover:text-primary"
          >
            Kapat
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-6 md:px-16">
        {total > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 border border-outline-variant/40 bg-background/70 px-3 py-4 font-meta text-sm text-on-surface transition hover:border-primary hover:text-primary md:left-6"
            aria-label="Önceki"
          >
            ‹
          </button>
        ) : null}

        <div
          className="relative flex max-h-full max-w-5xl flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              key={item.id}
              src={item.mediaUrl}
              poster={item.thumbnailUrl || undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[min(78vh,900px)] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="relative max-h-[min(78vh,900px)] w-[min(92vw,1100px)]">
              <Image
                src={preview}
                alt={caption || "Galeri görseli"}
                width={1600}
                height={1200}
                className="max-h-[min(78vh,900px)] w-full object-contain"
                sizes="(max-width: 1100px) 92vw, 1100px"
                priority
              />
            </div>
          )}
          {caption ? (
            <p className="mt-4 max-w-2xl text-center font-meta text-[11px] uppercase leading-relaxed text-secondary">
              {caption}
            </p>
          ) : null}
        </div>

        {total > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 border border-outline-variant/40 bg-background/70 px-3 py-4 font-meta text-sm text-on-surface transition hover:border-primary hover:text-primary md:right-6"
            aria-label="Sonraki"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
