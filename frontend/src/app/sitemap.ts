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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogSlugs, categories] = await Promise.all([
    fetchAllCatalogProducts(),
    getBlogSlugs().catch(() => []),
    getCategories().catch(() => []),
  ]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}${categoryCatalogPath(cat.slug)}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => {
    const images = [
      productImage(product.imageUrl, product.slug),
      ...(product.gallery || []),
    ].filter((url, i, arr) => url && arr.indexOf(url) === i);
    return {
      url: `${SITE_URL}/urunler/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images,
    };
  });

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt
      ? new Date(post.updatedAt)
      : post.publishedAt
        ? new Date(post.publishedAt)
        : now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries,
  ];
}
