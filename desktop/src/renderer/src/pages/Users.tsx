import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, getUser } from '../lib/api';

type Role = 'customer' | 'staff' | 'accountant' | 'admin';

type ManagedUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
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

function asItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: T[] }).items;
  }
  return [];
}

export function UsersPage() {
  const [isAdmin, setIsAdmin] = useState(() => getUser()?.role === 'admin');
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistRow[]>([]);
  const [roleFilter, setRoleFilter] = useState('ops');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createRole, setCreateRole] = useState<'staff' | 'accountant' | 'admin'>('staff');
  const [allowEmail, setAllowEmail] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const me = await api<{ role: string }>('/auth/me');
      setIsAdmin(me.role === 'admin');
      if (me.role !== 'admin') {
        setError('Bu sayfa yalnızca yöneticiler içindir.');
        return;
      }
      const qs =
        roleFilter === 'all'
          ? 'limit=80'
          : `role=${encodeURIComponent(roleFilter)}&limit=80`;
      const [users, list] = await Promise.all([
        api<unknown>(`/auth/users?${qs}`),
        api<AllowlistRow[]>('/auth/admin-allowlist'),
      ]);
      setRows(asItems<ManagedUser>(users));
      setAllowlist(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    }
  }, [roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/auth/ops-users', {
        method: 'POST',
        body: { email, password, role: createRole },
      });
      setEmail('');
      setPassword('');
      setMsg('Hesap oluşturuldu');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız');
    }
  }

  async function setRole(id: string, role: Role) {
    try {
      await api(`/auth/users/${id}`, { method: 'PATCH', body: { role } });
      setMsg('Rol güncellendi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
    }
  }

  async function toggleActive(u: ManagedUser) {
    try {
      await api(`/auth/users/${u.id}`, {
        method: 'PATCH',
        body: { isActive: !u.isActive },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
    }
  }

  async function addAllow(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/auth/admin-allowlist', {
        method: 'POST',
        body: { email: allowEmail, promoteUser: true },
      });
      setAllowEmail('');
      setMsg('Admin allowlist güncellendi');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Allowlist hatası');
    }
  }

  if (!isAdmin && error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="max-w-4xl">
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Auth // Kullanıcılar
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Yetki yönetimi</h1>
      <p className="mt-2 text-sm text-muted">
        Admin ekleme/çıkarma, personel tanımlama, müşteri rollerini ayarlama. Birden
        fazla admin allowlist ile çalışır.
      </p>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {msg ? <p className="mt-3 text-sm text-success">{msg}</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <form onSubmit={onCreate} className="space-y-2 border border-border-muted p-4">
          <p className="mono text-[10px] uppercase text-muted">Yeni hesap</p>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            className="w-full border border-border-muted bg-background px-3 py-2"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full border border-border-muted bg-background px-3 py-2"
          />
          <select
            value={createRole}
            onChange={(e) =>
              setCreateRole(e.target.value as 'staff' | 'accountant' | 'admin')
            }
            className="w-full border border-border-muted bg-background px-3 py-2"
          >
            <option value="staff">Personel</option>
            <option value="accountant">Muhasebe</option>
            <option value="admin">Admin</option>
          </select>
          <button className="bg-accent px-4 py-2 text-white">Oluştur</button>
        </form>

        <form onSubmit={addAllow} className="space-y-2 border border-border-muted p-4">
          <p className="mono text-[10px] uppercase text-muted">Admin allowlist</p>
          <input
            required
            type="email"
            value={allowEmail}
            onChange={(e) => setAllowEmail(e.target.value)}
            placeholder="ikinci-admin@firma.com"
            className="w-full border border-border-muted bg-background px-3 py-2"
          />
          <button className="border border-accent px-4 py-2 text-accent">Ekle</button>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm">
            {allowlist
              .filter((a) => a.active)
              .map((a) => (
                <li key={a.id} className="text-muted">
                  {a.email}
                </li>
              ))}
          </ul>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['ops', 'Ops'],
          ['customer', 'Müşteri'],
          ['admin', 'Admin'],
          ['all', 'Tümü'],
        ].map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setRoleFilter(v)}
            className={`border px-3 py-1 text-xs ${
              roleFilter === v ? 'border-accent text-accent' : 'border-border-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border-muted text-left text-muted">
            <th className="py-2">Kullanıcı</th>
            <th>Rol</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-border-muted/40">
              <td className="py-2">
                <p>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => void setRole(u.id, e.target.value as Role)}
                  className="border border-border-muted bg-background px-2 py-1"
                >
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => void toggleActive(u)}
                  className="text-xs text-muted hover:text-accent"
                >
                  {u.isActive ? 'Aktif · pasifleştir' : 'Pasif · aktifleştir'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
