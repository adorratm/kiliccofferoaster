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

export async function runUpdateCheck(opts?: {
  onStatus?: (status: string) => void;
}): Promise<UpdateCheckResult> {
  if (!Updates.isEnabled || __DEV__) {
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
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : 'Güncelleme kontrolü başarısız',
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
