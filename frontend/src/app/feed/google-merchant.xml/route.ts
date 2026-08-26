import {
  catalogActiveVariants,
  catalogAvailability,
  catalogProductDescription,
  escapeXml,
  fetchAllCatalogProducts,
  formatCatalogMoney,
} from "@/lib/catalog-feed";
import { getSiteSettings } from "@/lib/cms";
import { productImage } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    fetchAllCatalogProducts(),
  ]);
  const brand = escapeXml(settings.brand.name);

  const items = products
    .filter((p) => p.isActive !== false)
    .map((product) => {
      const active = catalogActiveVariants(product);
      const inStock =
        active.some((v) => Number(v.stock) > 0) || Number(product.stock) > 0;
      const currency = product.currency || "TRY";
      const price = formatCatalogMoney(
        active[0]?.price ?? product.salePrice ?? product.basePrice ?? 0,
        currency,
      );
      const link = `${SITE_URL}/urunler/${product.slug}`;
      const image = productImage(product.imageUrl, product.slug);
      const description = escapeXml(catalogProductDescription(product));
      const additional = (product.gallery || [])
        .filter((url) => url && url !== product.imageUrl)
        .slice(0, 9)
        .map(
          (url) =>
            `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
        )
        .join("\n");

      return `    <item>
      <g:id>${escapeXml(product.slug)}</g:id>
      <g:title>${escapeXml((product.seoTitle || product.name).slice(0, 150))}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
${additional}
      <g:availability>${catalogAvailability(inStock, "google")}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${escapeXml("Kahve")}</g:product_type>
    </item>`;
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
