export const COFFEE_KINDS = [
  'coffee_turkish',
  'coffee_filter',
  'coffee_espresso',
] as const;

export const GRIND_OPTIONS = ['whole_bean', 'ground'] as const;

export type GrindOption = (typeof GRIND_OPTIONS)[number];

/** Sepet/sipariş doğrulama — eski değerler hâlâ kabul edilir */
export const ACCEPTED_GRIND_OPTIONS = [
  ...GRIND_OPTIONS,
  'filter',
  'espresso',
  'turkish',
] as const;

export const GRIND_LABELS: Record<string, string> = {
  whole_bean: 'Çekirdek',
  ground: 'Öğütülmüş',
  filter: 'Filtre',
  espresso: 'Espresso',
  turkish: 'Öğütülmüş',
};

export type GrindAvailability = {
  allowWholeBean?: boolean | null;
  allowGround?: boolean | null;
};

export function isGrindOption(value: unknown): value is GrindOption {
  return (
    typeof value === 'string' &&
    (GRIND_OPTIONS as readonly string[]).includes(value)
  );
}

export function supportsGrind(kind?: string | null): boolean {
  return !!kind && (COFFEE_KINDS as readonly string[]).includes(kind);
}

/** Legacy değerleri modern seçeneklere çevirir */
export function normalizeGrindOption(
  grind?: string | null,
): GrindOption | null {
  if (!grind) return null;
  if (isGrindOption(grind)) return grind;
  if (grind === 'turkish' || grind === 'filter' || grind === 'espresso') {
    return 'ground';
  }
  return null;
}

export function availableGrindOptions(
  kind?: string | null,
  availability?: GrindAvailability | null,
): GrindOption[] {
  if (!supportsGrind(kind)) return [];
  const opts: GrindOption[] = [];
  if (availability?.allowWholeBean !== false) opts.push('whole_bean');
  if (availability?.allowGround !== false) opts.push('ground');
  return opts;
}

export function isGrindAllowed(
  kind?: string | null,
  grind?: string | null,
  availability?: GrindAvailability | null,
): boolean {
  const available = availableGrindOptions(kind, availability);
  if (available.length === 0) return grind == null || grind === '';
  const normalized = normalizeGrindOption(grind);
  return !!normalized && available.includes(normalized);
}

export function resolveGrindOption(
  kind?: string | null,
  grind?: string | null,
  availability?: GrindAvailability | null,
): string | null {
  const available = availableGrindOptions(kind, availability);
  if (available.length === 0) return null;
  const normalized = normalizeGrindOption(grind);
  if (normalized && available.includes(normalized)) {
    return isGrindOption(grind) ? grind : normalized;
  }
  return available[0];
}

export function grindMatchKey(
  kind?: string | null,
  grind?: string | null,
  availability?: GrindAvailability | null,
): string {
  const resolved = resolveGrindOption(kind, grind, availability);
  return resolved ?? '_none_';
}

export function grindLabel(value?: string | null): string {
  if (!value) return GRIND_LABELS.whole_bean;
  return GRIND_LABELS[value] || value;
}
