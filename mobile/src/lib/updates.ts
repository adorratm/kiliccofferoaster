import * as Updates from 'expo-updates';

export type UpdateCheckResult =
  | { kind: 'disabled' }
  | { kind: 'up-to-date' }
  | { kind: 'applied' }
  | { kind: 'error'; message: string };

const CHECK_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Zaman aşımı')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message && e.message !== 'undefined') {
    const msg = e.message.trim();
    // Native: "err_updates_check: undefined reason" / empty localizedDescription
    if (/err_updates_check/i.test(msg) && /undefined/i.test(msg)) {
      return 'Güncelleme sunucusuna ulaşılamadı. Yeni bir store/EAS derlemesi gerekebilir.';
    }
    if (msg && msg !== 'undefined reason') return msg;
  }
  if (e && typeof e === 'object') {
    const any = e as { code?: string; message?: string; reason?: string };
    if (any.message && any.message !== 'undefined') return any.message;
    if (any.code === 'ERR_UPDATES_CHECK' || any.code === 'ERR_UPDATES_FETCH') {
      return 'Güncelleme kontrolü başarısız (sunucu veya kanal yapılandırması).';
    }
    if (any.code === 'ERR_UPDATES_DISABLED' || any.code === 'ERR_NOT_AVAILABLE_IN_DEV_CLIENT') {
      return 'Bu derlemede OTA güncelleme kapalı.';
    }
  }
  return 'Güncelleme kontrolü başarısız.';
}

export async function runUpdateCheck(opts?: {
  onStatus?: (status: string) => void;
}): Promise<UpdateCheckResult> {
  // Dev client / Expo Go: native check throws noisy errors
  if (__DEV__ || !Updates.isEnabled) {
    return { kind: 'disabled' };
  }

  try {
    opts?.onStatus?.('Güncelleme kontrol ediliyor…');
    const result = await withTimeout(Updates.checkForUpdateAsync(), CHECK_TIMEOUT_MS);
    if (!result.isAvailable) {
      return { kind: 'up-to-date' };
    }
    opts?.onStatus?.('Güncelleme indiriliyor…');
    await withTimeout(Updates.fetchUpdateAsync(), CHECK_TIMEOUT_MS * 2);
    opts?.onStatus?.('Yeniden başlatılıyor…');
    await Updates.reloadAsync();
    return { kind: 'applied' };
  } catch (e) {
    // Açılışı engelleme — sessizce devam; manuel kontrol mesajı gösterir
    return {
      kind: 'error',
      message: errorMessage(e),
    };
  }
}

export async function manualUpdateCheck(): Promise<string> {
  const result = await runUpdateCheck();
  switch (result.kind) {
    case 'disabled':
      return 'Geliştirme derlemesinde OTA kapalı.';
    case 'up-to-date':
      return 'Uygulama güncel.';
    case 'applied':
      return 'Güncelleme uygulandı.';
    case 'error':
      return result.message;
  }
}
