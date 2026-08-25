/** "250g", "1 kg", "500gr" → gram cinsinden sıralama anahtarı */
export function weightSortKey(label?: string | null): number {
  if (!label?.trim()) return Number.POSITIVE_INFINITY;
  const raw = label.trim().toLowerCase().replace(/\s+/g, "");
  const match = raw.match(/^(\d+(?:[.,]\d+)?)(kg|g|gr|gram|ml|l|lt)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  let value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  const unit = match[2] || "g";
  if (unit === "kg" || unit === "l" || unit === "lt") value *= 1000;
  return value;
}

export function sortByWeightLabel<T extends { weightLabel?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => weightSortKey(a.weightLabel) - weightSortKey(b.weightLabel),
  );
}
