const COFFEE_KINDS = [
  'coffee_turkish',
  'coffee_filter',
  'coffee_espresso',
] as const;

export function supportsRoast(kind?: string | null): boolean {
  return !!kind && (COFFEE_KINDS as readonly string[]).includes(kind);
}

export const ROAST_OPTIONS = [
  { value: 'orta', label: 'Orta' },
  { value: 'orta_koyu', label: 'Orta-Koyu' },
  { value: 'koyu', label: 'Koyu' },
] as const;

export type RoastValue = (typeof ROAST_OPTIONS)[number]['value'];

export function availableRoastOptions(
  kind?: string | null,
  allowRoastMediumDark?: boolean | null,
  allowRoastDark?: boolean | null,
) {
  if (!supportsRoast(kind)) return [];
  if (kind === 'coffee_turkish' || kind === 'coffee_filter') {
    return ROAST_OPTIONS.filter((r) => r.value === 'orta');
  }
  return ROAST_OPTIONS.filter((r) => {
    if (r.value === 'orta_koyu') return allowRoastMediumDark !== false;
    if (r.value === 'koyu') return allowRoastDark !== false;
    return false;
  });
}

export function showRoastPicker(kind?: string | null, choicesLength = 0) {
  return kind === 'coffee_espresso' && choicesLength > 0;
}

export function roastLabel(value?: string | null) {
  if (!value) return 'Orta';
  return ROAST_OPTIONS.find((r) => r.value === value)?.label || value;
}
