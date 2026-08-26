import {
  catalogActiveVariants,
  catalogAvailability,
  catalogListAndSalePrice,
  catalogProductDescription,
  escapeXml,
  fetchAllCatalogProducts,
  formatCatalogMoney,
} from "@/lib/catalog-feed";
import { getSiteSettings } from "@/lib/cms";
import { productImage } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";
import type { Product, ProductVariant } from "@/lib/types";

export const revalidate = 3600;

const GOOGLE_PRODUCT_CATEGORY =
  "Food, Beverages & Tobacco > Beverages > Coffee & Tea > Coffee";

function additionalImages(product: Product) {
  return (product.gallery || [])
    .filter((url) => url && url !== product.imageUrl)
    .slice(0, 9)
    .map(
      (url) =>
        `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
    )
    .join("\n");
}

function buildItemXml(opts: {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  additional: string;
  inStock: boolean;
  price: string;
  salePrice?: string;
  currency: string;
  brand: string;
  itemGroupId?: string;
  size?: string;
  mpn?: string;
  gtin?: string | null;
}) {
  const money = formatCatalogMoney(opts.price, opts.currency);
  const sale =
    opts.salePrice != null
      ? `\n      <g:sale_price>${escapeXml(formatCatalogMoney(opts.salePrice, opts.currency))}</g:sale_price>`
      : "";
  const group = opts.itemGroupId
    ? `\n      <g:item_group_id>${escapeXml(opts.itemGroupId)}</g:item_group_id>`
    : "";
  const size = opts.size
    ? `\n      <g:size>${escapeXml(opts.size)}</g:size>`
    : "";
  const mpn = opts.mpn
    ? `\n      <g:mpn>${escapeXml(opts.mpn)}</g:mpn>`
    : "";
  const gtin =
    opts.gtin && /^\d{8,14}$/.test(opts.gtin)
      ? `\n      <g:gtin>${escapeXml(opts.gtin)}</g:gtin>`
      : "";
  const identifierExists = gtin || mpn ? "yes" : "no";

  return `    <item>
      <g:id>${escapeXml(opts.id)}</g:id>
      <g:title>${escapeXml(opts.title.slice(0, 150))}</g:title>
      <g:description>${escapeXml(opts.description)}</g:description>
      <g:link>${escapeXml(opts.link)}</g:link>
      <g:image_link>${escapeXml(opts.image)}</g:image_link>
${opts.additional}
      <g:availability>${catalogAvailability(opts.inStock, "meta")}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${escapeXml(money)}</g:price>${sale}
      <g:brand>${opts.brand}</g:brand>
      <g:google_product_category>${escapeXml(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
      <g:product_type>${escapeXml("Kahve")}</g:product_type>
      <g:identifier_exists>${identifierExists}</g:identifier_exists>${gtin}${mpn}${group}${size}
    </item>`;
}

function variantItem(
  product: Product,
  variant: ProductVariant,
  brand: string,
) {
  const currency = product.currency || "TRY";
  const link = `${SITE_URL}/urunler/${product.slug}`;
  const image = productImage(product.imageUrl, product.slug);
  const titleBase = product.seoTitle || product.name;
  const title = variant.weightLabel
    ? `${titleBase} - ${variant.weightLabel}`
    : titleBase;
  const { price, salePrice } = catalogListAndSalePrice(
    variant.price,
    variant.compareAtPrice,
  );

  return buildItemXml({
    id: variant.sku || `${product.slug}-${variant.id}`,
    title,
    description: catalogProductDescription(product),
    link,
    image,
    additional: additionalImages(product),
    inStock: Number(variant.stock) > 0,
    price,
    salePrice,
    currency,
    brand,
    itemGroupId: product.slug,
    size: variant.weightLabel || undefined,
    mpn: variant.sku || undefined,
    gtin: variant.barcode,
  });
}

function productOnlyItem(product: Product, brand: string) {
  const currency = product.currency || "TRY";
  const link = `${SITE_URL}/urunler/${product.slug}`;
  const image = productImage(product.imageUrl, product.slug);
  const { price, salePrice } = catalogListAndSalePrice(
    product.salePrice ?? product.basePrice,
    product.compareAtPrice,
  );

  return buildItemXml({
    id: product.slug,
    title: product.seoTitle || product.name,
    description: catalogProductDescription(product),
    link,
    image,
    additional: additionalImages(product),
    inStock: Number(product.stock) > 0,
    price,
    salePrice,
    currency,
    brand,
    mpn: product.batchId || product.slug,
  });
}

export async function GET() {
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    fetchAllCatalogProducts(),
  ]);
  const brand = escapeXml(settings.brand.name);

  const items = products
    .filter((p) => p.isActive !== false)
    .flatMap((product) => {
      const variants = catalogActiveVariants(product);
      if (variants.length) {
        return variants.map((v) => variantItem(product, v, brand));
      }
      return [productOnlyItem(product, brand)];
    })
    .join("\n");

  const feedUrl = `${SITE_URL}/feed/meta-catalog.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${brand} Meta Catalog</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(settings.seo.description || brand)}</description>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
