import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import {
  buildCatalogMetadata,
  breadcrumbJsonLd,
  JsonLd,
} from "@/lib/seo";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import ProductsCatalog from "../../ProductsCatalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
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
    q: sp.q,
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

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
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
