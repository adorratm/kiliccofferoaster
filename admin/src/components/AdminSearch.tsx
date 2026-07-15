'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type SearchHit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type SearchResponse = {
  q: string;
  groups: { type: string; label: string; items: SearchHit[] }[];
};

export function AdminSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      void api<SearchResponse>(
        `/admin/search?q=${encodeURIComponent(q.trim())}&limit=8`,
      )
        .then(setResult)
        .catch(() => setResult({ q, groups: [] }))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const groups = result?.groups ?? [];
  const hasHits = groups.some((g) => g.items.length > 0);

  return (
    <div ref={rootRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
      <div className="flex items-center border border-border-muted bg-surface">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ara… ürün, sipariş, mesaj (Ctrl+K)"
          className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted"
        />
        <span className="mono shrink-0 px-2 text-[10px] text-muted">⌘K</span>
      </div>

      {open && q.trim().length >= 2 ? (
        <div className="dialog-panel absolute left-0 right-0 z-50 mt-1 max-h-96 overflow-auto border border-border-muted bg-surface shadow-2xl">
          {loading ? (
            <p className="px-3 py-4 text-xs text-muted">Aranıyor…</p>
          ) : !hasHits ? (
            <p className="px-3 py-4 text-xs text-muted">Sonuç yok</p>
          ) : (
            groups.map((group) => (
              <div key={group.type} className="border-b border-border-muted last:border-0">
                <p className="mono px-3 py-2 text-[10px] uppercase tracking-widest text-muted">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((hit) => (
                    <li key={`${hit.type}-${hit.id}`}>
                      <Link
                        href={hit.href}
                        onClick={() => {
                          setOpen(false);
                          setQ('');
                          router.push(hit.href);
                        }}
                        className="row-motion block px-3 py-2 hover:bg-surface-high"
                      >
                        <div className="text-sm text-foreground">{hit.title}</div>
                        {hit.subtitle ? (
                          <div className="mono text-[10px] text-muted">
                            {hit.subtitle}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
