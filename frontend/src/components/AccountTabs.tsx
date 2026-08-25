"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type AccountTabId =
  | "siparisler"
  | "adresler"
  | "hesap"
  | "favoriler"
  | "bildirimler";

const TABS: {
  id: AccountTabId;
  label: string;
  href: string;
}[] = [
  { id: "siparisler", label: "Siparişler", href: "/hesabim?sekme=siparisler" },
  { id: "adresler", label: "Adresler", href: "/hesabim?sekme=adresler" },
  { id: "hesap", label: "Hesap", href: "/hesabim?sekme=hesap" },
  { id: "favoriler", label: "Favoriler", href: "/hesabim/favoriler" },
  { id: "bildirimler", label: "Bildirimler", href: "/hesabim/bildirimler" },
];

export function resolveAccountTab(
  pathname: string,
  sekme: string | null,
): AccountTabId {
  if (pathname.startsWith("/hesabim/favoriler")) return "favoriler";
  if (pathname.startsWith("/hesabim/bildirimler")) return "bildirimler";
  if (sekme === "adresler" || sekme === "hesap" || sekme === "siparisler") {
    return sekme;
  }
  return "siparisler";
}

function TabNav({ current }: { current: AccountTabId }) {
  return (
    <nav
      className="mt-8 flex gap-1 overflow-x-auto border-b border-outline-variant/30 pb-px"
      aria-label="Hesap bölümleri"
      role="tablist"
    >
      {TABS.map((tab) => {
        const selected = current === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            className={`shrink-0 border-b-2 px-4 py-3 font-meta text-[11px] uppercase tracking-widest transition-colors ${
              selected
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:border-outline-variant/50 hover:text-on-surface"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** `active` verilirse URL okunmaz (alt sayfalar). */
export function AccountTabs({ active }: { active?: AccountTabId }) {
  if (active) return <TabNav current={active} />;
  return <AccountTabsFromUrl />;
}

function AccountTabsFromUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = resolveAccountTab(pathname, searchParams.get("sekme"));
  return <TabNav current={current} />;
}
