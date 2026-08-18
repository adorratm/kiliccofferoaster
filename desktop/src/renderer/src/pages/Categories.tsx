import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { asArray, inputClass, slugify } from '../lib/format';
import { Switch } from '../components/Switch';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive: boolean;
};

const empty = { name: '', slug: '', description: '', sortOrder: '0', isActive: true };

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(asArray<Category>(await api('/categories/admin/all')));
  }

  useEffect(() => {
    void load().catch(() => setError('Kategoriler yüklenemedi'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (editId) await api(`/categories/${editId}`, { method: 'PATCH', body });
      else await api('/categories', { method: 'POST', body });
      setForm(empty);
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">09 // Kategoriler</p>
        <h1 className="mt-1 text-2xl font-semibold">Kategoriler</h1>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Ad</th>
              <th>Slug</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-border-muted/40 hover:bg-surface"
                onClick={() => {
                  setEditId(c.id);
                  setForm({
                    name: c.name,
                    slug: c.slug,
                    description: c.description || '',
                    sortOrder: String(c.sortOrder ?? 0),
                    isActive: c.isActive,
                  });
                }}
              >
                <td className="py-2">{c.name}</td>
                <td className="mono">{c.slug}</td>
                <td>{c.isActive ? 'Aktif' : 'Pasif'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={onSubmit} className="col-span-2 border border-border-muted bg-surface p-4">
        <p className="mono text-[10px] uppercase text-muted">{editId ? 'Düzenle' : 'Yeni kategori'}</p>
        <input
          required
          placeholder="Ad"
          className={inputClass}
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))
          }
        />
        <input
          placeholder="Slug"
          className={inputClass}
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <textarea
          placeholder="Açıklama"
          className={`${inputClass} min-h-20`}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="mt-3">
          <Switch
            checked={form.isActive}
            onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            label="Aktif"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <button className="mt-4 bg-accent px-4 py-2 text-white">{editId ? 'Güncelle' : 'Oluştur'}</button>
      </form>
    </div>
  );
}
