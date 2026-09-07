import { COFFEE_KINDS } from '@common/constants/grind-options';

export const ROAST_OPTIONS = ['orta', 'orta_koyu', 'koyu'] as const;

export type RoastOption = (typeof ROAST_OPTIONS)[number];

export const ROAST_LABELS: Record<RoastOption, string> = {
  orta: 'Orta',
  orta_koyu: 'Orta-Koyu',
  koyu: 'Koyu',
};

/** Filtre / Türk: sabit Orta. Espresso: panelden açılan Orta-Koyu / Koyu. */
export type RoastAvailability = {
  allowRoastMediumDark?: boolean | null;
  allowRoastDark?: boolean | null;
};

export function isRoastOption(value: unknown): value is RoastOption {
  return (
    typeof value === 'string' &&
    (ROAST_OPTIONS as readonly string[]).includes(value)
  );
}

export function supportsRoast(kind?: string | null): boolean {
  return !!kind && (COFFEE_KINDS as readonly string[]).includes(kind);
}

export function availableRoastOptions(
  kind?: string | null,
  availability?: RoastAvailability | null,
): RoastOption[] {
  if (!supportsRoast(kind)) return [];
  if (kind === 'coffee_turkish' || kind === 'coffee_filter') {
    return ['orta'];
  }
  const opts: RoastOption[] = [];
  if (availability?.allowRoastMediumDark !== false) opts.push('orta_koyu');
  if (availability?.allowRoastDark !== false) opts.push('koyu');
  return opts;
}

export function isRoastAllowed(
  kind?: string | null,
  roast?: string | null,
  availability?: RoastAvailability | null,
): boolean {
  const available = availableRoastOptions(kind, availability);
  if (available.length === 0) return roast == null || roast === '';
  return !!roast && isRoastOption(roast) && available.includes(roast);
}

export function resolveRoastOption(
  kind?: string | null,
  roast?: string | null,
  availability?: RoastAvailability | null,
): string | null {
  const available = availableRoastOptions(kind, availability);
  if (available.length === 0) return null;
  if (roast && isRoastOption(roast) && available.includes(roast)) {
    return roast;
  }
  return available[0];
}

export function roastMatchKey(
  kind?: string | null,
  roast?: string | null,
  availability?: RoastAvailability | null,
): string {
  const resolved = resolveRoastOption(kind, roast, availability);
  return resolved ?? '_none_';
}

export function roastLabel(value?: string | null): string {
  if (!value) return ROAST_LABELS.orta;
  if (isRoastOption(value)) return ROAST_LABELS[value];
  return value;
}

/** Meta alan / varsayılan gösterim metni */
export function defaultRoastLevelForKind(kind?: string | null): string | null {
  if (kind === 'coffee_turkish' || kind === 'coffee_filter') return 'Orta';
  if (kind === 'coffee_espresso') return 'Orta-Koyu';
  return null;
}
