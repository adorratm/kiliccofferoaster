import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategories, getProductsPaged } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import {
  buildCatalogMetadata,
  breadcrumbJsonLd,
  itemListJsonLd,
  JsonLd,
} from "@/lib/seo";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import ProductsCatalog from "../../ProductsCatalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    origin?: string;
    roast?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp, settings, categories] = await Promise.all([
    params,
    searchParams,
    getSiteSettings(),
    getCategories().catch(() => []),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: "Kategori bulunamadı", robots: { index: false, follow: false } };
  }
  return buildCatalogMetadata(settings, {
    categorySlug: category.slug,
    categoryName: category.name,
    categoryDescription: category.description,
    categorySeoTitle: category.seoTitle,
    categorySeoDescription: category.seoDescription,
    q: sp.q,
    page: sp.page,
    origin: sp.origin,
    roast: sp.roast,
    sort: sp.sort,
    order: sp.order,
  });
}

export default async function CategoryCatalogPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: "Kavrumlar", path: "/urunler" },
    {
      name: category.name,
      path: categoryCatalogPath(category.slug),
    },
  ];

  const catalog = await getProductsPaged({
    page: 1,
    limit: 48,
    categorySlug: category.slug,
  }).catch(() => null);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {catalog?.items?.length ? (
        <JsonLd
          data={itemListJsonLd(catalog.items, {
            name: category.name,
            path: categoryCatalogPath(category.slug),
          })}
        />
      ) : null}
      <Suspense
        fallback={
          <div className="page-shell py-24 font-meta text-sm uppercase text-secondary">
            Katalog yükleniyor…
          </div>
        }
      >
        <ProductsCatalog />
      </Suspense>
    </>
  );
}
