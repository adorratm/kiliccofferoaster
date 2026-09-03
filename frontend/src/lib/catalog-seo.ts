import type { Product } from "@/lib/types";

export type BrewGuide = {
  method?: string;
  grind?: string;
  ratio?: string;
  notes?: string;
};

export const PRODUCT_KIND_LABELS: Record<string, string> = {
  coffee_turkish: "Türk kahvesi",
  coffee_filter: "Filtre kahve",
  coffee_espresso: "Espresso",
  lokum: "Lokum",
  draje: "Draje",
  nuts: "Kuruyemiş",
  herbal_tea: "Bitki çayı",
  spice: "Baharat",
  beverage: "Meşrubat",
  tea: "Çay",
  other: "Diğer",
};

const GOOGLE_CATEGORY_COFFEE =
  "Food, Beverages & Tobacco > Beverages > Coffee & Tea > Coffee";
const GOOGLE_CATEGORY_TEA =
  "Food, Beverages & Tobacco > Beverages > Coffee & Tea > Tea";
const GOOGLE_CATEGORY_CANDY =
  "Food, Beverages & Tobacco > Food Items > Candy";
const GOOGLE_CATEGORY_NUTS =
  "Food, Beverages & Tobacco > Food Items > Nuts & Seeds";
const GOOGLE_CATEGORY_SPICE =
  "Food, Beverages & Tobacco > Food Items > Seasonings & Spices";
const GOOGLE_CATEGORY_BEVERAGE =
  "Food, Beverages & Tobacco > Beverages";

export function productKindLabel(kind?: string | null): string | null {
  if (!kind) return null;
  return PRODUCT_KIND_LABELS[kind] || null;
}

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function googleProductCategory(kind?: string | null): string {
  switch (kind) {
    case "lokum":
    case "draje":
      return GOOGLE_CATEGORY_CANDY;
    case "nuts":
      return GOOGLE_CATEGORY_NUTS;
    case "herbal_tea":
    case "tea":
      return GOOGLE_CATEGORY_TEA;
    case "spice":
      return GOOGLE_CATEGORY_SPICE;
    case "beverage":
      return GOOGLE_CATEGORY_BEVERAGE;
    default:
      return GOOGLE_CATEGORY_COFFEE;
  }
}

export function merchantProductType(product: Product): string {
  const category = product.category?.name?.trim();
  const kind = productKindLabel(product.kind);
  if (category && kind && category !== kind) {
    return `${category} > ${kind}`;
  }
  if (category) return category;
  if (kind) return `Kahve > ${kind}`;
  return "Kahve > Specialty Coffee";
}

export function productGtin(product: Product): string | null {
  const own = product.barcode?.trim();
  if (own) return own;
  const fromVariant = (product.variants || [])
    .map((v) => v.barcode?.trim())
    .find(Boolean);
  return fromVariant || null;
}

export function asBrewGuide(raw: unknown): BrewGuide | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as BrewGuide;
  const guide: BrewGuide = {
    method: row.method?.trim() || undefined,
    grind: row.grind?.trim() || undefined,
    ratio: row.ratio?.trim() || undefined,
    notes: row.notes?.trim() || undefined,
  };
  if (!guide.method && !guide.grind && !guide.ratio && !guide.notes) {
    return null;
  }
  return guide;
}
