import { io, type Socket } from 'socket.io-client';
import { api, apiUrl, getToken } from './api';

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

export async function connectNotifySocket(): Promise<Socket | null> {
  const token = getToken();
  if (!token) return null;
  const base = await apiUrl();
  return io(`${base}/notify`, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: 8,
  });
}

export async function fetchInbox() {
  return api<{ items: InboxItem[] }>('/notifications/inbox?page=1&limit=40');
}

export async function fetchUnread() {
  return api<{ count: number }>('/notifications/inbox/unread-count');
}
