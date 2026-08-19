import { useEffect } from 'react';
import { AppState } from 'react-native';
import { flushOutbox, pendingCount } from '../lib/sync';

/** Personel outbox’ını online / ön plana gelince API’ye iter */
export function AccountingSyncRuntime() {
  useEffect(() => {
    const tick = async () => {
      try {
        const pending = await pendingCount();
        if (pending > 0) await flushOutbox();
      } catch {
        /* çevrimdışı veya ops JWT yok */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 15000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  return null;
}
