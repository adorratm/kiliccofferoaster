import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, clearSession, getToken, getUser, isOnline, setSession } from '../lib/api';
import { flushOutbox, pendingCount, pullAll } from '../lib/sync';
import { OpsSearch } from './OpsSearch';
import { NotificationBell } from './NotificationBell';

type NavItem = { to: string; label: string; code: string; adminOnly?: boolean };

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Muhasebe',
    items: [
      { to: '/', label: 'Dashboard', code: '01' },
      { to: '/cari', label: 'Cari', code: '02' },
      { to: '/faturalar', label: 'Faturalar', code: '03' },
      { to: '/stok', label: 'Stok', code: '04' },
      { to: '/kasa', label: 'Kasa / Banka', code: '05' },
      { to: '/okc', label: 'ÖKC Import', code: '06' },
      { to: '/raporlar', label: 'Raporlar', code: '07' },
    ],
  },
  {
    title: 'Mağaza',
    items: [
      { to: '/urunler', label: 'Ürünler', code: '08' },
      { to: '/kategoriler', label: 'Kategoriler', code: '09' },
      { to: '/siparisler', label: 'Siparişler', code: '10' },
      { to: '/musteriler', label: 'Müşteriler', code: '10c' },
      { to: '/iadeler', label: 'İadeler', code: '11' },
      { to: '/kuponlar', label: 'Kuponlar', code: '12' },
      { to: '/kampanyalar', label: 'Kampanyalar', code: '13' },
      { to: '/yorumlar', label: 'Yorumlar', code: '14' },
      { to: '/kargo', label: 'Kargo', code: '15' },
      { to: '/mesajlar', label: 'Mesajlar', code: '16' },
      { to: '/bulten', label: 'Bülten', code: '17' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { to: '/kullanicilar', label: 'Kullanıcılar', code: '17a', adminOnly: true },
      { to: '/personel-talepleri', label: 'Personel onayları', code: '17b', adminOnly: true },
      { to: '/ayarlar', label: 'Ayarlar', code: '18' },
      { to: '/bildirimler', label: 'Bildirimler', code: '19' },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getUser());
  const isAdmin = user?.role === 'admin';
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    void api<{
      id: string;
      email: string;
      role: string;
      firstName?: string | null;
      lastName?: string | null;
      hasPassword?: boolean;
    }>('/auth/me')
      .then((me) => {
        setSession(token, me);
        setUser(me);
      })
      .catch(() => {
        setUser(getUser());
      });
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const tick = async () => {
      setPending(await pendingCount());
      if (navigator.onLine) {
        try {
          const result = await flushOutbox();
          await pullAll();
          if (result.flushed) setSyncMsg(`${result.flushed} kayıt senkron`);
        } catch {
          setSyncMsg('SYNC_WAIT');
        }
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 15000);
    const offClick = window.ops?.onNotificationClick?.((href) => {
      navigate(href.startsWith('/') ? href : `/${href}`);
    });
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(id);
      offClick?.();
    };
  }, [navigate]);

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border-muted bg-background">
        <div className="border-b border-border-muted px-4 py-5">
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Ops // Mağaza</p>
          <p className="mt-1 text-lg font-semibold leading-tight">Kılıç Coffee Roaster</p>
          <p className="mono text-xs text-accent">ROASTER</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-auto p-2">
          {NAV.map((group) => (
            <div key={group.title} className="mb-3">
              <p className="mono px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                {group.title}
              </p>
              {group.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'text-foreground/80 hover:bg-surface-high'
                      }`
                    }
                  >
                    <span className="mono text-[10px] opacity-70">{item.code}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-border-muted p-3 text-xs">
          <p className="mono text-[10px] uppercase tracking-widest text-muted">System_Status</p>
          <p className={online ? 'text-success' : 'text-warning'}>{online ? 'ONLINE' : 'OFFLINE'}</p>
          <p className="text-muted">SYNC_PENDING {pending}</p>
          {syncMsg ? <p className="text-accent">{syncMsg}</p> : null}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border-muted px-6 py-3">
          <div className="hidden shrink-0 lg:block">
            <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">{user?.email}</p>
            {user?.role ? (
              <p className="mono text-[10px] uppercase text-accent">{user.role}</p>
            ) : null}
          </div>
          <OpsSearch />
          <NotificationBell />
          <button
            className="shrink-0 border border-border px-3 py-1.5 text-sm hover:bg-accent hover:text-white"
            onClick={() => {
              clearSession();
              navigate('/login');
            }}
          >
            Çıkış
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
