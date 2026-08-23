"use client";

import { useState } from "react";
import { AppImage as Image } from "@/components/AppImage";
import { MediaLightbox } from "@/components/MediaLightbox";
import { Reveal } from "@/components/Reveal";
import {
  galleryCaption,
  galleryImageUrl,
  type GalleryItem,
} from "@/lib/gallery";

type Props = {
  items: GalleryItem[];
  profileUrl?: string;
  emptyMessage?: string;
  /** Instagram: dış link. Upload: lightbox. */
  mode?: "link" | "lightbox";
  linkTarget?: "_blank";
};

function MediaTile({
  item,
  index,
  mode,
  linkTarget,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  mode: "link" | "lightbox";
  linkTarget?: "_blank";
  onOpen: (index: number) => void;
}) {
  const href =
    mode === "link"
      ? item.permalink || (item.source === "instagram" ? item.mediaUrl : null)
      : null;
  const caption = galleryCaption(item);
  const isVideo = item.mediaType === "VIDEO";

  const inner = (
    <article className="media-tile group relative aspect-square overflow-hidden border border-outline-variant/30 bg-surface-container-low">
      <Image
        src={galleryImageUrl(item)}
        alt={caption || "Kılıç Coffee medya"}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {isVideo ? (
        <span className="absolute right-3 top-3 border border-white/30 bg-black/50 px-2 py-0.5 font-meta text-[9px] uppercase tracking-widest text-white">
          Video
        </span>
      ) : null}
      {mode === "lightbox" ? (
        <span className="absolute left-3 top-3 border border-white/20 bg-black/40 px-2 py-0.5 font-meta text-[9px] uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
          Büyüt
        </span>
      ) : null}
      {caption ? (
        <p className="absolute inset-x-0 bottom-0 translate-y-3 p-4 font-meta text-[10px] uppercase leading-relaxed text-on-surface opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {caption}
        </p>
      ) : null}
    </article>
  );

  return (
    <Reveal delay={Math.min(index, 11) * 50} variant="scale">
      {href ? (
        <a
          href={href}
          target={linkTarget}
          rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {inner}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onOpen(index)}
          className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {inner}
        </button>
      )}
    </Reveal>
  );
}

export function MediaGallerySection({
  items,
  profileUrl,
  emptyMessage = "Henüz içerik yok.",
  mode = "link",
  linkTarget = "_blank",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) {
    return (
      <Reveal>
        <p className="font-meta text-xs uppercase tracking-widest text-secondary">
          {emptyMessage}
          {profileUrl ? (
            <>
              {" "}
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Instagram profilimizi
              </a>{" "}
              ziyaret edebilirsiniz.
            </>
          ) : null}
        </p>
      </Reveal>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {items.map((item, i) => (
          <MediaTile
            key={item.id}
            item={item}
            index={i}
            mode={mode}
            linkTarget={linkTarget}
            onOpen={setOpenIndex}
          />
        ))}
      </div>

      {mode === "lightbox" && openIndex != null ? (
        <MediaLightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      ) : null}
    </>
  );
}
