const COFFEE_KINDS = [
  'coffee_turkish',
  'coffee_filter',
  'coffee_espresso',
] as const;

export function supportsGrind(kind?: string | null): boolean {
  return !!kind && (COFFEE_KINDS as readonly string[]).includes(kind);
}

export const GRIND_OPTIONS = [
  { value: 'whole_bean', label: 'Çekirdek' },
  { value: 'ground', label: 'Öğütülmüş' },
] as const;

export type GrindValue = (typeof GRIND_OPTIONS)[number]['value'];

export function availableGrindOptions(
  kind?: string | null,
  allowWholeBean?: boolean | null,
  allowGround?: boolean | null,
) {
  if (!supportsGrind(kind)) return [];
  return GRIND_OPTIONS.filter((g) => {
    if (g.value === 'whole_bean') return allowWholeBean !== false;
    if (g.value === 'ground') return allowGround !== false;
    return false;
  });
}

export function grindLabel(value?: string | null) {
  if (!value) return 'Çekirdek';
  return GRIND_OPTIONS.find((g) => g.value === value)?.label || value;
}
