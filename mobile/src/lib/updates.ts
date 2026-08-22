import Constants from 'expo-constants';
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

function diagSuffix(): string {
  const parts = [
    Updates.channel ? `kanal=${Updates.channel}` : 'kanal=yok',
    Updates.runtimeVersion ? `runtime=${Updates.runtimeVersion}` : null,
  ].filter(Boolean);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

function isDevClientBuild(): boolean {
  // developmentClient profili / Expo Go
  const env = Constants.executionEnvironment;
  if (env === 'storeClient') return true;
  // channel null + updates "enabled" gibi görünen bozuk native yapılandırmalar
  if (!__DEV__ && Updates.isEnabled && !Updates.channel) return true;
  return false;
}

function errorMessage(e: unknown): string {
  const suffix = diagSuffix();

  if (e instanceof Error && e.message && e.message !== 'undefined') {
    const msg = e.message.trim();
    if (/err_updates_check|ERR_UPDATES_CHECK/i.test(msg)) {
      if (isDevClientBuild() || !Updates.channel) {
        return `OTA bu derlemede çalışmıyor. preview veya production profiliyle kurulan APK/IPA kullanın; development client’ta güncelleme yok.${suffix}`;
      }
      return `Güncelleme sunucusuna ulaşılamadı. Kanalda henüz publish yoksa veya runtime uyuşmuyorsa da olur. Önce: eas update --channel ${Updates.channel || 'preview'}${suffix}`;
    }
    if (/ERR_NOT_AVAILABLE_IN_DEV_CLIENT|ERR_UPDATES_DISABLED/i.test(msg)) {
      return `Bu derlemede OTA kapalı (development / Expo Go).${suffix}`;
    }
    if (msg && msg !== 'undefined reason' && !/^undefined$/i.test(msg)) {
      return `${msg}${suffix}`;
    }
  }

  if (e && typeof e === 'object') {
    const any = e as { code?: string; message?: string };
    if (any.code === 'ERR_NOT_AVAILABLE_IN_DEV_CLIENT' || any.code === 'ERR_UPDATES_DISABLED') {
      return `Bu derlemede OTA kapalı.${suffix}`;
    }
    if (any.code === 'ERR_UPDATES_CHECK' || any.code === 'ERR_UPDATES_FETCH') {
      if (!Updates.channel) {
        return `OTA kanalı gömülü değil — development client olabilir. preview/production build kullanın.${suffix}`;
      }
      return `Güncelleme kontrolü başarısız. eas update --channel ${Updates.channel} ile bir OTA yayınlayın.${suffix}`;
    }
    if (any.message && any.message !== 'undefined') return `${any.message}${suffix}`;
  }

  return `Güncelleme kontrolü başarısız.${suffix}`;
}

export async function runUpdateCheck(opts?: {
  onStatus?: (status: string) => void;
}): Promise<UpdateCheckResult> {
  if (__DEV__) {
    return { kind: 'disabled' };
  }

  if (!Updates.isEnabled || isDevClientBuild()) {
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
      message: errorMessage(e),
    };
  }
}

export async function manualUpdateCheck(): Promise<string> {
  const result = await runUpdateCheck();
  switch (result.kind) {
    case 'disabled':
      if (__DEV__) {
        return 'Metro / geliştirme oturumunda OTA kapalı. Store veya preview/production APK’da deneyin.';
      }
      if (!Updates.channel) {
        return 'Bu derlemede EAS Update kanalı yok (genelde development client). eas build --profile preview veya production ile kurun.';
      }
      return 'Bu derlemede OTA kapalı.';
    case 'up-to-date':
      return `Uygulama güncel.${diagSuffix()}`;
    case 'applied':
      return 'Güncelleme uygulandı.';
    case 'error':
      return result.message;
  }
}
