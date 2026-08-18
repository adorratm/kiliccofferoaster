export function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** KDV dahil birim fiyattan satır net / KDV / toplam. */
export function lineFromGross(params: {
  quantity: number;
  unitPrice: number;
  vatRate: number;
}): { lineNet: string; lineVat: string; lineTotal: string } {
  const lineTotalNum = params.quantity * params.unitPrice;
  const divisor = 1 + params.vatRate / 100;
  const lineNetNum = params.vatRate <= 0 ? lineTotalNum : lineTotalNum / divisor;
  const lineVatNum = lineTotalNum - lineNetNum;
  return {
    lineNet: money(lineNetNum),
    lineVat: money(lineVatNum),
    lineTotal: money(lineTotalNum),
  };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
