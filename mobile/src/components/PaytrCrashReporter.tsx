import { useEffect } from 'react';
import { Alert } from 'react-native';
import { consumePaytrCrashHint } from '../lib/paytr-diag';

/** Açılışta: ödeme sırasında native crash olduysa kullanıcıya göster + API’ye yaz. */
export function PaytrCrashReporter() {
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        const hint = await consumePaytrCrashHint();
        if (!cancelled && hint) {
          Alert.alert('Ödeme sırasında uygulama kapandı', hint.message);
        }
      })();
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return null;
}
