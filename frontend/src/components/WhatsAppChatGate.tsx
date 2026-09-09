"use client";

import { usePathname } from "next/navigation";
import { WhatsAppChat } from "@/components/WhatsAppChat";
import type { WhatsAppPreset } from "@/lib/whatsapp";

type Props = {
  enabled?: boolean;
  phone?: string | null;
  brandName?: string;
  greeting?: string;
  presets?: WhatsAppPreset[];
};

/** Toptan katalog paylaşımında sohbet balonunu gizler. */
export function WhatsAppChatGate(props: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/katalog/")) return null;
  return <WhatsAppChat {...props} />;
}
