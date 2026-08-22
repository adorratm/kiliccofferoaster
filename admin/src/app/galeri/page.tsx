'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Reveal } from '@/components/Reveal';

type GalleryItem = {
  id: string;
  source: 'instagram' | 'upload';
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  caption: string | null;
  mediaType: string;
  sortOrder: number;
  isVisible: boolean;
  publishedAt: string | null;
  updatedAt?: string;
};

function GalleryPageInner() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    mediaUrl: '',
    caption: '',
    sortOrder: '0',
    isVisible: true,
  });

  const instagram = useMemo(
    () => items.filter((i) => i.source === 'instagram'),
    [items],
  );
  const uploads = useMemo(
    () => items.filter((i) => i.source === 'upload'),
    [items],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<GalleryItem[]>('/gallery/admin/items');
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Galeri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncInstagram() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ synced: number; total: number }>(
        '/gallery/admin/sync-instagram',
        { method: 'POST' },
      );
      setMessage(
        `Instagram: ${result.synced}/${result.total} gönderi senkronize edildi.`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Instagram senkronu başarısız');
    } finally {
      setSyncing(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.mediaUrl.trim()) {
      setError('Görsel URL gerekli');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api('/gallery/admin/items', {
        method: 'POST',
        body: {
          mediaUrl: form.mediaUrl.trim(),
          caption: form.caption.trim() || null,
          sortOrder: Number(form.sortOrder) || 0,
          isVisible: form.isVisible,
        },
      });
      setForm({ mediaUrl: '', caption: '', sortOrder: '0', isVisible: true });
      setMessage('Görsel galeriye eklendi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(item: GalleryItem) {
    try {
      await api(`/gallery/admin/items/${item.id}`, {
        method: 'PATCH',
        body: { isVisible: !item.isVisible },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  async function confirmRemove() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api(`/gallery/admin/items/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <div>
          <h2 className="text-lg font-semibold">Site Galerisi</h2>
          <p className="text-sm text-muted">
            Vitrin <span className="mono">/medya</span> sayfasında Instagram ve
            atölye görselleri ayrı bölümlerde listelenir.
          </p>
        </div>
      </Reveal>

      {error ? (
        <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-accent/30 bg-surface px-3 py-2 text-sm text-accent">
          {message}
        </p>
      ) : null}

      <Reveal delay={40}>
        <div className="flex flex-wrap items-center gap-3 border border-border-muted bg-surface p-4">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void syncInstagram()}
            className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {syncing ? 'Senkronize ediliyor…' : 'Instagram senkronize et'}
          </button>
          <p className="mono text-[10px] text-muted">
            INSTAGRAM_ACCESS_TOKEN gerekir · @kiliccoffeeroaster
          </p>
        </div>
      </Reveal>

      <Reveal delay={60} variant="scale">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-4 border border-border-muted bg-surface p-4"
        >
          <h3 className="text-sm font-semibold">Atölyeden görsel ekle</h3>
          <MediaUpload
            value={form.mediaUrl}
            onChange={(url) => setForm((f) => ({ ...f, mediaUrl: url }))}
            folder="gallery"
            label="Görsel (S3)"
          />
          <textarea
            placeholder="Açıklama (isteğe bağlı)"
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            className="min-h-20 w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isVisible: e.target.checked }))
                }
              />
              Vitrinde göster
            </label>
            <input
              type="number"
              min={0}
              placeholder="Sıra"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value }))
              }
              className="w-24 border border-border-muted bg-background px-2 py-1.5 text-sm mono"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor…' : 'Galeriye ekle'}
            </button>
          </div>
        </form>
      </Reveal>

      <GalleryBlock
        title="Instagram"
        items={instagram}
        loading={loading}
        onToggle={toggleVisible}
        onDelete={setDeleteId}
      />

      <GalleryBlock
        title="Atölyeden yüklemeler"
        items={uploads}
        loading={loading}
        onToggle={toggleVisible}
        onDelete={setDeleteId}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Galeri öğesini sil?"
        description="Vitrinden kaldırılır. Instagram kaydı tekrar senkronla gelebilir."
        confirmLabel="Sil"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}

function GalleryBlock({
  title,
  items,
  loading,
  onToggle,
  onDelete,
}: {
  title: string;
  items: GalleryItem[];
  loading: boolean;
  onToggle: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="mono text-[10px] uppercase tracking-widest text-muted">
        {title} · {items.length}
      </h3>
      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Kayıt yok</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i, 8) * 40} variant="scale">
              <div className="border border-border-muted bg-surface p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnailUrl || item.mediaUrl}
                  alt={item.caption || title}
                  className="aspect-square w-full object-cover"
                />
                <p className="mt-2 line-clamp-2 mono text-[10px] text-muted">
                  {item.caption || '—'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onToggle(item)}
                    className="text-accent hover:underline"
                  >
                    {item.isVisible ? 'Gizle' : 'Göster'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-danger hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<p className="mono text-sm text-muted">Yükleniyor…</p>}>
      <GalleryPageInner />
    </Suspense>
  );
}
