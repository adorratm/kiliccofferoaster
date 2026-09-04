import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { API_URL, getShopSessionId } from './api';

export type ClientEventPayload = {
  event: string;
  orderNumber?: string;
  meta?: Record<string, unknown>;
};

/** Fire-and-forget — crash yolunda bekletmesin. */
export function reportClientEvent(payload: ClientEventPayload): void {
  void (async () => {
    try {
      const sessionId = await getShopSessionId().catch(() => null);
      await fetch(`${API_URL}/mobile/client-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: payload.event,
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version ?? null,
          runtimeVersion: Updates.runtimeVersion ?? null,
          updateChannel: Updates.channel ?? null,
          orderNumber: payload.orderNumber ?? null,
          sessionId,
          meta: {
            ...payload.meta,
            executionEnvironment: Constants.executionEnvironment,
            __DEV__,
          },
        }),
      });
    } catch {
      /* diag asla ana akışı bozmasın */
    }
  })();
}
