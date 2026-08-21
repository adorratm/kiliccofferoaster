import { autoUpdater, type UpdateInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { app } from 'electron';

export type UpdateCheckResult = 'disabled' | 'up-to-date' | 'downloading' | 'error';

function broadcast(
  payload:
    | { type: 'checking' }
    | { type: 'available'; version: string }
    | { type: 'not-available' }
    | { type: 'progress'; percent: number }
    | { type: 'downloaded' }
    | { type: 'error'; message: string }
    | { type: 'disabled' },
) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('ops:update-event', payload);
  }
}

let wired = false;

export function setupAutoUpdater() {
  if (wired) return;
  wired = true;

  if (!app.isPackaged) {
    ipcMain.handle('ops:get-app-version', () => app.getVersion());
    ipcMain.handle('ops:check-for-update', async (): Promise<UpdateCheckResult> => {
      broadcast({ type: 'disabled' });
      return 'disabled';
    });
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    broadcast({ type: 'checking' });
  });
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    broadcast({ type: 'available', version: info.version });
  });
  autoUpdater.on('update-not-available', () => {
    broadcast({ type: 'not-available' });
  });
  autoUpdater.on('download-progress', (p) => {
    broadcast({ type: 'progress', percent: p.percent });
  });
  autoUpdater.on('update-downloaded', () => {
    broadcast({ type: 'downloaded' });
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 400);
  });
  autoUpdater.on('error', (err) => {
    broadcast({
      type: 'error',
      message: err?.message || 'Güncelleme hatası',
    });
  });

  ipcMain.handle('ops:get-app-version', () => app.getVersion());
  ipcMain.handle('ops:check-for-update', async (): Promise<UpdateCheckResult> => {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) return 'up-to-date';
      const current = app.getVersion();
      if (result.updateInfo.version === current) {
        broadcast({ type: 'not-available' });
        return 'up-to-date';
      }
      return 'downloading';
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Güncelleme kontrolü başarısız';
      broadcast({ type: 'error', message });
      return 'error';
    }
  });
}
