import { Platform } from 'react-native';

const mem = new Map<string, string>();

function webGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return mem.get(key) ?? null;
  }
}

function webSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    mem.set(key, value);
  }
}

function webRemove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    mem.delete(key);
  }
}

async function nativeGet(key: string): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    const value = await SecureStore.getItemAsync(key);
    if (value != null) {
      mem.set(key, value);
      return value;
    }
  } catch {
    /* SecureStore yoksa bellek */
  }
  return mem.get(key) ?? null;
}

async function nativeSet(key: string, value: string): Promise<void> {
  mem.set(key, value);
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* bellek yedek */
  }
}

async function nativeRemove(key: string): Promise<void> {
  mem.delete(key);
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* bellek yedek */
  }
}

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webGet(key);
    return nativeGet(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') webSet(key, value);
    else await nativeSet(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') webRemove(key);
    else await nativeRemove(key);
  },
};

export default AsyncStorage;
