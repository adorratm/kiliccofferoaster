import { io, type Socket } from 'socket.io-client';
import { API_URL, api, getToken } from './api';

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  type: string;
  readAt?: string | null;
  createdAt?: string;
};

export type NotificationPrefs = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  opsOrdersEnabled: boolean;
  opsReturnsEnabled: boolean;
  opsMessagesEnabled: boolean;
  opsReviewsEnabled: boolean;
  opsStockEnabled: boolean;
};

const listeners = new Set<() => void>();

export function onInboxRefresh(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitInboxRefresh() {
  listeners.forEach((fn) => fn());
}

export async function connectNotifySocket(): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;
  return io(`${API_URL}/notify`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

export async function fetchInbox() {
  return api<{ items: InboxItem[] }>('/notifications/inbox?page=1&limit=40');
}

export async function fetchUnread() {
  return api<{ count: number }>('/notifications/inbox/unread-count');
}

export async function fetchPrefs() {
  return api<NotificationPrefs>('/notifications/preferences');
}
