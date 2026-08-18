export const GRIND_OPTIONS = [
  { value: 'whole_bean', label: 'Çekirdek' },
  { value: 'ground', label: 'Öğütülmüş' },
] as const;

export type GrindValue = (typeof GRIND_OPTIONS)[number]['value'];

export function grindLabel(value?: string | null) {
  if (!value) return 'Çekirdek';
  return GRIND_OPTIONS.find((g) => g.value === value)?.label || value;
}
