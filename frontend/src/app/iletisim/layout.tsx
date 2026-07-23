import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/cms";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const location =
    settings.contact.locationLabel || settings.brand.location || "";
  return buildPageMetadata({
    title: "İletişim",
    description: location
      ? `${settings.brand.name} ile iletişime geçin — ${location} atölye ve sipariş soruları.`
      : `${settings.brand.name} ile iletişime geçin — atölye ve sipariş soruları.`,
    path: "/iletisim",
    settings,
    keywords: ["iletişim", location, "kahve kavurma"].filter(Boolean),
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
