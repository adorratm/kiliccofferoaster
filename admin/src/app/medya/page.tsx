'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Reveal } from '@/components/Reveal';

type MediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<MediaAsset[]>('/cms/admin/media');
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Medya yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function confirmRemove() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api(`/cms/admin/media/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setDeleting(false);
    }
  }

  function onUploadComplete(url: string) {
    setPreviewUrl(url);
    void load();
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h2 className="text-lg font-semibold">Medya Kütüphanesi</h2>
          <p className="text-sm text-muted">
            Görseller AWS S3&apos;e yüklenir (yapılandırılmadıysa yerel depolama).
          </p>
        </div>
      </Reveal>

      {error ? (
        <Reveal delay={40}>
          <p className="border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">
            {error}
          </p>
        </Reveal>
      ) : null}

      <Reveal delay={60} variant="scale">
        <form
          onSubmit={(e: FormEvent) => e.preventDefault()}
          className="panel-motion border border-border-muted bg-surface p-4"
        >
          <MediaUpload
            value={previewUrl}
            onChange={onUploadComplete}
            folder="media"
            label="Yeni görsel yükle"
          />
        </form>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {loading ? (
          <p className="text-sm text-muted">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">Henüz görsel yok</p>
        ) : (
          items.map((item, i) => (
            <Reveal
              key={item.id}
              delay={Math.min(i, 8) * 45}
              variant="scale"
            >
              <div className="panel-motion border border-border-muted bg-surface p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.filename}
                  className="aspect-square w-full object-cover"
                />
                <p className="mt-2 truncate mono text-[10px] text-muted">
                  {item.filename}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(item.url)}
                    className="text-xs text-accent hover:underline"
                  >
                    URL kopyala
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </Reveal>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Görseli sil?"
        description="Medya kaydı ve dosya kalıcı olarak silinir."
        confirmLabel="Görseli sil"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
