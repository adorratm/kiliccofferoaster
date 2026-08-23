"use client";

import { useState } from "react";
import { AppImage as Image } from "@/components/AppImage";
import { MediaLightbox } from "@/components/MediaLightbox";
import { Reveal } from "@/components/Reveal";
import {
  galleryImageUrl,
  type GalleryStory,
} from "@/lib/gallery";

type Props = {
  stories: GalleryStory[];
  profileUrl?: string;
  emptyMessage?: string;
};

export function MediaStoriesStrip({
  stories,
  profileUrl,
  emptyMessage = "Şu an aktif hikaye yok.",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!stories.length) {
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
                Instagram
              </a>
              ’da güncel hikayeleri görebilirsiniz.
            </>
          ) : null}
        </p>
      </Reveal>
    );
  }

  const slides = stories.map((s) => ({
    id: s.id,
    mediaUrl: s.mediaUrl,
    thumbnailUrl: s.thumbnailUrl,
    caption: null,
    mediaType: s.mediaType,
    permalink: s.permalink,
  }));

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        {stories.map((story, i) => {
          const thumb = galleryImageUrl(story);
          const isVideo = story.mediaType === "VIDEO";
          return (
            <Reveal key={story.id} delay={Math.min(i, 8) * 40} variant="scale">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group flex w-19 shrink-0 flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="relative block size-19 overflow-hidden border border-primary/70 p-0.5 transition group-hover:border-primary">
                  <span className="relative block size-full overflow-hidden bg-surface-container-low">
                    <Image
                      src={thumb}
                      alt="Instagram hikaye"
                      fill
                      sizes="76px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </span>
                  {isVideo ? (
                    <span className="absolute bottom-1 right-1 bg-black/60 px-1 font-meta text-[8px] uppercase tracking-wider text-white">
                      Play
                    </span>
                  ) : null}
                </span>
                <span className="font-meta text-[9px] uppercase tracking-widest text-secondary">
                  Hikaye
                </span>
              </button>
            </Reveal>
          );
        })}
      </div>

      {openIndex != null ? (
        <MediaLightbox
          items={slides}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      ) : null}
    </>
  );
}
