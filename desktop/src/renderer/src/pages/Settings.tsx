import { FormEvent, useEffect, useState } from 'react';
import { api, getToken, getUser } from '../lib/api';

type Settings = {
  companyTitle: string;
  vkn?: string | null;
  taxOffice?: string | null;
  address?: string | null;
  city?: string | null;
  earchivePrefix: string;
  einvoicePrefix: string;
  paytrCommissionRatePercent?: string | number;
};

type OpsAccessRequest = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  opsAccessPending?: boolean;
  createdAt?: string;
};

export function SettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [requests, setRequests] = useState<OpsAccessRequest[]>([]);
  const [reqMsg, setReqMsg] = useState('');
  const [reqBusy, setReqBusy] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => getUser()?.role === 'admin');

  async function loadRequests() {
    try {
      const me = await api<{ role: string; hasPassword?: boolean }>('/auth/me');
      setIsAdmin(me.role === 'admin');
      setHasPassword(Boolean(me.hasPassword));
      if (me.role !== 'admin') {
        setRequests([]);
        return;
      }
      const list = await api<OpsAccessRequest[]>('/auth/ops-access-requests');
      setRequests(list);
    } catch {
      setRequests([]);
    }
  }

  useEffect(() => {
    void api<Settings>('/accounting/settings').then(setForm).catch(() => {
      setForm({
        companyTitle: '',
        earchivePrefix: '',
        einvoicePrefix: '',
      });
    });
    void window.ops?.getAppVersion?.().then(setAppVersion).catch(() => {});
    void loadRequests();
  }, []);

  async function onApprove(id: string, role: 'staff' | 'accountant' = 'staff') {
    setReqBusy(id);
    setReqMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/approve`, {
        method: 'POST',
        body: { role },
      });
      setReqMsg('Personel erişimi onaylandı.');
      await loadRequests();
    } catch (err) {
      setReqMsg(err instanceof Error ? err.message : 'Onay başarısız.');
    } finally {
      setReqBusy(null);
    }
  }

  async function onReject(id: string) {
    setReqBusy(id);
    setReqMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/reject`, { method: 'POST' });
      setReqMsg('Talep reddedildi. Hesap müşteri olarak kaldı.');
      await loadRequests();
    } catch (err) {
      setReqMsg(err instanceof Error ? err.message : 'Reddetme başarısız.');
    } finally {
      setReqBusy(null);
    }
  }

  async function onCheckUpdate() {
    setUpdateMsg('');
    setUpdateLoading(true);
    let settled = false;
    const done = (msg: string) => {
      if (settled) return;
      settled = true;
      setUpdateMsg(msg);
      setUpdateLoading(false);
      unsub?.();
    };
    const unsub = window.ops?.onUpdateEvent?.((event) => {
      if (event.type === 'available' && event.version) {
        setUpdateMsg(`Sürüm ${event.version} indiriliyor…`);
      } else if (event.type === 'progress' && event.percent != null) {
        setUpdateMsg(`İndiriliyor… %${Math.round(event.percent)}`);
      } else if (event.type === 'downloaded') {
        done('Kuruluyor…');
      } else if (event.type === 'not-available' || event.type === 'disabled') {
        done(event.type === 'disabled' ? 'Geliştirme derlemesinde otomatik güncelleme kapalı.' : 'Uygulama güncel.');
      } else if (event.type === 'error' && event.message) {
        done(event.message);
      }
    });
    try {
      const result = await window.ops?.checkForUpdate?.();
      if (result === 'disabled') {
        done('Geliştirme derlemesinde otomatik güncelleme kapalı.');
      } else if (result === 'up-to-date') {
        done('Uygulama güncel.');
      } else if (result === 'error') {
        done('Güncelleme kontrolü başarısız.');
      } else if (result === 'downloading') {
        setUpdateMsg((m) => m || 'Güncelleme indiriliyor…');
        // leave loading until downloaded / error event
      }
    } catch (e) {
      done(e instanceof Error ? e.message : 'Güncelleme kontrolü başarısız.');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const saved = await api<Settings>('/accounting/settings', {
      method: 'PATCH',
      body: form,
    });
    setForm(saved);
    setMsg('Kaydedildi');
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (newPassword.length < 8) {
      setPwError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== newPassword2) {
      setPwError('Şifreler eşleşmiyor.');
      return;
    }
    const user = getUser();
    const token = getToken();
    if (!user || !token) {
      setPwError('Oturum yok.');
      return;
    }
    setPwLoading(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: {
          ...(hasPassword ? { currentPassword } : {}),
          newPassword,
        },
      });
      await window.ops?.saveOfflineSession?.({
        email: user.email,
        token,
        user: { ...user, hasPassword: true },
        password: newPassword,
      });
      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setNewPassword2('');
      setPwMsg('Şifre kaydedildi. İnternet olmasa da bu cihazdan girebilirsiniz.');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Şifre kaydedilemedi.');
    } finally {
      setPwLoading(false);
    }
  }

  if (!form) return <p>Yükleniyor…</p>;

  return (
    <div className="max-w-xl">
      {isAdmin ? (
        <div className="mb-10 border border-border-muted bg-surface p-4">
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Auth // Personel talepleri
          </p>
          <h2 className="mt-1 text-xl font-semibold">Onay bekleyenler</h2>
          <p className="mt-1 text-sm text-muted">
            Masaüstünden kayıt olan hesaplar müşteri olarak kalır; burada
            onaylayınca personel olur.
          </p>
          {requests.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Bekleyen talep yok.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {requests.map((r) => {
                const name =
                  [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border-muted/50 pb-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted">{r.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={reqBusy === r.id}
                        className="bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
                        onClick={() => void onApprove(r.id, 'staff')}
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        disabled={reqBusy === r.id}
                        className="border border-border px-3 py-1.5 text-sm hover:bg-surface-high disabled:opacity-50"
                        onClick={() => void onReject(r.id)}
                      >
                        Reddet
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {reqMsg ? <p className="mt-3 text-sm text-muted">{reqMsg}</p> : null}
          <p className="mt-3 text-xs text-muted">
            Aynı liste sol menüde <span className="text-accent">Personel onayları</span> altında da
            var.
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">08 // Ayarlar</p>
        <h1 className="mt-1 text-2xl font-semibold">Firma / e-belge</h1>
        {(
          [
            ['companyTitle', 'Unvan'],
            ['vkn', 'VKN'],
            ['taxOffice', 'Vergi dairesi'],
            ['address', 'Adres'],
            ['city', 'Şehir'],
            ['earchivePrefix', 'e-Arşiv ön ek'],
            ['einvoicePrefix', 'e-Fatura ön ek'],
            ['paytrCommissionRatePercent', 'PayTR komisyon (%)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-3 block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
              type={key === 'paytrCommissionRatePercent' ? 'number' : 'text'}
              min={key === 'paytrCommissionRatePercent' ? 0 : undefined}
              max={key === 'paytrCommissionRatePercent' ? 100 : undefined}
              step={key === 'paytrCommissionRatePercent' ? 0.01 : undefined}
              value={form[key] ?? (key === 'paytrCommissionRatePercent' ? 2.19 : '')}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <button className="mt-4 bg-accent px-4 py-2 text-white">Kaydet</button>
        {msg ? <p className="mt-2 text-sm text-success">{msg}</p> : null}
      </form>

      <form onSubmit={onPassword} className="mt-10 border-t border-border-muted pt-8">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Auth // Çevrimdışı
        </p>
        <h2 className="mt-1 text-xl font-semibold">Google hesabı şifresi</h2>
        <p className="mt-2 text-sm text-muted">
          Bu şifre Google hesabınıza bağlanır. İnternet varken sunucuya, bu cihazda da
          çevrimdışı giriş için kaydedilir.
        </p>
        {hasPassword ? (
          <label className="mt-4 block text-sm">
            <span className="mono text-[10px] uppercase text-muted">Mevcut şifre</span>
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
        ) : null}
        <label className="mt-3 block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Yeni şifre</span>
          <input
            required
            minLength={8}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="mono text-[10px] uppercase text-muted">Şifre tekrar</span>
          <input
            required
            minLength={8}
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
          />
        </label>
        <button
          disabled={pwLoading}
          className="mt-4 bg-accent px-4 py-2 text-white disabled:opacity-50"
        >
          {pwLoading ? 'Kaydediliyor…' : hasPassword ? 'Şifreyi değiştir' : 'Şifre belirle'}
        </button>
        {pwMsg ? <p className="mt-2 text-sm text-success">{pwMsg}</p> : null}
        {pwError ? <p className="mt-2 text-sm text-danger">{pwError}</p> : null}
      </form>

      <div className="mt-10 border-t border-border-muted pt-8">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          App // Güncelleme
        </p>
        <h2 className="mt-1 text-xl font-semibold">Uygulama sürümü</h2>
        <p className="mt-2 text-sm text-muted">
          Kurulu sürüm: {appVersion || '—'}
        </p>
        <button
          type="button"
          disabled={updateLoading}
          onClick={() => void onCheckUpdate()}
          className="mt-4 bg-accent px-4 py-2 text-white disabled:opacity-50"
        >
          {updateLoading ? 'Kontrol ediliyor…' : 'Güncellemeleri kontrol et'}
        </button>
        {updateMsg ? <p className="mt-2 text-sm text-muted">{updateMsg}</p> : null}
      </div>
    </div>
  );
}
