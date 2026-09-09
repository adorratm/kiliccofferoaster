"use client";

import { usePathname } from "next/navigation";
import { CookieBanner } from "@/components/CookieBanner";

/** Toptan katalog paylaşımında çerez banner’ını gizler. */
export function CookieBannerGate() {
  const pathname = usePathname();
  if (pathname.startsWith("/katalog/")) return null;
  return <CookieBanner />;
}
