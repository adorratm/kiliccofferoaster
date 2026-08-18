import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray } from '../lib/format';

type Message = {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  isRead?: boolean;
  createdAt?: string;
};

export function MessagesPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(asArray<Message>(await api('/contact/admin')));
  }

  useEffect(() => {
    void load().catch(() => setError('Mesajlar yüklenemedi'));
  }, []);

  async function markRead(id: string) {
    await api(`/contact/admin/${id}/read`, { method: 'PATCH', body: { isRead: true } });
    await load();
  }

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">16 // Mesajlar</p>
      <h1 className="mt-1 text-2xl font-semibold">İletişim mesajları</h1>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((m) => (
          <div key={m.id} className="border border-border-muted bg-surface p-4">
            <p className="mono text-xs text-muted">
              {m.email} · {m.isRead ? 'Okundu' : 'Yeni'}
            </p>
            <p className="mt-1 font-semibold">{m.name}</p>
            {m.subject ? <p className="text-sm">{m.subject}</p> : null}
            <p className="mt-1 text-sm text-muted">{m.message}</p>
            {!m.isRead ? (
              <button className="mt-3 bg-accent px-3 py-1.5 text-white" onClick={() => void markRead(m.id)}>
                Okundu işaretle
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
