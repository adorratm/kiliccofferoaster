'use client';

import { useRef, useState } from 'react';
import { uploadMedia } from '@/lib/api';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
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
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-24 w-24 border border-border-muted object-cover"
          />
        ) : null}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="border border-border-muted px-3 py-2 text-sm hover:bg-surface-high disabled:opacity-50"
          >
            {uploading ? 'Yükleniyor…' : 'S3\'e yükle'}
          </button>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="veya URL yapıştır"
            className="w-full min-w-60 border border-border-muted bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
