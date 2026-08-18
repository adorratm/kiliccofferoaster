import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray } from '../lib/format';

type Sub = { id: string; email: string; isActive?: boolean; createdAt?: string };

export function NewsletterPage() {
  const [items, setItems] = useState<Sub[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api('/newsletter/subscribers')
      .then((data) => setItems(asArray<Sub>(data)))
      .catch(() => setError('Aboneler yüklenemedi'));
  }, []);

  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">17 // Bülten</p>
      <h1 className="mt-1 text-2xl font-semibold">Bülten aboneleri</h1>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">E-posta</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-b border-border-muted/40">
              <td className="py-2">{s.email}</td>
              <td>{s.isActive === false ? 'Pasif' : 'Aktif'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
