import { getProductsPaged } from "@/lib/api";
import type { Product, ProductVariant } from "@/lib/types";

export async function fetchAllCatalogProducts(): Promise<Product[]> {
  const limit = 100;
  const first = await getProductsPaged({ page: 1, limit }).catch(() => null);
  if (!first?.items?.length) return [];
  const pages = Math.max(1, first.totalPages || 1);
  if (pages === 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      getProductsPaged({ page: i + 2, limit }).catch(() => ({
        items: [] as Product[],
      })),
    ),
  );
  return [...first.items, ...rest.flatMap((p) => p.items)];
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function catalogProductDescription(product: Product, max = 5000) {
  return (
    product.seoDescription ||
    product.shortDescription ||
    (product.description ? stripHtml(product.description) : "") ||
    product.name
  ).slice(0, max);
}

export function catalogActiveVariants(product: Product): ProductVariant[] {
  return (product.variants || []).filter((v) => v.isActive !== false);
}

/** Meta: `in stock` / `out of stock`; Google: `in_stock` / `out_of_stock` */
export function catalogAvailability(
  inStock: boolean,
  style: "meta" | "google",
) {
  if (style === "meta") return inStock ? "in stock" : "out of stock";
  return inStock ? "in_stock" : "out_of_stock";
}

export function formatCatalogMoney(amount: string | number, currency: string) {
  return `${Number(amount).toFixed(2)} ${currency || "TRY"}`;
}

/**
 * Kampanyalı varyantlarda API `price` = indirimli, `compareAtPrice` = liste.
 * Meta/Google: `price` liste, `sale_price` indirimli.
 */
export function catalogListAndSalePrice(
  currentPrice: string | number,
  compareAtPrice?: string | number | null,
): { price: string; salePrice?: string } {
  const current = Number(currentPrice).toFixed(2);
  const compare =
    compareAtPrice != null && compareAtPrice !== ""
      ? Number(compareAtPrice).toFixed(2)
      : null;
  if (compare && Number(compare) > Number(current)) {
    return { price: compare, salePrice: current };
  }
  return { price: current };
}
