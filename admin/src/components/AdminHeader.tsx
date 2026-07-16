'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AdminSearch } from '@/components/AdminSearch';
import { clearToken } from '@/lib/auth';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/urunler': 'Ürünler',
  '/kategoriler': 'Kategoriler',
  '/blog': 'Blog',
  '/icerik': 'İçerik',
  '/site-ayarlari': 'Site Ayarları',
  '/medya': 'Medya',
  '/siparisler': 'Siparişler',
  '/kuponlar': 'Kuponlar',
  '/yorumlar': 'Ürün Yorumları',
  '/kargo': 'Kargo Ayarları',
  '/pazaryeri': 'Pazaryeri',
  '/sozlesmeler': 'Sözleşmeler',
  '/mesajlar': 'Mesajlar',
  '/bulten': 'Bülten Aboneleri',
  '/kuyruklar': 'Kuyruklar',
};

function resolveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = Object.keys(TITLES)
    .filter((k) => k !== '/' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (base === '/siparisler') return 'Sipariş Detayı';
  if (base === '/urunler') return 'Ürün Düzenle';
  return TITLES[base] || 'Admin';
}

type Props = {
  onMenuOpen?: () => void;
};

export function AdminHeader({ onMenuOpen }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const title = resolveTitle(pathname);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-muted bg-background px-3 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuOpen}
          className="shrink-0 border border-border-muted px-2.5 py-1.5 text-muted hover:border-accent hover:text-accent lg:hidden"
          aria-label="Menüyü aç"
        >
          <MenuIcon />
        </button>
        <div key={pathname} className="page-enter min-w-0 shrink">
          <h1 className="truncate text-base font-medium text-foreground">
            {title}
          </h1>
          <p className="mono hidden text-[10px] uppercase tracking-widest text-muted sm:block">
            {pathname}
          </p>
        </div>
      </div>
      <AdminSearch />
      <button
        type="button"
        onClick={logout}
        className="btn-motion shrink-0 border border-border-muted px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
      >
        Çıkış
      </button>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
