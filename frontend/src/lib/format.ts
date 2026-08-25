import { stockProductFallback } from "@/lib/stock-images";

/**
 * CSS `text-transform: uppercase` ve `toUpperCase()` Türkçe locale’de
 * Latin "i" → "İ" yapar. İngilizce metinde en-US, Türkçe karakterli metinde tr-TR.
 */
export function displayUpper(text: string): string {
  if (/[şğıüöçıİŞĞÜÖÇ]/.test(text)) {
    return text.toLocaleUpperCase("tr-TR");
  }
  return text.toLocaleUpperCase("en-US");
}

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
    !url.includes("unsplash.com") &&
    !url.includes("aida-public") &&
    !url.includes("lh3.googleusercontent.com/aida")
  ) {
    return url;
  }
  return stockProductFallback(seed);
}
