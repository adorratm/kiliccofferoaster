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

function feedTitle(product: Product, variant?: ProductVariant) {
  const base = (product.seoTitle || product.name).trim();
  const weight = variant?.weightLabel?.trim();
  if (weight && !base.toLocaleLowerCase("tr-TR").includes(weight.toLocaleLowerCase("tr-TR"))) {
    return `${base} ${weight} – Taze Kavrulmuş`.slice(0, 150);
  }
  if (product.seoTitle) return base.slice(0, 150);
  return `${base} – Taze Kavrulmuş Specialty Coffee`.slice(0, 150);
}

function itemXml(opts: {
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

  return `    <item>
      <g:id>${escapeXml(opts.id)}</g:id>
      <g:title>${escapeXml(opts.title)}</g:title>
      <g:description>${escapeXml(opts.description)}</g:description>
      <g:link>${escapeXml(opts.link)}</g:link>
      <g:image_link>${escapeXml(opts.image)}</g:image_link>
${opts.additional}
      <g:availability>${catalogAvailability(opts.inStock, "google")}</g:availability>
      <g:price>${escapeXml(money)}</g:price>${sale}
      <g:brand>${opts.brand}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${escapeXml(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
      <g:product_type>${escapeXml("Kahve > Specialty Coffee")}</g:product_type>${group}${size}
    </item>`;
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
      const link = `${SITE_URL}/urunler/${product.slug}`;
      const image = productImage(product.imageUrl, product.slug);
      const description = catalogProductDescription(product);
      const additional = (product.gallery || [])
        .filter((url) => url && url !== product.imageUrl)
        .slice(0, 9)
        .map(
          (url) =>
            `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
        )
        .join("\n");
      const currency = product.currency || "TRY";
      const variants = catalogActiveVariants(product);

      if (variants.length) {
        return variants.map((v) => {
          const { price, salePrice } = catalogListAndSalePrice(
            v.price,
            v.compareAtPrice,
          );
          return itemXml({
            id: v.sku || `${product.slug}-${v.id}`,
            title: feedTitle(product, v),
            description,
            link,
            image,
            additional,
            inStock: Number(v.stock) > 0,
            price,
            salePrice,
            currency,
            brand,
            itemGroupId: product.slug,
            size: v.weightLabel || undefined,
          });
        });
      }

      const { price, salePrice } = catalogListAndSalePrice(
        product.salePrice ?? product.basePrice,
        product.compareAtPrice,
      );
      return [
        itemXml({
          id: product.slug,
          title: feedTitle(product),
          description,
          link,
          image,
          additional,
          inStock: Number(product.stock) > 0,
          price,
          salePrice,
          currency,
          brand,
        }),
      ];
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${brand}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(settings.seo.description || brand)}</description>
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
