import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

export function appIconPath(): string {
  const dir = app.isPackaged
    ? join(process.resourcesPath, 'resources')
    : join(__dirname, '../../resources');
  const ico = join(dir, 'icon.ico');
  const png = join(dir, 'icon.png');
  if (process.platform === 'win32' && existsSync(ico)) return ico;
  return png;
}
