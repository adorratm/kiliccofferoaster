import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/cms";
import { buildPageMetadata } from "@/lib/seo";
import {
  buildWhatsAppUrl,
  resolveWhatsAppPhone,
} from "@/lib/whatsapp";

const DEFAULT_REVIEW_URL =
  "https://g.page/r/CdfE3W3I-W53EAI/review";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Google’da Değerlendir",
    description:
      "Kılıç Coffee Roaster deneyiminizi Google İşletme Profili’nde paylaşın. Ayrancılar, Torbalı / İzmir.",
    path: "/yorum",
    settings,
    keywords: ["Google yorum", "Ayrancılar kahve", "Torbalı kahve"],
  });
}

export default async function ReviewPage() {
  const settings = await getSiteSettings();
  const reviewUrl = settings.social.googleReviewUrl?.trim();
  const mapsUrl = settings.social.googleMaps?.trim();
  const target = reviewUrl || mapsUrl || DEFAULT_REVIEW_URL;
  const wa = settings.whatsapp.enabled
    ? buildWhatsAppUrl(
        resolveWhatsAppPhone({
          whatsappPhone: settings.whatsapp.phone,
          contactPhone: settings.contact.phone,
        }),
        "Merhaba, Google yorum linki için yazıyorum.",
      )
    : null;

  return (
    <div>
      <header className="page-shell border-b border-outline-variant/20 pb-10 pt-16 md:pt-24">
        <p className="font-meta text-xs uppercase tracking-widest text-primary">
          [ Local · Trust ]
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-tighter md:text-7xl">
          Deneyiminizi
          <br />
          paylaşın
        </h1>
        <p className="mt-4 max-w-xl font-meta text-xs uppercase leading-relaxed tracking-widest text-on-surface-variant">
          Mağazamızı ziyaret ettiyseniz Google’da kısa bir değerlendirme yerel
          görünürlüğümüze çok yardımcı olur. QR kodu tarayın veya aşağıdaki
          bağlantıya tıklayın.
        </p>
      </header>

      <section className="page-shell py-section">
        <div className="industrial-border max-w-xl bg-surface-container-lowest p-8">
          <p className="font-meta text-xs uppercase tracking-widest text-primary">
            Kahvemizi denediysen deneyimini paylaş
          </p>

          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex flex-col items-center gap-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Google’da değerlendir — QR kodu tarayın"
          >
            <span className="bg-white p-4">
              <Image
                src="/images/google-review-qr.png"
                alt="Google yorum QR kodu"
                width={220}
                height={220}
                className="h-[220px] w-[220px]"
                priority
              />
            </span>
            <span className="font-meta text-[11px] uppercase tracking-widest text-on-surface-variant">
              QR kodu tarayın
            </span>
          </a>

          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta mt-8 inline-flex px-8 py-4 text-xs"
          >
            Google’da değerlendir
          </a>

          <div className="mt-8 flex flex-wrap gap-4 font-meta text-[11px] uppercase tracking-widest">
            <Link href="/urunler" className="text-secondary underline hover:text-primary">
              Kavrumlar
            </Link>
            <Link href="/iletisim" className="text-secondary underline hover:text-primary">
              İletişim
            </Link>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline hover:text-primary"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
