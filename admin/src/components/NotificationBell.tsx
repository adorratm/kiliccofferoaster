'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  connectNotifySocket,
  requestBrowserPushPermission,
  showBrowserNotification,
  type InboxItem,
  type NotificationPrefs,
} from '@/lib/inbox';

type InboxPage = { items: InboxItem[]; total: number };

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    function load() {
      void api<{ count: number }>('/notifications/inbox/unread-count')
        .then((r) => setUnread(r.count))
        .catch(() => undefined);
      void api<InboxPage>('/notifications/inbox?page=1&limit=8')
        .then((r) => setItems(r.items || []))
        .catch(() => undefined);
    }
    load();
    const poll = setInterval(load, 40000);
    void api<NotificationPrefs>('/notifications/preferences')
      .then((p) => {
        if (p.pushEnabled) return requestBrowserPushPermission();
      })
      .catch(() => undefined);
    const socket = connectNotifySocket();
    socket?.on('notify:new', (row: InboxItem) => {
      setItems((prev) => [row, ...prev].slice(0, 8));
      setUnread((n) => n + 1);
      void api<NotificationPrefs>('/notifications/preferences')
        .then((p) => {
          if (p.pushEnabled) showBrowserNotification(row);
        })
        .catch(() => undefined);
    });
    return () => {
      clearInterval(poll);
      socket?.disconnect();
    };
  }, []);

  async function openItem(item: InboxItem) {
    if (!item.readAt) {
      await api(`/notifications/inbox/${item.id}/read`, { method: 'PATCH' }).catch(
        () => undefined,
      );
      setUnread((n) => Math.max(0, n - 1));
    }
    setOpen(false);
    if (item.href) router.push(item.href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative border border-border-muted px-2.5 py-1.5 text-muted hover:border-accent hover:text-accent"
        aria-label="Bildirimler"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 bg-accent px-1 text-center text-[9px] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 border border-border-muted bg-background p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="mono text-[10px] uppercase text-muted">Bildirimler</p>
            <Link
              href="/bildirimler"
              onClick={() => setOpen(false)}
              className="text-[10px] uppercase text-accent"
            >
              Tümü
            </Link>
          </div>
          {!items.length ? (
            <p className="py-4 text-sm text-muted">Bildirim yok</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openItem(item)}
                    className={`block w-full px-2 py-2 text-left text-sm hover:bg-surface ${
                      item.readAt ? 'opacity-60' : ''
                    }`}
                  >
                    <p>{item.title}</p>
                    <p className="text-xs text-muted">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
