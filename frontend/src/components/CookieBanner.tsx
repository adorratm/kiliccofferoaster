"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logCookieConsent } from "@/lib/api";
import { getCartSessionId } from "@/lib/cart";

const CONSENT_KEY = "kilic_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(CONSENT_KEY);
    if (!existing) setVisible(true);
  }, []);

  async function accept(all: boolean) {
    const payload = {
      necessary: true,
      analytics: all,
      marketing: all,
      sessionId: getCartSessionId(),
    };
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setVisible(false);
    await logCookieConsent(payload);
  }

  if (!visible) return null;

  return (
    <div className="banner-enter fixed bottom-0 left-0 right-0 z-60 border-t border-outline-variant/30 bg-surface-container-lowest">
      <div className="page-shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl font-meta text-[11px] uppercase leading-relaxed text-secondary">
          Bu site, oturum ve yasal zorunluluklar için gerekli çerezleri kullanır.
          Ayrıntılar için{" "}
          <Link href="/cerez-politikasi" className="text-primary underline">
            çerez politikası
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => accept(false)}
            className="btn-ghost px-5 py-3 text-xs"
          >
            Yalnızca gerekli
          </button>
          <button
            type="button"
            onClick={() => accept(true)}
            className="btn-cta px-5 py-3 text-xs"
          >
            Tümünü kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
