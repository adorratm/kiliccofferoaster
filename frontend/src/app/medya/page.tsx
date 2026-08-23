import Link from "next/link";
import type { Metadata } from "next";
import { MediaGallerySection } from "@/components/MediaGallerySection";
import { MediaStoriesStrip } from "@/components/MediaStoriesStrip";
import { Reveal } from "@/components/Reveal";
import {
  getContentSections,
  getSiteSettings,
  sectionContent,
} from "@/lib/cms";
import { getPublicGallery } from "@/lib/gallery";
import { breadcrumbJsonLd, buildPageMetadata, JsonLd } from "@/lib/seo";

type MediaHeader = {
  eyebrow: string;
  title: string;
  subtitle: string;
  instagramLabel: string;
  storiesLabel: string;
  uploadsLabel: string;
};

const FALLBACK_HEADER: MediaHeader = {
  eyebrow: "01 // Medya",
  title: "Atölyeden & Instagram",
  subtitle:
    "Kavrum anları, batch notları ve atölye yaşamından kareler. Instagram paylaşımlarımız ve seçilmiş görseller.",
  instagramLabel: "Instagram",
  storiesLabel: "Hikayeler",
  uploadsLabel: "Atölyeden",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Medya",
    description:
      "Kılıç Coffee Roaster Instagram paylaşımları, hikayeler ve atölyeden seçilmiş görseller.",
    path: "/medya",
    settings,
    keywords: ["Kılıç Coffee medya", "Instagram", "kavrum atölyesi", "Torbalı"],
  });
}

export default async function MediaPage() {
  const [settings, sections, gallery] = await Promise.all([
    getSiteSettings(),
    getContentSections("media"),
    getPublicGallery(),
  ]);

  const header = sectionContent(sections, "header", FALLBACK_HEADER);
  const instagramUrl =
    settings.social.instagram?.trim() || gallery.instagramProfile;

  return (
    <div className="page-shell py-section">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana sayfa", path: "/" },
          { name: "Medya", path: "/medya" },
        ])}
      />

      <Reveal className="mb-16 max-w-3xl">
        <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-primary/80">
          {header.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight md:text-6xl">
          {header.title}
        </h1>
        <p className="mt-6 font-meta text-sm uppercase leading-relaxed text-secondary">
          {header.subtitle}
        </p>
        {instagramUrl ? (
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost mt-8 inline-flex px-5 py-3 text-[10px]"
          >
            @kiliccoffeeroaster
          </Link>
        ) : null}
      </Reveal>

      <section className="mb-16">
        <Reveal className="mb-8">
          <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
            02 // {header.storiesLabel || FALLBACK_HEADER.storiesLabel}
          </p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">
            Instagram hikayeleri
          </h2>
          <p className="mt-3 max-w-xl font-meta text-[11px] uppercase leading-relaxed text-secondary">
            Son 24 saatteki aktif hikayeler — tıklayınca büyük görünüm.
          </p>
        </Reveal>
        <MediaStoriesStrip
          stories={gallery.stories}
          profileUrl={instagramUrl}
          emptyMessage={
            gallery.instagramConfigured
              ? "Şu an aktif Instagram hikayesi yok."
              : "Instagram hikayeleri yakında burada olacak."
          }
        />
      </section>

      <section className="mb-20">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
              03 // {header.instagramLabel}
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Instagram paylaşımları
            </h2>
          </div>
          {gallery.instagramSyncedAt ? (
            <p className="font-meta text-[10px] uppercase text-secondary">
              Son senkron:{" "}
              {new Date(gallery.instagramSyncedAt).toLocaleDateString("tr-TR")}
            </p>
          ) : null}
        </Reveal>
        <MediaGallerySection
          items={gallery.instagram}
          profileUrl={instagramUrl}
          mode="lightbox"
          emptyMessage={
            gallery.instagramConfigured
              ? "Instagram gönderileri henüz senkronize edilmedi."
              : "Instagram akışı yakında burada olacak."
          }
        />
      </section>

      <section>
        <Reveal className="mb-8">
          <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
            04 // {header.uploadsLabel}
          </p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">
            Atölyeden seçkiler
          </h2>
          <p className="mt-3 max-w-xl font-meta text-[11px] uppercase leading-relaxed text-secondary">
            Kavrum, paketleme ve atölye anları — tıklayınca büyük görünüm.
          </p>
        </Reveal>
        <MediaGallerySection
          items={gallery.uploads}
          mode="lightbox"
          emptyMessage="Henüz atölye görseli eklenmedi."
        />
      </section>
    </div>
  );
}
