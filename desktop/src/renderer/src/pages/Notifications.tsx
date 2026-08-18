import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchInbox, type InboxItem, type NotificationPrefs } from '../lib/inbox';

const TOGGLES: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'inAppEnabled', label: 'Uygulama içi bildirimler' },
  { key: 'pushEnabled', label: 'Masaüstü bildirimleri (çevrimiçi)' },
  { key: 'opsOrdersEnabled', label: 'Yeni ödemeler / siparişler' },
  { key: 'opsReturnsEnabled', label: 'İade talepleri' },
  { key: 'opsMessagesEnabled', label: 'İletişim mesajları' },
  { key: 'opsReviewsEnabled', label: 'Ürün yorumları' },
  { key: 'opsStockEnabled', label: 'Düşük stok' },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  async function load() {
    const [inbox, p] = await Promise.all([
      fetchInbox(),
      api<NotificationPrefs>('/notifications/preferences'),
    ]);
    setItems(inbox.items || []);
    setPrefs(p);
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const next = await api<NotificationPrefs>('/notifications/preferences', {
      method: 'PATCH',
      body: { [key]: value },
    });
    setPrefs(next);
  }

  async function openItem(item: InboxItem) {
    if (!item.readAt) {
      await api(`/notifications/inbox/${item.id}/read`, { method: 'PATCH' }).catch(() => undefined);
    }
    if (item.href) navigate(item.href);
    else void load();
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-2">
        <p className="mono text-[10px] uppercase text-muted">Bildirimler</p>
        <h1 className="mt-1 text-2xl font-semibold">Tercihler</h1>
        <div className="mt-4 space-y-2">
          {prefs
            ? TOGGLES.map((row) => (
                <label key={row.key} className="flex items-center justify-between gap-3 border border-border-muted bg-surface px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[row.key])}
                    onChange={(e) => void toggle(row.key, e.target.checked)}
                  />
                </label>
              ))
            : null}
        </div>
      </div>
      <div className="col-span-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gelen kutusu</h2>
          <button
            className="text-xs text-accent"
            onClick={() => void api('/notifications/inbox/read-all', { method: 'PATCH' }).then(() => load())}
          >
            Tümünü oku
          </button>
        </div>
        <ul className="mt-4 divide-y divide-border-muted border border-border-muted">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`block w-full px-4 py-3 text-left hover:bg-surface ${item.readAt ? 'opacity-60' : ''}`}
                onClick={() => void openItem(item)}
              >
                <p className="text-sm">{item.title}</p>
                <p className="text-xs text-muted">{item.body}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
