"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountTabs } from "@/components/AccountTabs";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getWishlist, removeWishlistItem } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import {
  clearWishlistCache,
  ensureWishlistIds,
} from "@/lib/wishlist";
import type { WishlistItem } from "@/lib/types";

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/giris?next=/hesabim/favoriler");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist(token);
      setItems(data.filter((i) => i.product));
      clearWishlistCache();
      await ensureWishlistIds();
    } catch {
      setError("Favoriler yüklenemedi. Oturumu kontrol edin.");
      clearToken();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function remove(productId: string) {
    const token = getToken();
    if (!token) {
      router.replace("/giris?next=/hesabim/favoriler");
      return;
    }
    try {
      await removeWishlistItem(productId, token);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      clearWishlistCache();
      await ensureWishlistIds();
    } catch {
      setError("Favoriden çıkarılamadı");
    }
  }

  if (loading) {
    return (
      <div className="page-shell py-24 font-meta text-sm uppercase text-secondary">
        Favoriler yükleniyor…
      </div>
    );
  }

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="mb-2 font-meta text-xs uppercase tracking-widest text-primary page-enter">
        Hesap / Favoriler
      </div>
      <h1 className="font-display text-4xl md:text-5xl">Hesabım</h1>
      <p className="mt-3 font-meta text-xs uppercase text-secondary">
        Favorilerim
      </p>

      <AccountTabs active="favoriler" />

      {error ? (
        <p className="mt-6 font-meta text-[11px] uppercase text-error">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-10">
          <p className="font-meta text-sm uppercase text-secondary">
            Henüz favori ürün yok.
          </p>
          <Link
            href="/urunler"
            className="btn-cta mt-8 inline-block px-8 py-4 text-xs"
          >
            Ürünlere göz at
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) =>
            item.product ? (
              <Reveal key={item.id} delay={i * 40}>
                <div className="space-y-3">
                  <ProductCard product={item.product} />
                  <button
                    type="button"
                    onClick={() => void remove(item.productId)}
                    className="w-full border border-outline-variant/40 py-3 font-meta text-[10px] uppercase tracking-widest text-secondary hover:border-primary hover:text-primary"
                  >
                    Favoriden çıkar
                  </button>
                </div>
              </Reveal>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
