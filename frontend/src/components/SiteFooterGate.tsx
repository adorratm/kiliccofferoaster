"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import type { SiteSettings } from "@/lib/cms";

type Props = {
  settings: SiteSettings;
};

/** Toptan katalog paylaşımında mağaza footer’ını gizler. */
export function SiteFooterGate({ settings }: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/katalog/")) {
    return (
      <footer className="border-t border-outline-variant/30 px-5 py-6 text-center font-meta text-[10px] uppercase tracking-widest text-secondary">
        Yalnızca paylaşılan link · İndekslenmez
      </footer>
    );
  }
  return <SiteFooter settings={settings} />;
}
