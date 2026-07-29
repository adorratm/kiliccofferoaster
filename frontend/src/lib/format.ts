import { stockProductFallback } from "@/lib/stock-images";

export function formatMoney(
  amount: string | number | null | undefined,
  currency = "TRY",
) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function productImage(url: string | null | undefined, seed = "coffee") {
  if (
    url &&
    !url.includes("aida-public") &&
    !url.includes("lh3.googleusercontent.com/aida")
  ) {
    return url;
  }
  return stockProductFallback(seed);
}
