"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SiteSearch } from "@/components/SiteSearch";
import { isAuthenticated, loginPath } from "@/lib/auth";
import { cartItemCount, fetchCart } from "@/lib/cart";
import type { SiteSettings } from "@/lib/cms";
import { DEFAULT_SETTINGS } from "@/lib/cms";

type Props = {
  settings?: SiteSettings;
};

export function SiteHeader({ settings = DEFAULT_SETTINGS }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [authed, setAuthed] = useState(false);
  const nav = settings.navigation.header;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAuthed(isAuthenticated());
    fetchCart()
      .then((cart) => setCount(cartItemCount(cart)))
      .catch(() => {
        /* Önceki sayacı koru — hata durumunda sessizce 0 göstermeyiz */
      });
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && mounted
      ? createPortal(
          <div
            className="mobile-menu fixed inset-0 z-90 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobil menü"
          >
            <button
              type="button"
              aria-label="Kapat"
              className="mobile-menu-backdrop absolute inset-0 bg-deep-carbon/80 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <div className="mobile-menu-panel absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col border-l border-outline-variant/40 bg-surface-container-lowest shadow-2xl sm:w-104">
              <div className="pointer-events-none absolute inset-0 technical-grid opacity-40" />
              <div className="relative flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
                <div>
                  <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-primary/80">
                    Navigasyon
                  </p>
                  <p className="mt-1 font-display text-lg tracking-tight text-on-surface">
                    {settings.brand.name}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Menüyü kapat"
                  className="text-primary"
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-8 pt-4">
                <nav className="flex flex-1 flex-col gap-1 overflow-auto">
                  {nav.map((item, i) => {
                    const root = `/${item.href.split("/").filter(Boolean)[0]}`;
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${root}/`) ||
                      pathname === root;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="mobile-menu-link group flex items-baseline justify-between gap-4 border-b border-outline-variant/25 py-4"
                        style={{ animationDelay: `${60 + i * 45}ms` }}
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="font-meta text-[10px] text-secondary/60">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`font-display text-3xl tracking-tight transition-colors ${
                              active
                                ? "text-primary"
                                : "text-on-surface group-hover:text-primary"
                            }`}
                          >
                            {item.label}
                          </span>
                        </span>
                        <span className="font-meta text-[10px] uppercase tracking-widest text-secondary transition-colors group-hover:text-primary">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <div
                  className="mobile-menu-footer mt-8 grid grid-cols-2 gap-3"
                  style={{ animationDelay: `${80 + nav.length * 45}ms` }}
                >
                  <Link
                    href="/sepet"
                    onClick={() => setOpen(false)}
                    className="border border-outline-variant/40 bg-surface-container px-4 py-3 font-meta text-[11px] uppercase tracking-widest text-on-surface hover:border-primary hover:text-primary"
                  >
                    Sepet
                    {count > 0 ? ` · ${String(count).padStart(2, "0")}` : ""}
                  </Link>
                  <Link
                    href={authed ? "/hesabim" : loginPath(pathname)}
                    onClick={() => setOpen(false)}
                    className="border border-primary/50 bg-primary/10 px-4 py-3 font-meta text-[11px] uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary"
                  >
                    {authed ? "Hesabım" : "Giriş"}
                  </Link>
                </div>

                <p className="mt-6 font-meta text-[10px] uppercase tracking-widest text-secondary/50">
                  Torbalı / İzmir
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/95 backdrop-blur-sm">
      <nav className="page-shell flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl tracking-tighter text-primary md:text-2xl"
        >
          {settings.brand.name}
        </Link>

        <div className="hidden items-center gap-10 font-meta text-xs uppercase tracking-widest md:flex">
          {nav.map((item) => {
            const root = `/${item.href.split("/").filter(Boolean)[0]}`;
            const active =
              pathname === item.href ||
              pathname.startsWith(`${root}/`) ||
              pathname === root;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                className={
                  active
                    ? "nav-link-motion font-bold text-primary"
                    : "nav-link-motion text-secondary hover:text-primary"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <SiteSearch />
          <Link
            href="/sepet"
            className="flex items-center gap-2 font-meta text-xs uppercase tracking-widest text-primary"
            aria-label="Sepet"
          >
            <BagIcon />
            <span className="hidden sm:inline">Sepet</span>
            {count > 0 ? (
              <span className="bg-cta px-1.5 py-0.5 text-[10px] text-on-cta">
                {String(count).padStart(2, "0")}
              </span>
            ) : null}
          </Link>
          <Link
            href={authed ? "/hesabim" : loginPath(pathname)}
            className="text-primary transition-opacity hover:opacity-80"
            aria-label="Hesap"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            className="text-primary md:hidden"
            aria-label={open ? "Menüyü kapat" : "Menü"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>
      {menu}
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 8V7a3 3 0 0 1 6 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
