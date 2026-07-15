'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type NavLink = { href: string; label: string };

type Props = {
  label: string;
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
};

export function LinkListEditor({ label, links, onChange }: Props) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  function update(index: number, field: keyof NavLink, value: string) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  function remove(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...links, { href: '/', label: 'Yeni link' }]);
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= links.length) return;
    const copy = [...links];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  const pendingLabel =
    pendingIndex !== null ? links[pendingIndex]?.label : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase text-muted">{label}</span>
        <button
          type="button"
          onClick={add}
          className="text-xs text-accent hover:underline"
        >
          + Ekle
        </button>
      </div>
      {links.length === 0 ? (
        <p className="text-xs text-muted">Henüz link yok</p>
      ) : (
        links.map((link, index) => (
          <div
            key={`${label}-${index}`}
            className="grid gap-2 border border-border-muted bg-background p-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="block text-sm">
              <span className="mono text-[10px] uppercase text-muted">Etiket</span>
              <input
                value={link.label}
                onChange={(e) => update(index, 'label', e.target.value)}
                className="mt-1 w-full border border-border-muted bg-surface px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mono text-[10px] uppercase text-muted">URL</span>
              <input
                value={link.href}
                onChange={(e) => update(index, 'href', e.target.value)}
                className="mt-1 w-full border border-border-muted bg-surface px-3 py-2 mono"
              />
            </label>
            <div className="flex items-end gap-1">
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
                disabled={index === links.length - 1}
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
        ))
      )}

      <ConfirmDialog
        open={pendingIndex !== null}
        title="Linki kaldır?"
        description={
          pendingLabel
            ? `"${pendingLabel}" menüden silinecek.`
            : 'Bu link menüden silinecek.'
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
