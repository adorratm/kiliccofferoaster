import type { Metadata } from "next";
import { DownloadButtons } from "@/components/DownloadButtons";
import { Reveal } from "@/components/Reveal";
import { getSiteSettings } from "@/lib/cms";
import { breadcrumbJsonLd, buildPageMetadata, JsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Uygulamalar",
    description:
      "Kılıç Coffee Roaster mağazasını Windows, macOS, Linux, Android ve iOS uygulamasından kullanın. Alışveriş sitedekiyle aynıdır.",
    path: "/indir",
    settings,
    keywords: [
      "Kılıç Coffee uygulama",
      "kahve sipariş uygulaması",
      "Windows",
      "macOS",
      "Linux",
      "Android",
      "iOS",
    ],
  });
}

export default async function DownloadPage() {
  const settings = await getSiteSettings();
  return (
    <div className="page-shell py-section">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana sayfa", path: "/" },
          { name: "Uygulamalar", path: "/indir" },
        ])}
      />
      <Reveal>
        <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-primary/80">
          Mağaza // Uygulamalar
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight md:text-6xl">
          Siteden sipariş, uygulamadan da
        </h1>
        <p className="mt-6 max-w-2xl font-meta text-sm uppercase leading-relaxed text-secondary">
          Windows, macOS, Linux, Android ve iOS uygulamaları {settings.brand.name} vitrininin
          kendisidir: ürün, sepet, ödeme ve hesabınız aynı kalır. Personel
          menüleri müşteriye gösterilmez.
        </p>
      </Reveal>
      <DownloadButtons />
    </div>
  );
}
