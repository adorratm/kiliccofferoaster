import { contextBridge, ipcRenderer } from 'electron';

export type OpsUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
};

contextBridge.exposeInMainWorld('ops', {
  getApiUrl: () => ipcRenderer.invoke('ops:get-api-url') as Promise<string>,
  outboxList: () => ipcRenderer.invoke('ops:outbox-list'),
  outboxAdd: (row: {
    id: string;
    collection: string;
    action: string;
    payload: string;
    updated_at: string;
  }) => ipcRenderer.invoke('ops:outbox-add', row),
  outboxClear: (ids: string[]) => ipcRenderer.invoke('ops:outbox-clear', ids),
  cacheGet: (collection: string) => ipcRenderer.invoke('ops:cache-get', collection),
  cacheSet: (collection: string, rows: unknown[]) =>
    ipcRenderer.invoke('ops:cache-set', collection, rows),
  metaGet: (key: string) => ipcRenderer.invoke('ops:meta-get', key) as Promise<string | null>,
  metaSet: (key: string, value: string) => ipcRenderer.invoke('ops:meta-set', key, value),
  googleLogin: () => ipcRenderer.invoke('ops:google-login') as Promise<{ token: string }>,
  saveOfflineSession: (input: {
    email: string;
    token: string;
    user: OpsUser;
    password?: string;
  }) => ipcRenderer.invoke('ops:save-offline-session', input) as Promise<void>,
  verifyOfflinePassword: (email: string, password: string) =>
    ipcRenderer.invoke('ops:verify-offline-password', { email, password }) as Promise<{
      token: string;
      user: OpsUser;
    } | null>,
  offlineEmail: () => ipcRenderer.invoke('ops:offline-email') as Promise<string | null>,
  hasOfflinePassword: () => ipcRenderer.invoke('ops:has-offline-password') as Promise<boolean>,
  showNotification: (payload: { title: string; body: string; href?: string | null }) =>
    ipcRenderer.invoke('ops:show-notification', payload) as Promise<void>,
  onNotificationClick: (fn: (href: string) => void) => {
    const listener = (_event: unknown, href: string) => fn(href);
    ipcRenderer.on('ops:notification-click', listener);
    return () => ipcRenderer.removeListener('ops:notification-click', listener);
  },
});

export {};
