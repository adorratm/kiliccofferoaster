'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  requestBrowserPushPermission,
  type InboxItem,
  type NotificationPrefs,
} from '@/lib/inbox';

const TOGGLES: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'inAppEnabled', label: 'Uygulama içi bildirimler' },
  { key: 'pushEnabled', label: 'Tarayıcı bildirimleri' },
  { key: 'opsOrdersEnabled', label: 'Yeni ödemeler / siparişler' },
  { key: 'opsReturnsEnabled', label: 'İade talepleri' },
  { key: 'opsMessagesEnabled', label: 'İletişim mesajları' },
  { key: 'opsReviewsEnabled', label: 'Ürün yorumları' },
  { key: 'opsStockEnabled', label: 'Düşük stok' },
];

type InboxPage = { items: InboxItem[] };

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [inbox, p] = await Promise.all([
        api<InboxPage>('/notifications/inbox?page=1&limit=40'),
        api<NotificationPrefs>('/notifications/preferences'),
      ]);
      setItems(inbox.items || []);
      setPrefs(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    if (key === 'pushEnabled' && value) {
      const ok = await requestBrowserPushPermission();
      if (!ok) return;
    }
    const next = await api<NotificationPrefs>('/notifications/preferences', {
      method: 'PATCH',
      body: { [key]: value },
    });
    setPrefs(next);
  }

  async function openItem(item: InboxItem) {
    if (!item.readAt) {
      await api(`/notifications/inbox/${item.id}/read`, { method: 'PATCH' }).catch(
        () => undefined,
      );
    }
    if (item.href) router.push(item.href);
    else void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Bildirimler
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Bildirimler</h1>
      </div>
      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {prefs ? (
        <section className="max-w-xl space-y-2">
          <h2 className="text-sm font-semibold">Tercihler</h2>
          {TOGGLES.map((row) => (
            <label
              key={row.key}
              className="flex items-center justify-between gap-4 border border-border-muted bg-surface px-3 py-2 text-sm"
            >
              <span>{row.label}</span>
              <input
                type="checkbox"
                checked={Boolean(prefs[row.key])}
                onChange={(e) => void toggle(row.key, e.target.checked)}
              />
            </label>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Gelen kutusu</h2>
          <button
            type="button"
            className="text-xs text-accent"
            onClick={() =>
              void api('/notifications/inbox/read-all', { method: 'PATCH' }).then(
                () => load(),
              )
            }
          >
            Tümünü oku
          </button>
        </div>
        {!items.length ? (
          <p className="text-sm text-muted">Bildirim yok</p>
        ) : (
          <ul className="divide-y divide-border-muted border border-border-muted">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  className={`block w-full px-4 py-3 text-left hover:bg-surface ${
                    item.readAt ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm">{item.title}</p>
                  <p className="text-xs text-muted">{item.body}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
