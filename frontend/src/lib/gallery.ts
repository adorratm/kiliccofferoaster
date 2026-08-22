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

export type PublicGallery = {
  instagram: GalleryItem[];
  uploads: GalleryItem[];
  instagramProfile: string;
  instagramConfigured: boolean;
  instagramSyncedAt: string | null;
};

const EMPTY_GALLERY: PublicGallery = {
  instagram: [],
  uploads: [],
  instagramProfile: "https://www.instagram.com/kiliccoffeeroaster/",
  instagramConfigured: false,
  instagramSyncedAt: null,
};

export async function getPublicGallery(): Promise<PublicGallery> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/gallery`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return EMPTY_GALLERY;
    return (await res.json()) as PublicGallery;
  } catch {
    return EMPTY_GALLERY;
  }
}

export function galleryImageUrl(item: GalleryItem): string {
  return item.thumbnailUrl || item.mediaUrl;
}

export function galleryCaption(item: GalleryItem, max = 120): string {
  const text = item.caption?.trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
