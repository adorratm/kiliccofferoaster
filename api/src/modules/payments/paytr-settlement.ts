import { money, parseMoney } from '@modules/accounting/money';

export type PaytrSettlement = {
  provider: 'paytr';
  grossAmount: string;
  commissionRatePercent: string;
  commissionAmount: string;
  netAmount: string;
};

/** PayTR komisyonu brüt tutardan kesilir; komisyon 2 ondalığa yuvarlanır. */
export function calculatePaytrSettlement(
  gross: string | number,
  commissionRatePercent: string | number,
): PaytrSettlement {
  const grossNum = parseMoney(gross);
  const rate = parseMoney(commissionRatePercent);
  const commissionAmount = money((grossNum * rate) / 100);
  const netAmount = money(grossNum - parseMoney(commissionAmount));
  return {
    provider: 'paytr',
    grossAmount: money(grossNum),
    commissionRatePercent: rate.toFixed(2),
    commissionAmount,
    netAmount,
  };
}
