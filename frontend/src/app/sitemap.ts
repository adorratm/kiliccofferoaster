import type { MetadataRoute } from "next";
import { getBlogSlugs, getCategories } from "@/lib/api";
import { fetchAllCatalogProducts } from "@/lib/catalog-feed";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import { productImage } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/urunler", changeFrequency: "daily", priority: 0.9 },
  { path: "/hakkimizda", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sss", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.85 },
  { path: "/medya", changeFrequency: "weekly", priority: 0.75 },
  { path: "/iletisim", changeFrequency: "monthly", priority: 0.7 },
  { path: "/oner", changeFrequency: "weekly", priority: 0.8 },
  { path: "/toptan", changeFrequency: "monthly", priority: 0.75 },
  { path: "/yorum", changeFrequency: "monthly", priority: 0.55 },
  { path: "/indir", changeFrequency: "weekly", priority: 0.65 },
  { path: "/kvkk", changeFrequency: "yearly", priority: 0.3 },
  { path: "/gizlilik", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cerez-politikasi", changeFrequency: "yearly", priority: 0.3 },
  { path: "/mesafeli-satis", changeFrequency: "yearly", priority: 0.3 },
  { path: "/on-bilgilendirme", changeFrequency: "yearly", priority: 0.3 },
  { path: "/iptal-iade", changeFrequency: "yearly", priority: 0.3 },
  { path: "/musteri-memnuniyeti", changeFrequency: "yearly", priority: 0.3 },
  { path: "/guvenli-alisveris", changeFrequency: "yearly", priority: 0.3 },
  { path: "/aydinlatma-metni", changeFrequency: "yearly", priority: 0.3 },
];

function safeDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function absoluteHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function staticEntries(now: Date): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticOnly = staticEntries(now);

  try {
    const [products, blogSlugs, categories] = await Promise.all([
      fetchAllCatalogProducts().catch(() => []),
      getBlogSlugs().catch(() => []),
      getCategories().catch(() => []),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = (categories || []).flatMap(
      (cat) => {
        if (!cat?.slug) return [];
        return [
          {
            url: `${SITE_URL}${categoryCatalogPath(cat.slug)}`,
            lastModified: safeDate(cat.updatedAt) ?? now,
            changeFrequency: "weekly" as const,
            priority: 0.75,
          },
        ];
      },
    );

    const productEntries: MetadataRoute.Sitemap = (products || []).flatMap(
      (product) => {
        if (!product?.slug) return [];
        const images = [
          productImage(product.imageUrl, product.slug),
          ...(product.gallery || []),
        ]
          .map(absoluteHttpUrl)
          .filter((url): url is string => Boolean(url))
          .filter((url, i, arr) => arr.indexOf(url) === i);

        return [
          {
            url: `${SITE_URL}/urunler/${product.slug}`,
            lastModified: safeDate(product.updatedAt) ?? now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
            ...(images.length ? { images } : {}),
          },
        ];
      },
    );

    const blogEntries: MetadataRoute.Sitemap = (blogSlugs || []).flatMap(
      (post) => {
        if (!post?.slug) return [];
        return [
          {
            url: `${SITE_URL}/blog/${post.slug}`,
            lastModified:
              safeDate(post.updatedAt) ?? safeDate(post.publishedAt) ?? now,
            changeFrequency: "monthly" as const,
            priority: 0.75,
          },
        ];
      },
    );

    return [
      ...staticOnly,
      ...categoryEntries,
      ...productEntries,
      ...blogEntries,
    ];
  } catch (err) {
    console.error("[sitemap] falling back to static routes", err);
    return staticOnly;
  }
}
