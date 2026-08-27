'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearToken, isAuthenticated } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/auth/callback'];
const OPS_ROLES = new Set(['admin', 'staff', 'accountant']);

const ADMIN_ONLY_PREFIXES = [
  '/kullanicilar',
  '/personel-onaylari',
  '/blog',
  '/icerik',
  '/site-ayarlari',
  '/medya',
  '/galeri',
  '/muhasebe-ayarlari',
  '/pazaryeri',
  '/sozlesmeler',
  '/kuyruklar',
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const isPublic = PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (isPublic) {
        if (isAuthenticated() && pathname === '/login') {
          router.replace('/');
          return;
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (!isAuthenticated()) {
        router.replace('/login');
        return;
      }

      try {
        const me = await api<{ role: string }>('/auth/me');
        if (!OPS_ROLES.has(me.role)) {
          clearToken();
          router.replace('/login');
          return;
        }
        const needsAdmin = ADMIN_ONLY_PREFIXES.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );
        if (needsAdmin && me.role !== 'admin') {
          router.replace('/');
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        clearToken();
        router.replace('/login');
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted mono text-sm">
        Yükleniyor…
      </div>
    );
  }

  return <>{children}</>;
}
