'use client';

import { useEffect, useState } from 'react';
import { api, uploadMedia } from '@/lib/api';
import { ImageDropZone } from '@/components/ImageDropZone';

type MediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType?: string;
};

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
};

export function GalleryMediaField({
  urls,
  onChange,
  folder = 'products',
  label = 'Galeri',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (!pickerOpen) return;
    setSelected(new Set(urls));
    setLoadingLibrary(true);
    setError(null);
    void api<MediaAsset[]>('/cms/admin/media')
      .then((data) => setLibrary(Array.isArray(data) ? data : []))
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Medya listesi alınamadı'),
      )
      .finally(() => setLoadingLibrary(false));
  }, [pickerOpen, urls]);

  function addUrls(next: string[]) {
    const merged = [...urls];
    for (const url of next) {
      if (url && !merged.includes(url)) merged.push(url);
    }
    onChange(merged);
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onChange(next);
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const asset = await uploadMedia(file, { folder });
        uploaded.push(asset.url);
      }
      addUrls(uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  function toggleSelect(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function applyPicker() {
    const fromLib = library
      .filter((a) => selected.has(a.url))
      .map((a) => a.url);
    const ordered = [
      ...urls.filter((u) => selected.has(u)),
      ...fromLib.filter((u) => !urls.includes(u)),
    ];
    onChange(ordered);
    setPickerOpen(false);
  }

  function addManual() {
    const url = manualUrl.trim();
    if (!url) return;
    addUrls([url]);
    setManualUrl('');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="mono text-[10px] uppercase text-muted">{label}</span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="text-xs text-accent hover:underline"
        >
          Medyadan seç
        </button>
      </div>

      {urls.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="group relative border border-border-muted bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="flex-1 px-1 py-0.5 text-[10px] text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === urls.length - 1}
                  className="flex-1 px-1 py-0.5 text-[10px] text-white disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="flex-1 px-1 py-0.5 text-[10px] text-danger"
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ImageDropZone
        multiple
        onFiles={handleFiles}
        busy={uploading}
        hint="Galeri görsellerini sürükleyip bırakın veya seçin"
      />

      <input
        value={manualUrl}
        onChange={(e) => setManualUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addManual();
          }
        }}
        onBlur={() => {
          if (manualUrl.trim()) addManual();
        }}
        placeholder="veya URL yapıştır (Enter)"
        className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
      />

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col border border-border-muted bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border-muted px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Medya kütüphanesi</p>
                <p className="mono text-[10px] uppercase text-muted">
                  {selected.size} seçili · çoklu seçim
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Kapat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingLibrary ? (
                <p className="text-sm text-muted">Yükleniyor…</p>
              ) : library.length === 0 ? (
                <p className="text-sm text-muted">
                  Kütüphanede görsel yok. Önce yükleyin.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {library.map((asset) => {
                    const active = selected.has(asset.url);
                    return (
                      <li key={asset.id}>
                        <button
                          type="button"
                          onClick={() => toggleSelect(asset.url)}
                          className={`relative w-full border ${
                            active
                              ? 'border-accent ring-1 ring-accent'
                              : 'border-border-muted'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.url}
                            alt={asset.filename}
                            className="aspect-square w-full object-cover"
                          />
                          {active ? (
                            <span className="absolute right-1 top-1 bg-accent px-1.5 py-0.5 text-[10px] text-white">
                              ✓
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border-muted px-4 py-3">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="border border-border-muted px-4 py-2 text-sm"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={applyPicker}
                className="bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
              >
                Seçimi uygula ({selected.size})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
