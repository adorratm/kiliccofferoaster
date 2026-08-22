import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

/** electron-builder appId — Windows taskbar gruplaması için aynı olmalı */
export const APP_USER_MODEL_ID = 'tr.kiliccoffeeroaster.desktop';

export function appIconPath(): string {
  const candidates = app.isPackaged
    ? [
        join(process.resourcesPath, 'resources', 'icon.ico'),
        join(process.resourcesPath, 'resources', 'icon.png'),
        join(process.resourcesPath, 'icon.ico'),
        join(process.resourcesPath, 'icon.png'),
      ]
    : [
        join(__dirname, '../../resources/icon.ico'),
        join(__dirname, '../../resources/icon.png'),
      ];

  if (process.platform === 'win32') {
    const ico = candidates.find((p) => p.endsWith('.ico') && existsSync(p));
    if (ico) return ico;
  }
  const png = candidates.find((p) => p.endsWith('.png') && existsSync(p));
  if (png) return png;
  const any = candidates.find((p) => existsSync(p));
  return any || candidates[0];
}
