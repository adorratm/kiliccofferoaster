"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteSearch } from "@/components/SiteSearch";
import { isAuthenticated } from "@/lib/auth";
import { cartItemCount, fetchCart } from "@/lib/cart";
import type { SiteSettings } from "@/lib/cms";
import { DEFAULT_SETTINGS } from "@/lib/cms";

type Props = {
  settings?: SiteSettings;
};

export function SiteHeader({ settings = DEFAULT_SETTINGS }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [authed, setAuthed] = useState(false);
  const nav = settings.navigation.header;

  useEffect(() => {
    setAuthed(isAuthenticated());
    fetchCart()
      .then((cart) => setCount(cartItemCount(cart)))
      .catch(() => setCount(0));
  }, [pathname]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background">
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
          <div className="hidden sm:block">
            <SiteSearch />
          </div>
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
            href={authed ? "/hesabim" : "/giris"}
            className="text-primary transition-opacity hover:opacity-80"
            aria-label="Hesap"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            className="text-primary md:hidden"
            aria-label="Menü"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {open ? (
        <div className="menu-panel border-t border-outline-variant/20 bg-surface-container-lowest page-shell py-6 md:hidden">
          <div className="mb-6">
            <SiteSearch compact />
          </div>
          <div className="flex flex-col gap-4 font-meta text-sm uppercase tracking-widest">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-secondary hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/giris" className="text-primary" onClick={() => setOpen(false)}>
              Giriş
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" />
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
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
