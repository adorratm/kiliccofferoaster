import AsyncStorage from './storage';
import { reportClientEvent } from './client-events';

const KEY = 'paytr_open_diag';
const STALE_MS = 10 * 60 * 1000;

type Diag = {
  at: number;
  mode: 'in_app' | 'external';
  orderNumber?: string;
};

/** Ödeme açılmadan hemen önce — native crash olursa sonraki açılışta uyarırız. */
export async function markPaytrOpening(
  mode: 'in_app' | 'external',
  orderNumber?: string,
): Promise<void> {
  const payload: Diag = { at: Date.now(), mode, orderNumber };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  reportClientEvent({
    event: 'paytr_open_attempt',
    orderNumber,
    meta: { mode },
  });
}

/** Ödeme akışı JS tarafında bitti (sheet kapandı / Safari’ye gidildi). */
export async function markPaytrSettled(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  reportClientEvent({ event: 'paytr_open_settled' });
}

export type PaytrCrashHint = {
  message: string;
  mode: 'in_app' | 'external';
  orderNumber?: string;
  openedAt: number;
};

/**
 * Uygulama yeniden açıldığında: işaret duruyorsa native crash ihtimali yüksek.
 */
export async function consumePaytrCrashHint(): Promise<PaytrCrashHint | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    const data = JSON.parse(raw) as Diag;
    if (!data?.at || Date.now() - data.at > STALE_MS) return null;

    const where =
      data.mode === 'in_app'
        ? 'uygulama içi ödeme penceresi (SFSafariViewController)'
        : 'sistem Safari yönlendirmesi';
    const order = data.orderNumber ? ` Sipariş: ${data.orderNumber}.` : '';

    const message =
      `Ödeme açılırken uygulama kapandı (${where}).` +
      order +
      ' Bu JS hatası değil; iOS native çökme olasılığı yüksek.';

    reportClientEvent({
      event: 'paytr_suspected_native_crash',
      orderNumber: data.orderNumber,
      meta: {
        mode: data.mode,
        openedAt: data.at,
        gapMs: Date.now() - data.at,
      },
    });

    return {
      message,
      mode: data.mode,
      orderNumber: data.orderNumber,
      openedAt: data.at,
    };
  } catch {
    return null;
  }
}
