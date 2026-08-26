import type { Metadata } from "next";
import { WholesalePageClient } from "@/components/WholesalePageClient";
import { getSiteSettings } from "@/lib/cms";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Toptan Kahve Tedariki",
    description:
      "Cafe, restoran ve işletmeler için Ayrancılar’da taze kavrulmuş specialty kahve tedariki.",
    path: "/toptan",
    settings,
    keywords: [
      "toptan kahve",
      "cafe kahve tedariki",
      "Torbalı kahve",
      "B2B kahve",
    ],
  });
}

export default async function WholesalePage() {
  const settings = await getSiteSettings();
  return (
    <WholesalePageClient
      contact={settings.contact}
      whatsapp={settings.whatsapp}
      brandName={settings.brand.name}
    />
  );
}
