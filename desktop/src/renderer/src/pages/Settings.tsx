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

  useEffect(() => {
    void api<Settings>('/accounting/settings').then(setForm).catch(() => {
      setForm({
        companyTitle: '',
        earchivePrefix: '',
        einvoicePrefix: '',
      });
    });
    void api<{ hasPassword?: boolean }>('/auth/me')
      .then((me) => setHasPassword(Boolean(me.hasPassword)))
      .catch(() => {
        const local = getUser();
        setHasPassword(Boolean(local?.hasPassword));
      });
    void window.ops?.getAppVersion?.().then(setAppVersion).catch(() => {});
  }, []);

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
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-3 block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
              value={form[key] || ''}
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
