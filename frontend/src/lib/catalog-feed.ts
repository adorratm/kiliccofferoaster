import { getProductsPaged } from "@/lib/api";
import type { Product } from "@/lib/types";

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
