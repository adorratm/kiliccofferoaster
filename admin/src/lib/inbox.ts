import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  type: string;
  category: string;
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

export function connectNotifySocket(): Socket | null {
  const token = getToken();
  if (!token) return null;
  return io(`${API_URL}/notify`, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: 8,
  });
}

export function showBrowserNotification(item: InboxItem) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const n = new Notification(item.title, { body: item.body });
  n.onclick = () => {
    window.focus();
    if (item.href) window.location.href = item.href;
  };
}

export async function requestBrowserPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}
