import { useCallback, useEffect, useState } from 'react';
import { BrandSplash } from './BrandSplash';

type Props = {
  children: React.ReactNode;
};

export function BootGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    const ops = window.ops;

    const finish = () => {
      if (!cancelled) {
        setStatus('');
        setExiting(true);
      }
    };

    if (!ops?.checkForUpdate) {
      finish();
      return;
    }

    const unsub = ops.onUpdateEvent?.((event) => {
      if (cancelled) return;
      switch (event.type) {
        case 'checking':
          setStatus('Güncelleme kontrol ediliyor…');
          break;
        case 'available':
          setStatus(
            event.version
              ? `Güncelleme indiriliyor (${event.version})…`
              : 'Güncelleme indiriliyor…',
          );
          break;
        case 'progress':
          setStatus(
            event.percent != null
              ? `İndiriliyor… %${Math.round(event.percent)}`
              : 'İndiriliyor…',
          );
          break;
        case 'downloaded':
          setStatus('Kuruluyor…');
          break;
        case 'not-available':
        case 'disabled':
          finish();
          break;
        case 'error':
          setStatus(event.message || 'Güncelleme hatası');
          window.setTimeout(finish, 600);
          break;
      }
    });

    void ops.checkForUpdate().then((result) => {
      if (cancelled) return;
      if (result === 'up-to-date' || result === 'disabled' || result === 'error') {
        finish();
      }
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const onHidden = useCallback(() => setReady(true), []);

  if (ready) return <>{children}</>;

  return <BrandSplash status={status} exiting={exiting} onHidden={onHidden} />;
}
