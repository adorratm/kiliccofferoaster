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

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webGet(key);
    return mem.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') webSet(key, value);
    else mem.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') webRemove(key);
    else mem.delete(key);
  },
};

export default AsyncStorage;
