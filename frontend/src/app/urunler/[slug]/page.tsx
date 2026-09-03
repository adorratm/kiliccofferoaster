import { AppImage as Image } from "@/components/AppImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlavorGeometry } from "@/components/FlavorGeometry";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { ProductBuyBox } from "@/components/ProductBuyBox";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { Reveal } from "@/components/Reveal";
import { getProductBySlug, getProductReviews, getProductsPaged } from "@/lib/api";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import {
  asBrewGuide,
  looksLikeHtml,
  productKindLabel,
} from "@/lib/catalog-seo";
import { getSiteSettings } from "@/lib/cms";
import { productImage } from "@/lib/format";
import {
  JsonLd,
  breadcrumbJsonLd,
  buildProductMetadata,
  productJsonLd,
} from "@/lib/seo";
import { resolveWhatsAppPhone } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

type RoastPhase = {
  phase: string;
  duration: string;
  target: string;
  airflow: string;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatRoastDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function originLabel(product: Product) {
  return [product.originRegion, product.originCountry]
    .filter((v): v is string => hasText(v))
    .join(" · ");
}

function ProductDescription({ html }: { html: string }) {
  if (looksLikeHtml(html)) {
    return (
      <div
        className="prose-blog max-w-2xl space-y-5 font-sans text-base leading-8 text-on-surface-variant [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-foreground [&_p]:mb-0 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  const blocks = html
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="max-w-2xl space-y-4 font-sans text-lg leading-relaxed text-on-surface-variant">
      {blocks.map((block) => (
        <p key={block.slice(0, 48)} className="whitespace-pre-wrap">
          {block}
        </p>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);
  if (!product) {
    return { title: "Ürün bulunamadı", robots: { index: false, follow: false } };
  }
  return buildProductMetadata(product, settings);
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings, reviews] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
    getProductReviews(slug, 1, 10).catch(() => null),
  ]);

  if (!product) notFound();

  const category = product.category;
  const relatedPage = category?.slug
    ? await getProductsPaged({
        categorySlug: category.slug,
        limit: 8,
        sort: "name",
        order: "asc",
      }).catch(() => null)
    : null;
  const related = (relatedPage?.items || [])
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  const images =
    product.gallery?.length > 0
      ? product.gallery
      : [productImage(product.imageUrl, product.slug)];

  const roastLog = (product.roastLog || {}) as Record<string, unknown>;
  const roastTime = hasText(roastLog.roastTime) ? roastLog.roastTime : null;
  const dropTemp = hasText(roastLog.dropTemp) ? roastLog.dropTemp : null;
  const phases = (
    Array.isArray(roastLog.phases) ? (roastLog.phases as RoastPhase[]) : []
  ).filter(
    (row) =>
      hasText(row.phase) ||
      hasText(row.duration) ||
      hasText(row.target) ||
      hasText(row.airflow),
  );

  const kindLabel = productKindLabel(product.kind);
  const roastDate = formatRoastDate(product.roastedAt);
  const brew = asBrewGuide(product.brewGuide);
  const weights = (product.variants || [])
    .filter((v) => v.isActive !== false)
    .map((v) => v.weightLabel)
    .filter(Boolean)
    .join(" · ");

  const specs = [
    ["Kahve türü", kindLabel],
    ["Menşei", originLabel(product) || null],
    ["Rakım", product.altitude],
    ["İşlem", product.process],
    ["Çeşit", product.varietal],
    ["Kavrum", product.roastLevel],
    ["Aroma", product.flavorNotes?.filter(Boolean).join(", ")],
    ["Kavrum tarihi", roastDate],
    ["Gramaj", weights || null],
  ].filter(([, value]) => hasText(value));

  const showRoastMetrics = Boolean(roastTime || dropTemp);
  const showRoastTable = phases.length > 0;
  const showDescription = Boolean(product.description);
  const showRoastSection = showRoastMetrics || showRoastTable;

  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: "Kavrumlar", path: "/urunler" },
    ...(category
      ? [
          {
            name: category.name,
            path: categoryCatalogPath(category.slug),
          },
        ]
      : []),
    { name: product.name, path: `/urunler/${product.slug}` },
  ];

  return (
    <div>
      <ProductViewTracker
        id={product.id}
        name={product.name}
        price={Number(product.salePrice ?? product.basePrice ?? 0)}
        currency={product.currency || "TRY"}
      />
      <JsonLd data={productJsonLd(product, settings, reviews?.items ?? [])} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageBreadcrumb items={crumbs} />

      <section className="grid grid-cols-1 border-b border-outline-variant/20 lg:grid-cols-12">
        <Reveal
          className="relative min-h-130 overflow-hidden border-r border-outline-variant/20 bg-surface lg:col-span-7 lg:min-h-217.5"
          variant="fade"
        >
          {product.batchId ? (
            <div className="absolute left-8 top-8 z-10">
              <span className="border border-primary bg-surface/80 px-3 py-1 font-meta text-xs text-primary">
                BATCH_ID: {product.batchId}
              </span>
            </div>
          ) : null}
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
          />
          <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 to-transparent p-8">
            <h1 className="font-display text-5xl leading-none tracking-tighter md:text-7xl">
              {product.name}
            </h1>
          </div>
        </Reveal>

        <Reveal
          className="flex flex-col justify-between bg-surface p-8 lg:col-span-5 lg:p-12"
          variant="right"
          delay={100}
        >
          <div>
            <div className="mb-10 flex items-start justify-between gap-6">
              <div>
                <div className="mb-2 font-meta text-sm uppercase tracking-widest text-primary">
                  {kindLabel || "Taze kavrulmuş kahve"}
                </div>
                <p className="font-meta text-xs uppercase text-on-surface-variant">
                  Ağırlık · öğütme · stok
                </p>
                {(product.ratingCount ?? 0) > 0 ? (
                  <p className="mt-2 font-meta text-xs uppercase tracking-widest text-primary">
                    {Number(product.ratingAvg || 0).toFixed(1)} / 5 ·{" "}
                    {product.ratingCount} yorum
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mb-10 space-y-8">
              {specs.length > 0 ? (
                <div className="industrial-border relative p-6">
                  <div className="absolute -top-3 left-4 bg-surface px-2 font-meta text-[10px] uppercase text-on-surface-variant">
                    Çekirdek profili
                  </div>
                  <div className="grid grid-cols-2 gap-y-6">
                    {specs.map(([label, value]) => (
                      <div key={label as string}>
                        <p className="font-meta text-[10px] uppercase text-on-surface-variant">
                          {label}
                        </p>
                        <p className="font-meta text-lg uppercase text-on-surface">
                          {value as string}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <FlavorGeometry values={product.flavorGeometry} />
            </div>
          </div>

          <div>
            <ProductBuyBox
              product={product}
              whatsappEnabled={settings.whatsapp.enabled}
              whatsappPhone={resolveWhatsAppPhone({
                whatsappPhone: settings.whatsapp.phone,
                contactPhone: settings.contact.phone,
              })}
            />
            <div
              lang="en"
              className="mt-4 flex justify-between font-meta text-[10px] uppercase tracking-widest text-on-surface-variant"
            >
              <span>Secure_Protocol_V3</span>
              <span>Global_Logistics_Enabled</span>
            </div>
          </div>
        </Reveal>
      </section>

      {showDescription || brew || product.storageNotes ? (
        <section className="cv-auto page-shell border-b border-outline-variant/20 py-section">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-8">
              {showDescription ? (
                <>
                  {looksLikeHtml(product.description) ? null : (
                    <h2 className="mb-6 font-display text-4xl">
                      {product.name}
                    </h2>
                  )}
                  <ProductDescription html={product.description} />
                </>
              ) : null}
            </Reveal>
            <Reveal className="space-y-8 lg:col-span-4" delay={80}>
              {brew ? (
                <div className="industrial-border p-6">
                  <h3 className="mb-4 font-display text-2xl">Demleme önerisi</h3>
                  <dl className="space-y-3 font-meta text-sm uppercase tracking-wide">
                    {brew.method ? (
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-2">
                        <dt className="text-on-surface-variant">Yöntem</dt>
                        <dd>{brew.method}</dd>
                      </div>
                    ) : null}
                    {brew.grind ? (
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-2">
                        <dt className="text-on-surface-variant">Öğütme</dt>
                        <dd>{brew.grind}</dd>
                      </div>
                    ) : null}
                    {brew.ratio ? (
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-2">
                        <dt className="text-on-surface-variant">Oran</dt>
                        <dd>{brew.ratio}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {brew.notes ? (
                    <p className="mt-4 font-sans text-sm leading-6 text-on-surface-variant">
                      {brew.notes}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {product.storageNotes ? (
                <div className="industrial-border p-6">
                  <h3 className="mb-3 font-display text-2xl">Saklama</h3>
                  <p className="font-sans text-sm leading-6 text-on-surface-variant">
                    {product.storageNotes}
                  </p>
                </div>
              ) : null}
              {category ? (
                <Link
                  href={categoryCatalogPath(category.slug)}
                  className="inline-flex border border-primary px-4 py-2 font-meta text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-background"
                >
                  {category.name} kategorisi →
                </Link>
              ) : null}
            </Reveal>
          </div>
        </section>
      ) : null}

      {showRoastSection ? (
        <section className="cv-auto page-shell border-b border-outline-variant/20 py-section">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4" variant="left">
              <h2 className="mb-6 font-display text-4xl uppercase">
                Kavrum kaydı
              </h2>
              {showRoastMetrics ? (
                <div lang="en" className="mt-8 flex gap-4">
                  {roastTime ? (
                    <div className="industrial-border w-32 p-4 text-center">
                      <span className="block font-display text-2xl">
                        {roastTime}
                      </span>
                      <span className="font-meta text-[10px] uppercase text-on-surface-variant">
                        Roast Time
                      </span>
                    </div>
                  ) : null}
                  {dropTemp ? (
                    <div className="industrial-border w-32 p-4 text-center">
                      <span className="block font-display text-2xl">
                        {dropTemp}
                      </span>
                      <span className="font-meta text-[10px] uppercase text-on-surface-variant">
                        Drop Temp
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Reveal>
            {showRoastTable ? (
              <Reveal className="lg:col-span-8" variant="right" delay={90}>
                <div
                  lang="en"
                  className="industrial-border overflow-hidden bg-surface-container"
                >
                  <table className="w-full text-left font-meta text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-high">
                        <th className="p-4 uppercase tracking-wider">Phase</th>
                        <th className="p-4 uppercase tracking-wider">Duration</th>
                        <th className="p-4 uppercase tracking-wider">
                          Target ΔT
                        </th>
                        <th className="p-4 uppercase tracking-wider">
                          Airflow %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-secondary">
                      {phases.map((row, index) => (
                        <tr
                          key={`${row.phase}-${index}`}
                          className="border-b border-outline-variant/10"
                        >
                          <td className="p-4 uppercase">{row.phase}</td>
                          <td className="p-4 uppercase">{row.duration}</td>
                          <td className="p-4 uppercase">{row.target}</td>
                          <td className="p-4 uppercase">{row.airflow}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="cv-auto page-shell border-b border-outline-variant/20 py-section">
          <Reveal className="mb-10">
            <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
              Aynı kategori
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              {category ? `${category.name} içinde` : "İlgili kavrumlar"}
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {related.map((item, i) => (
              <Reveal key={item.id} delay={i * 60}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <ProductReviews
        productId={product.id}
        slug={product.slug}
        ratingAvg={product.ratingAvg}
        ratingCount={product.ratingCount}
      />
    </div>
  );
}
