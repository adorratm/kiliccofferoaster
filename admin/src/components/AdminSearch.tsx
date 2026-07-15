'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
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

const SEE_ALL: Record<string, (q: string) => string> = {
  products: (q) => `/urunler?q=${encodeURIComponent(q)}`,
  orders: (q) => `/siparisler?q=${encodeURIComponent(q)}`,
  categories: (q) => `/kategoriler?q=${encodeURIComponent(q)}`,
  messages: (q) => `/mesajlar?q=${encodeURIComponent(q)}`,
  media: (q) => `/medya?q=${encodeURIComponent(q)}`,
  newsletter: (q) => `/bulten?q=${encodeURIComponent(q)}`,
  legal: (q) => `/sozlesmeler?q=${encodeURIComponent(q)}`,
  blog: (q) => `/blog?q=${encodeURIComponent(q)}`,
};

function shortcutLabel() {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    ? '⌘K'
    : 'Ctrl+K';
}

export function AdminSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState('Ctrl+K');

  useEffect(() => {
    setHint(shortcutLabel());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResult(null);
      setLoading(false);
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

  const flatHits = useMemo(() => {
    const groups = result?.groups ?? [];
    return groups.flatMap((g) => g.items);
  }, [result]);

  useEffect(() => {
    setActive(0);
  }, [result]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${active}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function close() {
    setOpen(false);
    setQ('');
    setResult(null);
    setActive(0);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flatHits.length) return;
      setActive((i) => (i + 1) % flatHits.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flatHits.length) return;
      setActive((i) => (i - 1 + flatHits.length) % flatHits.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = q.trim();
      if (flatHits[active]) {
        go(flatHits[active].href);
        return;
      }
      if (term.length >= 2) {
        go(`/siparisler?q=${encodeURIComponent(term)}`);
      }
    }
  }

  const groups = result?.groups ?? [];
  const hasHits = flatHits.length > 0;
  let hitIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 border border-border-muted bg-surface px-3 py-2 text-left text-sm text-muted hover:border-accent/50 md:max-w-md"
        aria-label="Ara"
      >
        <span className="truncate">Ara… ürün, sipariş, mesaj</span>
        <span className="mono ml-auto shrink-0 text-[10px] text-muted">{hint}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-60 flex items-start justify-center px-3 pt-[12vh] sm:px-4">
          <button
            type="button"
            aria-label="Kapat"
            className="dialog-backdrop absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin arama"
        className="dialog-panel relative z-60 flex w-full max-w-xl flex-col overflow-hidden border border-border-muted bg-surface shadow-2xl"
          >
            <div className="flex items-center border-b border-border-muted">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Ürün, sipariş, mesaj, blog…"
                className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="mono mr-3 shrink-0 rounded border border-border-muted px-1.5 py-0.5 text-[10px] text-muted">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[min(60vh,24rem)] overflow-auto">
              {q.trim().length < 2 ? (
                <p className="px-4 py-6 text-xs text-muted">
                  En az 2 karakter yazın. Ok tuşları ile seçin, Enter ile gidin.
                </p>
              ) : loading ? (
                <p className="px-4 py-6 text-xs text-muted">Aranıyor…</p>
              ) : !hasHits ? (
                <div className="space-y-3 px-4 py-6">
                  <p className="text-xs text-muted">Sonuç yok</p>
                  <button
                    type="button"
                    onClick={() =>
                      go(`/siparisler?q=${encodeURIComponent(q.trim())}`)
                    }
                    className="text-left text-sm text-accent hover:underline"
                  >
                    Siparişlerde “{q.trim()}” ara →
                  </button>
                </div>
              ) : (
                groups.map((group) => {
                  const seeAll = SEE_ALL[group.type];
                  return (
                    <div
                      key={group.type}
                      className="border-b border-border-muted last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2 px-4 py-2">
                        <p className="mono text-[10px] uppercase tracking-widest text-muted">
                          {group.label}
                        </p>
                        {seeAll ? (
                          <button
                            type="button"
                            onClick={() => go(seeAll(q.trim()))}
                            className="mono text-[10px] uppercase tracking-widest text-accent hover:underline"
                          >
                            Tümünü gör
                          </button>
                        ) : null}
                      </div>
                      <ul>
                        {group.items.map((hit) => {
                          hitIndex += 1;
                          const idx = hitIndex;
                          const isActive = idx === active;
                          return (
                            <li key={`${hit.type}-${hit.id}`}>
                              <Link
                                href={hit.href}
                                data-search-index={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  go(hit.href);
                                }}
                                onMouseEnter={() => setActive(idx)}
                                className={`row-motion block px-4 py-2.5 ${
                                  isActive
                                    ? 'bg-surface-high text-foreground'
                                    : 'hover:bg-surface-high'
                                }`}
                              >
                                <div className="text-sm">{hit.title}</div>
                                {hit.subtitle ? (
                                  <div className="mono text-[10px] text-muted">
                                    {hit.subtitle}
                                  </div>
                                ) : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>

            {q.trim().length >= 2 ? (
              <div className="flex flex-wrap gap-2 border-t border-border-muted px-3 py-2">
                <QuickLink
                  label="Siparişler"
                  onClick={() =>
                    go(`/siparisler?q=${encodeURIComponent(q.trim())}`)
                  }
                />
                <QuickLink
                  label="Ürünler"
                  onClick={() =>
                    go(`/urunler?q=${encodeURIComponent(q.trim())}`)
                  }
                />
                <QuickLink
                  label="Blog"
                  onClick={() => go(`/blog?q=${encodeURIComponent(q.trim())}`)}
                />
                <QuickLink
                  label="Mesajlar"
                  onClick={() =>
                    go(`/mesajlar?q=${encodeURIComponent(q.trim())}`)
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function QuickLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono rounded border border-border-muted px-2 py-1 text-[10px] uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
    >
      {label}
    </button>
  );
}
