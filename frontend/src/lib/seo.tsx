import type { Metadata } from "next";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import type { SiteSettings } from "@/lib/cms";
import type { BlogPost, Product, ProductReview } from "@/lib/types";

export { categoryCatalogPath };

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  settings: SiteSettings;
  keywords?: string[];
  image?: string | null;
  noIndex?: boolean;
  ogType?: "website" | "article";
};

function ogImages(
  image: string | undefined | null,
  alt: string,
): NonNullable<Metadata["openGraph"]>["images"] {
  if (!image) return undefined;
  return [{ url: image, width: 1200, height: 630, alt }];
}

export function buildPageMetadata({
  title,
  description,
  path,
  settings,
  keywords,
  image,
  noIndex,
  ogType = "website",
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || settings.seo.ogImage;
  const fullTitle = `${title} | ${settings.brand.name}`;
  return {
    title,
    description,
    keywords: keywords?.length
      ? [...(settings.seo.keywords || []), ...keywords]
      : undefined,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: ogType,
      locale: "tr_TR",
      url,
      siteName: settings.brand.name,
      title: fullTitle,
      description,
      images: ogImages(ogImage, settings.brand.name),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export function buildCatalogMetadata(
  settings: SiteSettings,
  opts: {
    categorySlug?: string;
    categoryName?: string;
    categoryDescription?: string | null;
    categorySeoTitle?: string | null;
    categorySeoDescription?: string | null;
    q?: string;
    page?: string | number;
    origin?: string;
    roast?: string;
    sort?: string;
    order?: string;
  } = {},
): Metadata {
  const { categorySlug, categoryName, categoryDescription, q } = opts;
  const query = q?.trim();
  const pageNum = Number(opts.page || 1);
  const filtered = Boolean(
    (pageNum > 1 && Number.isFinite(pageNum)) ||
      opts.origin?.trim() ||
      opts.roast?.trim() ||
      opts.sort?.trim() ||
      opts.order?.trim(),
  );

  let title = "Kavrumlar";
  let description =
    "Torbalı / İzmir’den specialty kahve kavrumları. Batch bazlı, profile kontrollü, taze kavrulmuş çekirdekler.";
  let path = "/urunler";

  if (categorySlug && categoryName) {
    title = opts.categorySeoTitle?.trim() || categoryName;
    description =
      opts.categorySeoDescription?.trim() ||
      categoryDescription?.trim() ||
      `${categoryName} kategorisindeki kavrumlar — ${settings.brand.name}.`;
    path = categoryCatalogPath(categorySlug);
  } else if (query) {
    title = `Arama: ${query}`;
    description = `“${query}” için kavrum sonuçları — ${settings.brand.name}.`;
    path = `/urunler?q=${encodeURIComponent(query)}`;
  }

  return buildPageMetadata({
    title,
    description,
    path,
    settings,
    keywords: categoryName
      ? [categoryName, categorySlug || "", "kahve", "kavrum"]
      : ["katalog", "kahve", "specialty coffee"],
    noIndex: Boolean(query) || filtered,
  });
}

export function buildSiteMetadata(settings: SiteSettings): Metadata {
  const { seo, brand } = settings;
  const verification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.title || brand.name,
      template: `%s | ${brand.name}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      siteName: brand.name,
      title: seo.title,
      description: seo.description,
      images: ogImages(seo.ogImage, brand.name),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    alternates: {
      canonical: SITE_URL,
      types: {
        "application/rss+xml": `${SITE_URL}/feed.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(verification
      ? { verification: { google: verification } }
      : {}),
  };
}

/** Ana sayfa için açık metadata (layout default’unu sayfa düzeyinde sabitler). */
export function buildHomeMetadata(settings: SiteSettings): Metadata {
  const { seo, brand } = settings;
  return {
    title: { absolute: seo.title || brand.name },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      siteName: brand.name,
      title: seo.title || brand.name,
      description: seo.description,
      images: ogImages(seo.ogImage, brand.name),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title || brand.name,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export function buildProductMetadata(
  product: Product,
  settings: SiteSettings,
): Metadata {
  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription ||
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    settings.seo.description;
  const image = product.imageUrl || settings.seo.ogImage;
  const url = `${SITE_URL}/urunler/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      // Next Metadata yalnızca website|article|... kabul eder; "product" RSC'yi düşürür.
      // Ürün sinyali Product JSON-LD ile verilir.
      type: "website",
      locale: "tr_TR",
      url,
      siteName: settings.brand.name,
      title,
      description,
      images: ogImages(image, product.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildBlogIndexMetadata(
  settings: SiteSettings,
  opts: { page?: number; tag?: string } = {},
): Metadata {
  const page = opts.page && opts.page > 1 ? opts.page : undefined;
  const tag = opts.tag?.trim();
  let title = "Blog";
  let description =
    "Kavrum teknikleri, demleme notları ve Kılıç Coffee Roaster günlüklerinden yazılar.";
  let path = "/blog";
  const qs = new URLSearchParams();
  if (tag) {
    title = `Blog · ${tag}`;
    description = `“${tag}” etiketli yazılar — ${settings.brand.name}.`;
    qs.set("tag", tag);
  }
  if (page) {
    title = `${title} · Sayfa ${page}`;
    qs.set("page", String(page));
  }
  const query = qs.toString();
  if (query) path = `/blog?${query}`;

  const meta = buildPageMetadata({
    title,
    description,
    path,
    settings,
    keywords: ["blog", "kahve blog", "specialty coffee", tag || ""].filter(
      Boolean,
    ),
    noIndex: Boolean(page || tag),
  });

  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      types: {
        "application/rss+xml": `${SITE_URL}/feed.xml`,
      },
    },
  };
}

export function buildBlogPostMetadata(
  post: BlogPost,
  settings: SiteSettings,
): Metadata {
  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription ||
    post.excerpt ||
    post.content.replace(/<[^>]+>/g, "").slice(0, 160) ||
    settings.seo.description;
  const image = post.coverImageUrl || settings.seo.ogImage;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: [...(settings.seo.keywords || []), ...(post.tags || [])],
    authors: post.authorName ? [{ name: post.authorName }] : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url,
      siteName: settings.brand.name,
      title,
      description,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
      images: ogImages(image, post.title),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function websiteJsonLd(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brand.name,
    url: SITE_URL,
    description: settings.seo.description,
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/urunler?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function parseOpeningHours(hours: string | undefined | null) {
  if (!hours?.trim()) return undefined;
  const match = hours.match(
    /(\d{1,2})[:.](\d{2})\s*[—–\-]\s*(\d{1,2})[:.](\d{2})/,
  );
  if (!match) return undefined;
  const opens = `${match[1].padStart(2, "0")}:${match[2]}`;
  const closes = `${match[3].padStart(2, "0")}:${match[4]}`;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens,
    closes,
  };
}

function parsePostalCode(address: string | undefined | null) {
  const match = address?.match(/\b(\d{5})\b/);
  return match?.[1];
}

export function organizationJsonLd(settings: SiteSettings) {
  const { brand, contact, social, seo } = settings;
  const sameAs = [social.instagram, social.facebook, social.googleMaps]
    .map((u) => u?.trim())
    .filter(Boolean) as string[];
  const openingHoursSpecification = parseOpeningHours(contact.hours);
  const postalCode = parsePostalCode(contact.address);

  return {
    "@context": "https://schema.org",
    "@type": "CoffeeShop",
    "@id": `${SITE_URL}/#organization`,
    name: brand.name,
    description: brand.tagline || seo.description,
    url: SITE_URL,
    priceRange: "₺₺",
    logo: seo.ogImage
      ? { "@type": "ImageObject", url: seo.ogImage }
      : undefined,
    image: seo.ogImage || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: "Torbalı",
      addressRegion: "İzmir",
      postalCode: postalCode || undefined,
      addressCountry: "TR",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "İzmir",
    },
    email: contact.email || undefined,
    telephone: contact.phone || undefined,
    openingHours: contact.hours || undefined,
    ...(openingHoursSpecification ? { openingHoursSpecification } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

const DEFAULT_SHIPPING_FEE = "89.90";

function productAvailability(inStock: boolean) {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: `${SITE_URL}/iptal-iade`,
  };
}

function offerShippingDetails() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: DEFAULT_SHIPPING_FEE,
      currency: "TRY",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "TR",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 5,
        unitCode: "DAY",
      },
    },
  };
}

export function productJsonLd(
  product: Product,
  settings: SiteSettings,
  reviews: ProductReview[] = [],
) {
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const inStock =
    activeVariants.some((v) => Number(v.stock) > 0) || product.stock > 0;
  const ratingCount = product.ratingCount ?? reviews.length;
  const ratingAvg = Number(product.ratingAvg || 0);
  const images = [
    product.imageUrl,
    ...(product.gallery || []),
  ].filter(Boolean) as string[];
  const description =
    product.seoDescription ||
    product.shortDescription ||
    product.description;
  const url = `${SITE_URL}/urunler/${product.slug}`;
  const currency = product.currency || "TRY";
  const seller = {
    "@type": "Organization",
    name: settings.brand.name,
  };
  const shipping = {
    shippingDetails: offerShippingDetails(),
    hasMerchantReturnPolicy: merchantReturnPolicy(),
    seller,
    url,
    itemCondition: "https://schema.org/NewCondition",
  };

  const prices = (
    activeVariants.length
      ? activeVariants.map((v) => Number(v.price))
      : [Number(product.salePrice ?? product.basePrice)]
  ).filter((n) => Number.isFinite(n));
  const low = prices.length ? Math.min(...prices) : Number(product.basePrice);
  const high = prices.length ? Math.max(...prices) : low;

  const offers =
    activeVariants.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: currency,
          lowPrice: low.toFixed(2),
          highPrice: high.toFixed(2),
          offerCount: activeVariants.length,
          availability: productAvailability(inStock),
          ...shipping,
          offers: activeVariants.map((variant) => ({
            "@type": "Offer",
            sku: variant.sku,
            name: variant.weightLabel,
            price: variant.price,
            priceCurrency: currency,
            availability: productAvailability(Number(variant.stock) > 0),
            url,
            seller,
          })),
        }
      : {
          "@type": "Offer",
          priceCurrency: currency,
          price: String(activeVariants[0]?.price ?? product.basePrice),
          sku: activeVariants[0]?.sku || product.batchId || product.slug,
          availability: productAvailability(inStock),
          ...shipping,
        };

  const approvedReviews = reviews.filter((r) => r.isApproved && r.body);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.seoTitle || product.name,
    description,
    image: images.length ? images : settings.seo.ogImage || undefined,
    sku: product.batchId || product.slug,
    brand: {
      "@type": "Brand",
      name: settings.brand.name,
    },
    offers,
    ...(ratingCount > 0 && ratingAvg > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg.toFixed(1),
            reviewCount: ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(approvedReviews.length
      ? {
          review: approvedReviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: "5",
              worstRating: "1",
            },
            author: { "@type": "Person", name: review.authorName },
            reviewBody: review.body,
            datePublished: review.createdAt || undefined,
          })),
        }
      : {}),
  };
}

export function blogPostJsonLd(post: BlogPost, settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.seoDescription || undefined,
    image: post.coverImageUrl || settings.seo.ogImage || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    author: {
      "@type": "Person",
      name: post.authorName || settings.brand.name,
    },
    publisher: {
      "@type": "Organization",
      name: settings.brand.name,
      logo: settings.seo.ogImage
        ? { "@type": "ImageObject", url: settings.seo.ogImage }
        : undefined,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags?.join(", ") || undefined,
    inLanguage: post.locale || "tr",
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function itemListJsonLd(
  products: Pick<Product, "name" | "slug" | "imageUrl" | "shortDescription">[],
  opts: { name: string; path: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: `${SITE_URL}${opts.path}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/urunler/${product.slug}`,
      name: product.name,
      ...(product.imageUrl ? { image: product.imageUrl } : {}),
      ...(product.shortDescription
        ? { description: product.shortDescription }
        : {}),
    })),
  };
}

export function aboutPageJsonLd(settings: SiteSettings) {
  const { brand, contact, seo } = settings;
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `Hakkımızda | ${brand.name}`,
    url: `${SITE_URL}/hakkimizda`,
    description:
      seo.description ||
      `${brand.name} — Torbalı / İzmir specialty coffee kavurucusu.`,
    mainEntity: {
      "@type": "CoffeeShop",
      "@id": `${SITE_URL}/#organization`,
      name: brand.name,
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        streetAddress: contact.address,
        addressLocality: "Torbalı",
        addressRegion: "İzmir",
        addressCountry: "TR",
      },
      telephone: contact.phone || undefined,
      email: contact.email || undefined,
    },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
