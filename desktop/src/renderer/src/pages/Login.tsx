import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiError,
  api,
  applySession,
  isOnline,
  type AuthUser,
} from '../lib/api';

type MeUser = AuthUser & { hasPassword?: boolean };

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [hasLocalPassword, setHasLocalPassword] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<MeUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  useEffect(() => {
    void window.ops?.offlineEmail?.().then((saved) => {
      if (saved) setEmail(saved);
    });
    void window.ops?.hasOfflinePassword?.().then(setHasLocalPassword);
  }, []);

  async function finishLogin(token: string, user: AuthUser, passwordForOffline?: string) {
    await applySession(token, user, passwordForOffline);
    navigate('/');
  }

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      if (!window.ops?.googleLogin) {
        throw new Error('Google girişi yalnızca masaüstü uygulamada kullanılabilir.');
      }
      const { token } = await window.ops.googleLogin();
      const me = await api<MeUser>('/auth/me', { token });
      await applySession(token, me);
      if (!me.hasPassword) {
        setPendingToken(token);
        setPendingUser(me);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google girişi başarısız.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSetOfflinePassword(e: FormEvent) {
    e.preventDefault();
    if (!pendingToken || !pendingUser) return;
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== newPassword2) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        token: pendingToken,
        body: { newPassword },
      });
      await finishLogin(pendingToken, { ...pendingUser, hasPassword: true }, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isOnline()) {
        try {
          const result = await api<{ accessToken: string; user: AuthUser }>(
            '/auth/ops-login',
            { method: 'POST', body: { email, password } },
          );
          await finishLogin(result.accessToken, result.user, password);
          return;
        } catch (err) {
          const authFail = err instanceof ApiError && (err.status === 401 || err.status === 403);
          if (authFail) {
            throw new Error(
              `${err.message} Google ile giriş yapın; ardından çevrimdışı şifre belirleyebilirsiniz.`,
            );
          }
        }
      }
      const local = await window.ops?.verifyOfflinePassword?.(email, password);
      if (!local) {
        throw new Error(
          isOnline()
            ? 'Giriş başarısız. Google ile girin veya bu cihazda kayıtlı çevrimdışı şifreyi kullanın.'
            : 'Çevrimdışı giriş başarısız. Önce internette Google ile girip bir şifre belirleyin.',
        );
      }
      await finishLogin(local.token, local.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  if (pendingUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <form
          onSubmit={onSetOfflinePassword}
          className="w-full max-w-md border border-border-muted bg-surface p-8"
        >
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Auth_Protocol // Offline
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Çevrimdışı şifre</h1>
          <p className="mt-2 text-sm text-muted">
            {pendingUser.email} Google ile bağlandı. İnternet yokken aynı hesapla girmek
            için bir şifre belirleyin. Bu şifre sunucuya da yazılır.
          </p>
          <label className="mt-6 block text-sm">
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
          <label className="mt-4 block text-sm">
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
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <button
            disabled={loading}
            className="mt-6 w-full bg-accent py-2.5 text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor…' : 'Şifreyi kaydet ve devam et'}
          </button>
          <button
            type="button"
            className="mt-3 w-full border border-border py-2.5 text-sm hover:bg-surface-high"
            onClick={() => void finishLogin(pendingToken || '', pendingUser)}
          >
            Şimdi değil
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-md border border-border-muted bg-surface p-8">
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Auth_Protocol // Ops
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Kılıç Coffee</h1>
        <p className="mt-1 text-sm text-muted">Ön muhasebe masaüstü</p>
        <button
          type="button"
          disabled={googleLoading || loading}
          onClick={() => void onGoogle()}
          className="mt-6 w-full bg-accent py-2.5 text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {googleLoading ? 'Google açılıyor…' : 'Google ile giriş'}
        </button>
        <p className="mt-3 text-center mono text-[10px] uppercase tracking-[0.16em] text-muted">
          veya şifre
        </p>
        <form onSubmit={onPasswordSubmit}>
          <label className="mt-4 block text-sm">
            <span className="mono text-[10px] uppercase text-muted">E-posta</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mono text-[10px] uppercase text-muted">Şifre</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
          {hasLocalPassword ? (
            <p className="mt-2 text-xs text-muted">
              Bu cihazda çevrimdışı şifre kayıtlı — internet olmasa da girebilirsiniz.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Google hesabında henüz şifre yoksa önce Google ile girin, sonra şifre
              belirleyin.
            </p>
          )}
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <button
            disabled={loading || googleLoading}
            className="mt-6 w-full border border-border py-2.5 hover:bg-accent hover:text-white disabled:opacity-50"
          >
            {loading ? 'Bağlanıyor…' : 'Şifre ile giriş'}
          </button>
        </form>
      </div>
    </div>
  );
}
