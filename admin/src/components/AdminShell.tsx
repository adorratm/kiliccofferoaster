'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';

const BARE_PATHS = ['/login', '/auth/callback'];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (bare) {
    return <div className="admin-page-in">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <div key={pathname} className="admin-page-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
