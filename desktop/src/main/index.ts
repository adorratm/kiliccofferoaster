import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  shell,
} from 'electron';
import { join } from 'path';
import { LocalStore } from './store';
import { runGoogleLogin } from './google-login';
import { appIconPath } from './icon';
import {
  OFFLINE_AUTH_KEY,
  parseOfflineAuth,
  upsertOfflineAuth,
  verifyOfflinePassword,
  type OfflineUser,
} from './offline-auth';

function urls() {
  const packaged = app.isPackaged;
  return {
    api:
      process.env.VITE_API_URL ||
      process.env.API_URL ||
      (packaged ? 'https://api.kiliccoffeeroaster.com.tr' : 'http://localhost:4000'),
    shop:
      process.env.VITE_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      (packaged ? 'https://kiliccoffeeroaster.com.tr' : 'http://localhost:3000'),
  };
}

function isExternalScheme(url: string): boolean {
  return /^(tel|mailto|sms|whatsapp):/i.test(url);
}

function allowShopPopup(url: string, shopUrl: string): boolean {
  try {
    const u = new URL(url);
    const shopHost = new URL(shopUrl).hostname;
    return (
      u.hostname === shopHost ||
      u.hostname === 'www.paytr.com' ||
      u.hostname.endsWith('.paytr.com') ||
      u.hostname.endsWith('.iyzipay.com') ||
      u.hostname.endsWith('.iyzico.com')
    );
  } catch {
    return false;
  }
}

function createShopWindow(): BrowserWindow {
  const { shop } = urls();
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#131313',
    title: 'Kılıç Coffee Roaster',
    icon: appIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} KilicCoffee/1.0 Desktop`);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalScheme(url)) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    if (allowShopPopup(url, shop)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      };
    }
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (isExternalScheme(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
  void win.loadURL(shop);
  return win;
}

function createOpsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#131313',
    title: 'Kılıç Coffee — Personel',
    icon: appIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return win;
}

function readOffline(store: LocalStore) {
  return parseOfflineAuth(store.getMeta(OFFLINE_AUTH_KEY));
}

function writeOffline(
  store: LocalStore,
  input: { email: string; token: string; user: OfflineUser; password?: string },
) {
  const next = upsertOfflineAuth(readOffline(store), input);
  store.setMeta(OFFLINE_AUTH_KEY, JSON.stringify(next));
  return next;
}

app.whenReady().then(async () => {
  const { api: API_URL } = urls();
  if (process.platform === 'win32') {
    app.setAppUserModelId('tr.kiliccoffeeroaster.desktop');
  }
  const dockIcon = nativeImage.createFromPath(appIconPath());
  if (!dockIcon.isEmpty() && app.dock) {
    app.dock.setIcon(dockIcon);
  }
  const store = await LocalStore.open();
  let shopWindow: BrowserWindow | null = null;
  let opsWindow: BrowserWindow | null = null;

  function showShop() {
    if (shopWindow && !shopWindow.isDestroyed()) {
      shopWindow.show();
      shopWindow.focus();
      return;
    }
    shopWindow = createShopWindow();
    shopWindow.on('closed', () => {
      shopWindow = null;
    });
  }

  function showOps() {
    if (opsWindow && !opsWindow.isDestroyed()) {
      opsWindow.show();
      opsWindow.focus();
      return;
    }
    opsWindow = createOpsWindow();
    opsWindow.on('closed', () => {
      opsWindow = null;
    });
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Kılıç Coffee',
        submenu: [
          { label: 'Mağaza', click: () => showShop() },
          { label: 'Personel paneli', click: () => showOps() },
          { type: 'separator' },
          { role: 'quit', label: 'Çıkış' },
        ],
      },
      { role: 'editMenu', label: 'Düzen' },
      { role: 'viewMenu', label: 'Görünüm' },
      { role: 'windowMenu', label: 'Pencere' },
    ]),
  );

  ipcMain.handle('ops:get-api-url', () => API_URL);
  ipcMain.handle('ops:outbox-list', () => store.listOutbox());
  ipcMain.handle('ops:outbox-add', (_e, row) => store.addOutbox(row));
  ipcMain.handle('ops:outbox-clear', (_e, ids: string[]) => store.clearOutbox(ids));
  ipcMain.handle('ops:cache-get', (_e, collection: string) => store.getCache(collection));
  ipcMain.handle('ops:cache-set', (_e, collection: string, rows: unknown[]) =>
    store.setCache(collection, rows),
  );
  ipcMain.handle('ops:meta-get', (_e, key: string) => store.getMeta(key));
  ipcMain.handle('ops:meta-set', (_e, key: string, value: string) => store.setMeta(key, value));
  ipcMain.handle('ops:online', () => true);
  ipcMain.handle('ops:google-login', () => runGoogleLogin(API_URL, opsWindow ?? undefined));
  ipcMain.handle(
    'ops:save-offline-session',
    (
      _e,
      input: { email: string; token: string; user: OfflineUser; password?: string },
    ) => {
      writeOffline(store, input);
    },
  );
  ipcMain.handle(
    'ops:verify-offline-password',
    (_e, input: { email: string; password: string }) => {
      const record = readOffline(store);
      if (!record) return null;
      const ok = verifyOfflinePassword(record, input.email, input.password);
      if (!ok) return null;
      return { token: ok.token, user: ok.user };
    },
  );
  ipcMain.handle('ops:offline-email', () => readOffline(store)?.email ?? null);
  ipcMain.handle('ops:has-offline-password', () => Boolean(readOffline(store)?.hash));
  ipcMain.handle(
    'ops:show-notification',
    (_e, payload: { title: string; body: string; href?: string | null }) => {
      if (!Notification.isSupported()) return;
      const n = new Notification({
        title: payload.title,
        body: payload.body,
        icon: appIconPath(),
      });
      n.on('click', () => {
        showOps();
        if (opsWindow && payload.href) {
          opsWindow.webContents.send('ops:notification-click', payload.href);
        }
      });
      n.show();
    },
  );

  showShop();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) showShop();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
