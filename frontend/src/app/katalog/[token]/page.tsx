import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  WholesaleCatalogClient,
  type WholesaleCatalogResponse,
} from "@/components/WholesaleCatalogClient";
import { getApiBase } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ token: string }>;
};

async function fetchCatalog(
  token: string,
): Promise<WholesaleCatalogResponse | null> {
  try {
    const res = await fetch(
      `${getApiBase()}/wholesale-catalog/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as WholesaleCatalogResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const settings = await getSiteSettings();
  const catalog = await fetchCatalog(token);
  return buildPageMetadata({
    title: catalog
      ? `Toptan Katalog — ${catalog.brandName}`
      : "Toptan Katalog",
    description:
      "İşletmeler için kavrulmuş kahve fiyat listesi ve tadım notaları.",
    path: `/katalog/${token}`,
    settings,
    noIndex: true,
  });
}

export default async function WholesaleCatalogPage({ params }: PageProps) {
  const { token } = await params;
  const catalog = await fetchCatalog(token);
  if (!catalog) notFound();

  const settings = await getSiteSettings();
  return (
    <WholesaleCatalogClient
      catalog={catalog}
      contactPhone={settings.contact.phone}
      contactEmail={settings.contact.email}
    />
  );
}
