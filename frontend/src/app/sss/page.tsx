import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getContentSections, getSiteSettings, sectionContent } from "@/lib/cms";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  JsonLd,
} from "@/lib/seo";

type FaqItem = { question: string; answer: string };
type FaqContent = { title: string; items: FaqItem[] };

const FALLBACK_FAQ: FaqContent = {
  title: "Sıkça Sorulan Sorular",
  items: [
    {
      question: "Kahveler ne sıklıkla kavruluyor?",
      answer:
        "Sipariş ve taze stok dengesi için batch bazlı kavrum yapıyoruz. Çekirdekler mümkün olduğunca taze kavrulmuş olarak gönderilir.",
    },
    {
      question: "Öğütülmüş kahve sipariş edebilir miyim?",
      answer:
        "Varsayılan ürünlerimiz çekirdek olarak sunulur. Öğütme tercihinizi sipariş notunda belirtirseniz uygun öğütmeye göre hazırlarız.",
    },
    {
      question: "Kargo süresi ne kadar?",
      answer:
        "Ödeme onayı sonrası siparişler genellikle 1–3 iş günü içinde kargoya verilir. Takip kodunu sipariş bildirimiyle paylaşıyoruz.",
    },
    {
      question: "Atölyeyi ziyaret edebilir miyim?",
      answer:
        "Torbalı / İzmir atölyemizi ziyaret etmek için iletişim formundan veya telefonla randevu alabilirsiniz.",
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getContentSections("home"),
  ]);
  const faq = sectionContent(sections, "faq", FALLBACK_FAQ);
  return buildPageMetadata({
    title: faq.title || "Sıkça Sorulan Sorular",
    description: `${settings.brand.name} hakkında sıkça sorulan sorular: kavrum, öğütme, kargo ve atölye ziyareti.`,
    path: "/sss",
    settings,
    keywords: ["sss", "sıkça sorulan sorular", "kargo", "kavrum", "öğütme"],
  });
}

export default async function FaqPage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getContentSections("home"),
  ]);
  const faq = sectionContent(sections, "faq", FALLBACK_FAQ);
  const faqItems = (faq.items || []).filter(
    (item) => item?.question?.trim() && item?.answer?.trim(),
  );
  const faqSchema = faqJsonLd(faqItems);
  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: "SSS", path: "/sss" },
  ];

  return (
    <>
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <section className="page-shell border-b border-outline-variant/20 py-16 md:py-24">
        <Reveal>
          <p className="font-meta text-[11px] uppercase tracking-[0.3em] text-primary">
            FAQ · {settings.brand.name}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-tight md:text-7xl">
            {faq.title || "Sıkça Sorulan Sorular"}
          </h1>
          <p className="mt-6 max-w-xl font-meta text-xs uppercase leading-relaxed tracking-wide text-secondary md:text-sm">
            Kavrum, sipariş ve atölye hakkında merak edilenler.
          </p>
        </Reveal>
      </section>

      <section className="page-shell py-section md:py-24">
        {faqItems.length ? (
          <div className="mx-auto max-w-3xl space-y-0 border-t border-outline-variant/30">
            {faqItems.map((item, i) => (
              <Reveal
                key={`${item.question}-${i}`}
                delay={Math.min(i, 5) * 50}
                className="border-b border-outline-variant/30 py-6"
              >
                <h2 className="font-display text-xl md:text-2xl">
                  {item.question}
                </h2>
                <p className="mt-3 font-sans text-base leading-7 text-secondary">
                  {item.answer}
                </p>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="font-meta text-sm uppercase tracking-wide text-secondary">
            Henüz soru eklenmemiş.
          </p>
        )}

        <Reveal className="mt-16 flex flex-col gap-4 sm:flex-row">
          <Link href="/iletisim" className="btn-cta px-8 py-3 text-sm">
            Sorunuz mu var?
          </Link>
          <Link href="/urunler" className="btn-ghost px-8 py-3 text-sm">
            Kavrumları İncele
          </Link>
        </Reveal>
      </section>
    </>
  );
}
