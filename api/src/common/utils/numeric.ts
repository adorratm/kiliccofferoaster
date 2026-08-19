/** PostgreSQL numeric → JS number (stok gram/kg ondalığı). */
export const numericTransformer = {
  to: (value: number | string | null | undefined) => {
    if (value == null || value === '') return 0;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  },
  from: (value: string | number | null): number => {
    if (value == null || value === '') return 0;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  },
};
