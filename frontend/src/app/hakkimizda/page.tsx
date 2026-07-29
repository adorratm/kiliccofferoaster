import { AppImage as Image } from "@/components/AppImage";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import {
  cmsImageUrl,
  getContentSections,
  getSiteSettings,
  sectionContent,
} from "@/lib/cms";
import {
  aboutPageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  JsonLd,
} from "@/lib/seo";
import { stockImage } from "@/lib/stock-images";

type AboutHero = {
  imageUrl: string;
  title: string;
  seoDescription: string;
};

type AboutBody = {
  titleLine1: string;
  titleLine2: string;
  paragraphs: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  showContactAside: boolean;
};

type AboutEthos = {
  imageUrl: string;
  eyebrow: string;
  quote: string;
  linkLabel: string;
  linkHref: string;
};

const FALLBACK_HERO: AboutHero = {
  imageUrl: stockImage("workshop"),
  title: "Hakkımızda",
  seoDescription:
    "Torbalı / İzmir’de batch bazlı specialty coffee kavurucusu. Veriye dayalı profil, taze kavrum ve atölye deneyimi.",
};

const FALLBACK_BODY: AboutBody = {
  titleLine1: "Torbalı’dan",
  titleLine2: "ölçülen kavrum",
  paragraphs: [
    "Kılıç Coffee Roaster, Ayrancılar / Torbalı merkezinde batch bazlı specialty coffee üretir. Her profil termal eğri, hava akışı ve drum hızı ile izlenir; tutarlılık veriye, derinlik ise tadım disiplinine dayanır.",
    "Amacımız raflara stok kahve koymak değil; taze kavrulmuş, izlenebilir ve demlemeye hazır çekirdek sunmaktır. Ev baristasından kafeye, aynı kalite standardını koruruz.",
    "Atölyemizi ziyaret etmek, toptan iş birliği veya kavrum profili konuşmak için iletişime geçebilirsiniz.",
  ],
  ctaPrimary: { label: "Kavrumları İncele", href: "/urunler" },
  ctaSecondary: { label: "İletişim", href: "/iletisim" },
  showContactAside: true,
};

const FALLBACK_ETHOS: AboutEthos = {
  imageUrl: stockImage("ethos"),
  eyebrow: "The Roasting Ethos",
  quote: "Metodoloji veriye dayanır. Her batch için tutarlılık ölçülür.",
  linkLabel: "Blog notlarını oku →",
  linkHref: "/blog",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getContentSections("about"),
  ]);
  const hero = sectionContent(sections, "hero", FALLBACK_HERO);
  return buildPageMetadata({
    title: hero.title || "Hakkımızda",
    description:
      hero.seoDescription ||
      `${settings.brand.name} — Torbalı / İzmir’de batch bazlı specialty coffee kavurucusu.`,
    path: "/hakkimizda",
    settings,
    keywords: [
      "hakkımızda",
      "Torbalı kahve",
      "İzmir specialty coffee",
      "kahve kavurucu",
      "atölye",
    ],
    image: cmsImageUrl(hero.imageUrl, stockImage("workshop")),
  });
}

export default async function AboutPage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getContentSections("about"),
  ]);
  const { brand, contact } = settings;
  const hero = sectionContent(sections, "hero", FALLBACK_HERO);
  const body = sectionContent(sections, "body", FALLBACK_BODY);
  const ethos = sectionContent(sections, "ethos", FALLBACK_ETHOS);
  const heroImage = cmsImageUrl(hero.imageUrl, stockImage("workshop"));
  const ethosImage = cmsImageUrl(ethos.imageUrl, stockImage("ethos"));
  const paragraphs = Array.isArray(body.paragraphs)
    ? body.paragraphs.filter((p) => typeof p === "string" && p.trim())
    : FALLBACK_BODY.paragraphs;

  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: hero.title || "Hakkımızda", path: "/hakkimizda" },
  ];

  return (
    <>
      <JsonLd data={aboutPageJsonLd(settings)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <section className="relative min-h-[70vh] overflow-hidden border-b border-outline-variant/20">
        <Image
          src={heroImage}
          alt={`${brand.name} atölye`}
          fill
          priority
          className="object-cover brightness-50 grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        <div className="page-shell relative flex min-h-[70vh] flex-col justify-end py-16 md:py-24">
          <Reveal>
            <p className="font-meta text-[11px] uppercase tracking-[0.3em] text-primary">
              {brand.established} · {brand.location}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-tight md:text-7xl">
              {hero.title || "Hakkımızda"}
            </h1>
            <p className="mt-6 max-w-xl border-l-2 border-primary-container py-2 pl-6 font-meta text-xs uppercase leading-relaxed text-secondary md:text-sm">
              {brand.tagline || brand.slogan}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="page-shell grid gap-12 py-section md:grid-cols-12 md:gap-gutter md:py-24">
        <Reveal className="md:col-span-7">
          <h2 className="font-display text-3xl leading-none md:text-5xl">
            {body.titleLine1}
            {body.titleLine2 ? (
              <span className="mt-2 block text-outline">{body.titleLine2}</span>
            ) : null}
          </h2>
          <div className="mt-8 space-y-5 font-meta text-sm uppercase leading-relaxed tracking-wide text-secondary">
            {paragraphs.map((p, i) => (
              <p key={`p-${i}`}>{p}</p>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {body.ctaPrimary?.label ? (
              <Link
                href={body.ctaPrimary.href || "/urunler"}
                className="btn-cta px-8 py-3 text-sm"
              >
                {body.ctaPrimary.label}
              </Link>
            ) : null}
            {body.ctaSecondary?.label ? (
              <Link
                href={body.ctaSecondary.href || "/iletisim"}
                className="btn-ghost px-8 py-3 text-sm"
              >
                {body.ctaSecondary.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        {body.showContactAside !== false ? (
          <Reveal className="md:col-span-5" delay={100} variant="left">
            <div className="border-t border-outline-variant/30 pt-6 font-meta text-xs uppercase tracking-widest text-secondary">
              <p className="text-primary/60">Adres</p>
              <p className="mt-3 leading-relaxed text-on-background">
                {contact.address}
              </p>
              {contact.hours ? (
                <>
                  <p className="mt-8 text-primary/60">Çalışma</p>
                  <p className="mt-3 text-on-background">{contact.hours}</p>
                </>
              ) : null}
              {contact.phone ? (
                <>
                  <p className="mt-8 text-primary/60">Telefon</p>
                  <p className="mt-3">
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="text-on-background underline hover:text-primary"
                    >
                      {contact.phone}
                    </a>
                  </p>
                </>
              ) : null}
              {contact.email ? (
                <>
                  <p className="mt-8 text-primary/60">E-posta</p>
                  <p className="mt-3">
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-on-background underline hover:text-primary"
                    >
                      {contact.email}
                    </a>
                  </p>
                </>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </section>

      <section className="relative min-h-[40vh] overflow-hidden border-y border-outline-variant/20">
        <Image
          src={ethosImage}
          alt="Kavrum süreci"
          fill
          className="object-cover opacity-70 brightness-75 grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/50" />
        <div className="page-shell relative flex min-h-[40vh] items-center py-16">
          <Reveal>
            <p className="font-meta text-xs uppercase tracking-[0.25em] text-primary">
              {ethos.eyebrow}
            </p>
            <p className="mt-4 max-w-2xl font-display text-3xl leading-tight md:text-4xl">
              {ethos.quote}
            </p>
            {ethos.linkLabel ? (
              <Link
                href={ethos.linkHref || "/blog"}
                className="mt-8 inline-block font-meta text-xs uppercase tracking-widest text-secondary underline hover:text-primary"
              >
                {ethos.linkLabel}
              </Link>
            ) : null}
          </Reveal>
        </div>
      </section>
    </>
  );
}
