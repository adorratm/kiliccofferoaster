import type { Metadata } from "next";
import { CoffeeFinder } from "@/components/CoffeeFinder";
import { getProductsPaged } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Sana Uygun Kahveyi Bul",
    description:
      "Damak zevkinize ve demleme yönteminize göre specialty kahve önerisi. Kılıç Coffee Roaster — Ayrancılar, Torbalı.",
    path: "/oner",
    settings,
    keywords: [
      "kahve seçici",
      "espresso kahve",
      "filtre kahve çekirdeği",
      "V60",
      "Türk kahvesi çekirdek",
    ],
  });
}

export default async function CoffeeFinderPage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getProductsPaged({ coffeeOnly: true, limit: 100 }).catch(() => null),
  ]);

  return (
    <div>
      <header className="page-shell border-b border-outline-variant/20 pb-10 pt-16 md:pt-24">
        <p className="font-meta text-xs uppercase tracking-widest text-primary">
          [ Finder · Protocol ]
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-tighter md:text-7xl">
          Sana uygun
          <br />
          kahveyi bul
        </h1>
        <p className="mt-4 max-w-xl font-meta text-xs uppercase leading-relaxed tracking-widest text-on-surface-variant">
          Birkaç soruyla damak zevkinize ve demleme yönteminize uygun kavrum
          öneriyoruz.
        </p>
      </header>
      <CoffeeFinder
        products={page?.items || []}
        brandName={settings.brand.name}
        whatsappEnabled={settings.whatsapp.enabled}
        whatsappPhone={settings.whatsapp.phone || settings.contact.phone}
      />
    </div>
  );
}
