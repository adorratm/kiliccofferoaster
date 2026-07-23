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

export function isGrindOption(value: unknown): value is GrindOption {
  return (
    typeof value === 'string' &&
    (GRIND_OPTIONS as readonly string[]).includes(value)
  );
}

export function grindLabel(value?: string | null): string {
  if (!value) return GRIND_LABELS.whole_bean;
  return GRIND_LABELS[value] || value;
}
