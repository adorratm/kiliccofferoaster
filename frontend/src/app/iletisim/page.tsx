import { ContactPageClient } from "@/components/ContactPageClient";
import {
  getContentSections,
  getSiteSettings,
  sectionContent,
} from "@/lib/cms";

type ContactHeader = {
  title: string;
  subtitle: string;
};

export default async function ContactPage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getContentSections("contact"),
  ]);

  const header = sectionContent<ContactHeader>(sections, "header", {
    title: "Communications\nProtocol",
    subtitle:
      "Kılıç kavurma operasyonlarına doğrudan bağlantı. Teknik sorular, toptan talep ve lojistik koordinasyon.",
  });

  return (
    <ContactPageClient
      contact={settings.contact}
      brandName={settings.brand.name}
      title={header.title}
      subtitle={header.subtitle}
    />
  );
}
