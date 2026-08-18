import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import AsyncStorage from './storage';

const TOKEN_STORE = 'ops_expo_push_token';

function projectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId
  );
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayılan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#cc5b3e',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return null;

  const pid = projectId();
  if (!pid) return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: pid })).data;
  await api('/notifications/devices', {
    method: 'POST',
    body: {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    },
  });
  await AsyncStorage.setItem(TOKEN_STORE, token);
  return token;
}

export async function unregisterPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_STORE);
  if (!token) return;
  try {
    await api('/notifications/devices', { method: 'DELETE', body: { token } });
  } catch {
    /* oturum zaten düşmüş olabilir */
  }
  await AsyncStorage.removeItem(TOKEN_STORE);
}
