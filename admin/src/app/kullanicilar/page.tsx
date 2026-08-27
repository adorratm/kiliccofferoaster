'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { asPaged } from '@/lib/utils';

type Role = 'customer' | 'staff' | 'accountant' | 'admin';

type ManagedUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  provider: string;
  createdAt?: string;
};

type AllowlistRow = {
  id: string;
  email: string;
  active: boolean;
  note: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  customer: 'Müşteri',
  staff: 'Personel',
  accountant: 'Muhasebe',
  admin: 'Admin',
};

const ROLE_OPTIONS: Role[] = ['customer', 'staff', 'accountant', 'admin'];

function displayName(u: ManagedUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
}

export default function UsersAdminPage() {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | Role | 'ops'>('ops');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [createRole, setCreateRole] = useState<'staff' | 'accountant' | 'admin'>(
    'staff',
  );

  const [allowEmail, setAllowEmail] = useState('');
  const [allowNote, setAllowNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (q.trim()) params.set('q', q.trim());
      const [users, list] = await Promise.all([
        api<unknown>(`/auth/users?${params}`),
        api<AllowlistRow[]>('/auth/admin-allowlist'),
      ]);
      setRows(asPaged<ManagedUser>(users).items);
      setAllowlist(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api('/auth/ops-users', {
        method: 'POST',
        body: {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role: createRole,
        },
      });
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setMessage('Hesap oluşturuldu');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız');
    }
  }

  async function setRole(id: string, role: Role) {
    setBusyId(id);
    setMessage(null);
    setError(null);
    try {
      await api(`/auth/users/${id}`, { method: 'PATCH', body: { role } });
      setMessage('Rol güncellendi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rol güncellenemedi');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(u: ManagedUser) {
    setBusyId(u.id);
    setMessage(null);
    setError(null);
    try {
      await api(`/auth/users/${u.id}`, {
        method: 'PATCH',
        body: { isActive: !u.isActive },
      });
      setMessage(u.isActive ? 'Pasifleştirildi' : 'Aktifleştirildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
    } finally {
      setBusyId(null);
    }
  }

  async function addAllowlist(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api('/auth/admin-allowlist', {
        method: 'POST',
        body: {
          email: allowEmail,
          note: allowNote || undefined,
          promoteUser: true,
        },
      });
      setAllowEmail('');
      setAllowNote('');
      setMessage('Admin allowlist’e eklendi (çoklu admin)');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Allowlist eklenemedi');
    }
  }

  async function deactivateAllow(id: string) {
    setBusyId(id);
    try {
      await api(`/auth/admin-allowlist/${id}`, { method: 'DELETE' });
      setMessage('Allowlist pasifleştirildi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Kullanıcılar</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Admin: kullanıcı ekleme/çıkarma, personel tanımlama, müşteri görüntüleme
          ve rol yetkisi. Birden fazla admin Google allowlist veya rol ataması ile
          çalışır. Personel mağaza operasyonunu yönetir; site/CMS/yetki yönetimi
          yalnızca admin’dedir.
        </p>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="border border-accent/40 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={onCreate}
          className="space-y-3 border border-border-muted bg-surface p-4"
        >
          <p className="mono text-[10px] uppercase text-muted">Yeni hesap</p>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre (min 8)"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ad"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyad"
              className="border border-border-muted bg-background px-3 py-2 text-sm"
            />
          </div>
          <select
            value={createRole}
            onChange={(e) =>
              setCreateRole(e.target.value as 'staff' | 'accountant' | 'admin')
            }
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          >
            <option value="staff">Personel</option>
            <option value="accountant">Muhasebe</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
          >
            Oluştur
          </button>
        </form>

        <form
          onSubmit={addAllowlist}
          className="space-y-3 border border-border-muted bg-surface p-4"
        >
          <p className="mono text-[10px] uppercase text-muted">
            Admin allowlist (Google)
          </p>
          <p className="text-xs text-muted">
            E-posta eklenince Google admin girişi açılır; kayıtlıysa rol admin
            yapılır.
          </p>
          <input
            required
            type="email"
            value={allowEmail}
            onChange={(e) => setAllowEmail(e.target.value)}
            placeholder="admin@firma.com"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <input
            value={allowNote}
            onChange={(e) => setAllowNote(e.target.value)}
            placeholder="Not (opsiyonel)"
            className="w-full border border-border-muted bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-white"
          >
            Allowlist’e ekle
          </button>
          <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-sm">
            {allowlist.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 border-b border-border-muted/40 pb-2"
              >
                <span>
                  {a.email}
                  <span className="ml-2 text-xs text-muted">
                    {a.active ? 'aktif' : 'pasif'}
                  </span>
                </span>
                {a.active ? (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => void deactivateAllow(a.id)}
                    className="text-xs text-danger"
                  >
                    Çıkar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['ops', 'Personel / Admin'],
            ['customer', 'Müşteriler'],
            ['admin', 'Adminler'],
            ['staff', 'Personel'],
            ['accountant', 'Muhasebe'],
            ['all', 'Tümü'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRoleFilter(value)}
            className={`border px-3 py-1.5 text-xs ${
              roleFilter === value
                ? 'border-accent bg-accent text-white'
                : 'border-border-muted text-muted hover:border-accent'
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara…"
          className="ml-auto border border-border-muted bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="border border-border-muted px-3 py-1.5 text-xs"
        >
          Yenile
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <div className="overflow-x-auto border border-border-muted">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-muted text-left text-muted">
                <th className="px-3 py-2">Kullanıcı</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border-muted/40">
                  <td className="px-3 py-3">
                    <p className="font-medium">{displayName(u)}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) =>
                        void setRole(u.id, e.target.value as Role)
                      }
                      className="border border-border-muted bg-background px-2 py-1 text-sm"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    {u.isActive ? (
                      <span className="text-accent">Aktif</span>
                    ) : (
                      <span className="text-danger">Pasif</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => void toggleActive(u)}
                      className="text-xs text-muted hover:text-accent"
                    >
                      {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="px-3 py-6 text-sm text-muted">Kayıt yok.</p>
          ) : null}
        </div>
      )}

      <div className="border border-border-muted bg-surface p-4 text-sm text-muted">
        <p className="mono text-[10px] uppercase tracking-widest text-accent">
          Yetki ayrımı
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Admin:</strong> kullanıcı/yetki,
            site ayarları, CMS, blog, galeri, sözleşmeler, pazaryeri hesapları,
            kuyruklar, personel onayları.
          </li>
          <li>
            <strong className="text-foreground">Personel / Muhasebe:</strong>{' '}
            sipariş, ürün, stok, kasa, fatura, müşteri görüntüleme, kargo,
            kupon, kampanya — kullanıcı yetkisi değiştiremez.
          </li>
        </ul>
      </div>
    </div>
  );
}
