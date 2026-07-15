'use client';

import { useState } from 'react';
import { uploadMedia } from '@/lib/api';
import { ImageDropZone } from '@/components/ImageDropZone';

type Props = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
};

export function MediaUpload({
  value,
  onChange,
  folder = 'media',
  label = 'Görsel',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const asset = await uploadMedia(file, { folder });
      onChange(asset.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="mono text-[10px] uppercase text-muted">{label}</span>
      <div className="flex flex-wrap items-stretch gap-3">
        {value ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-28 w-28 border border-border-muted object-cover"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 top-1 bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
            >
              Kaldır
            </button>
          </div>
        ) : null}
        <div className="min-w-60 flex-1 space-y-2">
          <ImageDropZone
            onFiles={handleFiles}
            busy={uploading}
            hint="Görseli sürükleyip bırakın veya seçin"
          />
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="veya URL yapıştır"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
