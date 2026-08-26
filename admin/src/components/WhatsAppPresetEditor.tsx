'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export type WhatsAppPresetRow = {
  label: string;
  message: string;
};

type Props = {
  presets: WhatsAppPresetRow[];
  onChange: (presets: WhatsAppPresetRow[]) => void;
};

export function WhatsAppPresetEditor({ presets, onChange }: Props) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  function update(
    index: number,
    field: keyof WhatsAppPresetRow,
    value: string,
  ) {
    onChange(
      presets.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function remove(index: number) {
    onChange(presets.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...presets,
      {
        label: 'Yeni soru',
        message: 'Merhaba, … hakkında yazıyorum.',
      },
    ]);
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= presets.length) return;
    const copy = [...presets];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  const pendingLabel =
    pendingIndex !== null ? presets[pendingIndex]?.label : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase text-muted">
          Hazır mesajlar
        </span>
        <button
          type="button"
          onClick={add}
          className="text-xs text-accent hover:underline"
        >
          + Ekle
        </button>
      </div>
      {presets.length === 0 ? (
        <p className="text-xs text-muted">Henüz hazır mesaj yok</p>
      ) : (
        presets.map((row, index) => (
          <div
            key={`wa-preset-${index}`}
            className="space-y-2 border border-border-muted bg-background p-3"
          >
            <div className="flex items-start gap-2">
              <label className="block flex-1 text-sm">
                <span className="mono text-[10px] uppercase text-muted">
                  Buton metni
                </span>
                <input
                  value={row.label}
                  onChange={(e) => update(index, 'label', e.target.value)}
                  className="mt-1 w-full border border-border-muted bg-surface px-3 py-2"
                />
              </label>
              <div className="flex items-end gap-1 pt-5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="border border-border-muted px-2 py-2 text-xs disabled:opacity-30"
                  aria-label="Yukarı"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === presets.length - 1}
                  className="border border-border-muted px-2 py-2 text-xs disabled:opacity-30"
                  aria-label="Aşağı"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setPendingIndex(index)}
                  className="border border-danger/40 px-2 py-2 text-xs text-danger"
                  aria-label="Sil"
                >
                  ×
                </button>
              </div>
            </div>
            <label className="block text-sm">
              <span className="mono text-[10px] uppercase text-muted">
                WhatsApp mesajı
              </span>
              <textarea
                rows={3}
                value={row.message}
                onChange={(e) => update(index, 'message', e.target.value)}
                className="mt-1 w-full border border-border-muted bg-surface px-3 py-2"
              />
            </label>
          </div>
        ))
      )}

      <ConfirmDialog
        open={pendingIndex !== null}
        title="Hazır mesajı kaldır?"
        description={
          pendingLabel
            ? `"${pendingLabel}" listeden silinecek.`
            : 'Bu hazır mesaj silinecek.'
        }
        confirmLabel="Kaldır"
        onCancel={() => setPendingIndex(null)}
        onConfirm={() => {
          if (pendingIndex !== null) remove(pendingIndex);
          setPendingIndex(null);
        }}
      />
    </div>
  );
}
