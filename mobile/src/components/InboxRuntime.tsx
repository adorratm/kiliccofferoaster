import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { connectNotifySocket, emitInboxRefresh, type InboxItem } from '../lib/inbox';
import { openOpsHref } from '../lib/navigation';
import { registerPushToken } from '../lib/push';

export function InboxRuntime() {
  useEffect(() => {
    let socket: Awaited<ReturnType<typeof connectNotifySocket>> = null;
    void registerPushToken().catch(() => undefined);
    void connectNotifySocket().then((s) => {
      socket = s;
      s?.on('notify:new', (_row: InboxItem) => emitInboxRefresh());
    });

    let received: { remove: () => void } | undefined;
    let response: { remove: () => void } | undefined;
    let cancelled = false;

    if (Platform.OS !== 'web') {
      void import('expo-notifications').then((Notifications) => {
        if (cancelled) return;
        received = Notifications.addNotificationReceivedListener(() => emitInboxRefresh());
        response = Notifications.addNotificationResponseReceivedListener((res) => {
          const data = res.notification.request.content.data as { href?: string };
          openOpsHref(typeof data?.href === 'string' ? data.href : null);
        });
        void Notifications.getLastNotificationResponseAsync().then(async (last) => {
          const href = last?.notification.request.content.data?.href;
          if (typeof href === 'string') openOpsHref(href);
          await Notifications.clearLastNotificationResponseAsync();
        });
      });
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        emitInboxRefresh();
        void registerPushToken().catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
      received?.remove();
      response?.remove();
      sub.remove();
    };
  }, []);

  return null;
}
