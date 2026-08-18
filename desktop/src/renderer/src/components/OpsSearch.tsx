import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

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

const SEE_ALL: Record<string, string> = {
  products: '/urunler',
  orders: '/siparisler',
  customers: '/musteriler',
  categories: '/kategoriler',
  parties: '/cari',
  invoices: '/faturalar',
  coupons: '/kuponlar',
  campaigns: '/kampanyalar',
  messages: '/mesajlar',
  newsletter: '/bulten',
};

function shortcutLabel() {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl+K';
}

export function OpsSearch() {
  const navigate = useNavigate();
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
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResult(null);
      setLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      void api<SearchResponse>(`/ops/search?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then(setResult)
        .catch(() => setResult({ q, groups: [] }))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const flatHits = useMemo(() => result?.groups.flatMap((g) => g.items) ?? [], [result]);

  useEffect(() => {
    setActive(0);
  }, [result]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-search-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function close() {
    setOpen(false);
    setQ('');
    setResult(null);
    setActive(0);
  }

  function go(href: string, hit?: SearchHit) {
    close();
    if (hit?.type === 'product') navigate(`/urunler/${hit.id}`);
    else navigate(href);
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatHits.length) setActive((i) => (i + 1) % flatHits.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatHits.length) setActive((i) => (i - 1 + flatHits.length) % flatHits.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatHits[active]) go(flatHits[active].href, flatHits[active]);
      else if (q.trim().length >= 2) go('/siparisler');
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
        <span className="truncate">Ara… ürün, sipariş, cari</span>
        <span className="mono ml-auto shrink-0 text-[10px] text-muted">{hint}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12vh]">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ops arama"
            className="relative z-50 flex w-full max-w-xl flex-col overflow-hidden border border-border-muted bg-surface shadow-2xl"
          >
            <div className="flex items-center border-b border-border-muted">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Ürün, sipariş, cari, fatura…"
                className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="mono mr-3 shrink-0 border border-border-muted px-1.5 py-0.5 text-[10px] text-muted">
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
                <p className="px-4 py-6 text-xs text-muted">Sonuç yok</p>
              ) : (
                groups.map((group) => (
                  <div key={group.type} className="border-b border-border-muted last:border-0">
                    <div className="flex items-center justify-between gap-2 px-4 py-2">
                      <p className="mono text-[10px] uppercase tracking-widest text-muted">
                        {group.label}
                      </p>
                      {SEE_ALL[group.type] ? (
                        <button
                          type="button"
                          onClick={() => go(SEE_ALL[group.type])}
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
                        return (
                          <li key={`${hit.type}-${hit.id}`}>
                            <button
                              type="button"
                              data-search-index={idx}
                              onClick={() => go(hit.href, hit)}
                              onMouseEnter={() => setActive(idx)}
                              className={`block w-full px-4 py-2.5 text-left ${
                                idx === active ? 'bg-surface-high' : 'hover:bg-surface-high'
                              }`}
                            >
                              <div className="text-sm">{hit.title}</div>
                              {hit.subtitle ? (
                                <div className="mono text-[10px] text-muted">{hit.subtitle}</div>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
