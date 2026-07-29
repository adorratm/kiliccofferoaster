import type { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { getProductsPaged } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import {
  buildCatalogMetadata,
  breadcrumbJsonLd,
  itemListJsonLd,
  JsonLd,
} from "@/lib/seo";
import ProductsCatalog from "./ProductsCatalog";

type Props = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    origin?: string;
    roast?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sp = await searchParams;
  if (sp.category) {
    // Eski query URL'ler kategori sayfasına yönlenir; meta orada üretilir.
    return {};
  }
  const settings = await getSiteSettings();
  return buildCatalogMetadata(settings, { q: sp.q });
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;

  if (sp.category?.trim()) {
    const qs = new URLSearchParams();
    if (sp.q) qs.set("q", sp.q);
    if (sp.origin) qs.set("origin", sp.origin);
    if (sp.roast) qs.set("roast", sp.roast);
    if (sp.sort) qs.set("sort", sp.sort);
    if (sp.order) qs.set("order", sp.order);
    if (sp.page) qs.set("page", sp.page);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    permanentRedirect(
      `/urunler/kategori/${encodeURIComponent(sp.category.trim())}${suffix}`,
    );
  }

  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: "Kavrumlar", path: "/urunler" },
  ];

  const catalog = await getProductsPaged({ page: 1, limit: 48 }).catch(() => null);
  const listItems = catalog?.items ?? [];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {listItems.length ? (
        <JsonLd
          data={itemListJsonLd(listItems, {
            name: "Kavrumlar",
            path: "/urunler",
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
