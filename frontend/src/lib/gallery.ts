import { getApiBase } from "@/lib/api";

export type GalleryItem = {
  id: string;
  source: "instagram" | "upload";
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  caption: string | null;
  mediaType: string;
  sortOrder: number;
  publishedAt: string | null;
};

export type GalleryStory = {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  mediaType: string;
  publishedAt: string | null;
};

export type PublicGallery = {
  instagram: GalleryItem[];
  uploads: GalleryItem[];
  stories: GalleryStory[];
  instagramProfile: string;
  instagramConfigured: boolean;
  instagramSyncedAt: string | null;
};

const EMPTY_GALLERY: PublicGallery = {
  instagram: [],
  uploads: [],
  stories: [],
  instagramProfile: "https://www.instagram.com/kiliccoffeeroaster/",
  instagramConfigured: false,
  instagramSyncedAt: null,
};

export async function getPublicGallery(): Promise<PublicGallery> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/gallery`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return EMPTY_GALLERY;
    const data = (await res.json()) as PublicGallery;
    return {
      ...EMPTY_GALLERY,
      ...data,
      stories: data.stories ?? [],
    };
  } catch {
    return EMPTY_GALLERY;
  }
}

export function galleryImageUrl(item: {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  mediaType?: string;
}): string {
  if (item.mediaType === "VIDEO" && item.thumbnailUrl) {
    return item.thumbnailUrl;
  }
  return item.thumbnailUrl || item.mediaUrl;
}

export function galleryCaption(item: { caption?: string | null }, max = 120): string {
  const text = item.caption?.trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
