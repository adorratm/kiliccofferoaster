import { BrowserWindow } from 'electron';
import { appIconPath } from './icon';

type GoogleLoginResult = { token: string };

function pickAuthResult(url: string): { token: string } | { error: string } | null {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    const error = parsed.searchParams.get('error');
    const isCallback = /\/auth\/callback\/?$/.test(parsed.pathname);
    const isLoginError = /\/login\/?$/.test(parsed.pathname) && Boolean(error);
    if (isCallback && token) return { token };
    if (isLoginError) return { error: error || 'Giriş reddedildi' };
  } catch {
    return null;
  }
  return null;
}

export function runGoogleLogin(apiUrl: string, parent?: BrowserWindow): Promise<GoogleLoginResult> {
  return new Promise((resolve, reject) => {
    const authWin = new BrowserWindow({
      width: 520,
      height: 740,
      parent,
      modal: Boolean(parent),
      show: true,
      autoHideMenuBar: true,
      backgroundColor: '#131313',
      title: 'Google ile giriş',
      icon: appIconPath(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: 'persist:ops-google',
      },
    });

    let settled = false;
    const finishOk = (token: string) => {
      if (settled) return;
      settled = true;
      if (!authWin.isDestroyed()) authWin.close();
      resolve({ token });
    };
    const finishErr = (message: string) => {
      if (settled) return;
      settled = true;
      if (!authWin.isDestroyed()) authWin.close();
      reject(new Error(message));
    };

    const onUrl = (url: string, prevent?: () => void) => {
      const result = pickAuthResult(url);
      if (!result) return;
      prevent?.();
      if ('token' in result) finishOk(result.token);
      else finishErr(result.error);
    };

    authWin.webContents.on('will-redirect', (event, url) => {
      onUrl(url, () => event.preventDefault());
    });
    authWin.webContents.on('will-navigate', (event, url) => {
      onUrl(url, () => event.preventDefault());
    });
    authWin.webContents.on('did-navigate', (_event, url) => {
      onUrl(url);
    });
    authWin.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (!isMainFrame || settled) return;
        onUrl(validatedURL);
        if (settled || errorCode === -3) return;
        finishErr(
          `Google giriş sayfası açılamadı (${errorDescription}). API çalışıyor mu?`,
        );
      },
    );
    authWin.on('closed', () => {
      if (!settled) reject(new Error('Giriş iptal edildi'));
    });

    const base = apiUrl.replace(/\/$/, '');
    void authWin.loadURL(`${base}/auth/google/admin`);
  });
}
