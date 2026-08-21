import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { BrandSplash } from './BrandSplash';
import { runUpdateCheck } from '../lib/updates';
import { colors } from '../ui';

type Props = {
  children: React.ReactNode;
};

export function BootGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await runUpdateCheck({
        onStatus: (s) => {
          if (!cancelled) setStatus(s);
        },
      });
      if (!cancelled) {
        setStatus('');
        setExiting(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onHidden = useCallback(() => setReady(true), []);

  if (ready) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BrandSplash status={status} exiting={exiting} onHidden={onHidden} />
    </View>
  );
}
