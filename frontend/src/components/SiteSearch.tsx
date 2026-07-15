"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { globalSearch } from "@/lib/api";
import type { SearchHit, SearchResponse } from "@/lib/types";

type Props = {
  compact?: boolean;
};

export function SiteSearch({ compact }: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      void globalSearch(q.trim(), 8)
        .then(setResult)
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        rootRef.current?.querySelector("input")?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function goCatalog() {
    const query = q.trim();
    setOpen(false);
    router.push(query ? `/urunler?q=${encodeURIComponent(query)}` : "/urunler");
  }

  const groups = result?.groups ?? [];
  const hasHits = groups.some((g) => g.items.length > 0);

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-full" : ""}`}>
      <label className="sr-only" htmlFor={listId}>
        Ara
      </label>
      <div className="flex items-center border border-outline-variant/40 bg-surface-container-lowest">
        <input
          id={listId}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goCatalog();
            }
          }}
          placeholder={compact ? "Ara…" : "Ara (Ctrl+K)"}
          className="w-36 bg-transparent px-3 py-2 font-meta text-[11px] uppercase text-on-surface outline-none placeholder:text-secondary md:w-48"
        />
        <button
          type="button"
          onClick={goCatalog}
          className="border-l border-outline-variant/40 px-3 py-2 font-meta text-[10px] uppercase text-primary hover:bg-surface-container"
          aria-label="Ara"
        >
          ↗
        </button>
      </div>

      {open && q.trim().length >= 2 ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] border border-outline-variant/40 bg-surface-container-high shadow-2xl">
          <div className="max-h-80 overflow-auto p-2">
            {loading ? (
              <p className="px-2 py-3 font-meta text-[10px] uppercase text-secondary">
                Aranıyor…
              </p>
            ) : !hasHits ? (
              <p className="px-2 py-3 font-meta text-[10px] uppercase text-secondary">
                Sonuç yok. Katalogda ara →
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.type} className="mb-2">
                  <p className="px-2 py-1 font-meta text-[10px] uppercase tracking-widest text-primary/70">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map((hit) => (
                      <HitRow
                        key={`${hit.type}-${hit.id}`}
                        hit={hit}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={goCatalog}
            className="w-full border-t border-outline-variant/30 px-3 py-2.5 text-left font-meta text-[10px] uppercase text-primary hover:bg-surface-container"
          >
            Tüm sonuçlar / ürün kataloğu
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HitRow({
  hit,
  onNavigate,
}: {
  hit: SearchHit;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={hit.href}
        onClick={onNavigate}
        className="block px-2 py-2 transition-colors hover:bg-surface-container"
      >
        <div className="font-meta text-xs text-on-surface">{hit.title}</div>
        {hit.subtitle ? (
          <div className="mt-0.5 font-meta text-[10px] uppercase text-secondary">
            {hit.subtitle}
          </div>
        ) : null}
      </Link>
    </li>
  );
}
