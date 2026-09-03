export type BrewGuide = {
  method?: string;
  grind?: string;
  ratio?: string;
  notes?: string;
};

export function asBrewGuide(raw: unknown): BrewGuide | null {
  if (!raw || typeof raw !== 'object') return null;
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
