import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { app, Menu, Tray, nativeImage } from 'electron';

function createTrayIcon() {
  // Try to use the logo PNG for better Windows compatibility
  // (SVG data URLs often render as blank on Windows tray)
  const appRoot = app.getAppPath();
  const candidates = [
    join(appRoot, 'dist', 'logo', 'logo-256.png'),
    join(appRoot, 'public', 'logo', 'logo-256.png'),
    join(appRoot, '..', 'dist', 'logo', 'logo-256.png'),
    join(appRoot, '..', 'public', 'logo', 'logo-256.png')
  ];
  const pngPath = candidates.find((p) => existsSync(p));
  if (pngPath) {
    return nativeImage.createFromPath(pngPath).resize({ width: 16, height: 16 });
  }

  // Fallback: inline SVG (works on macOS)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#172033"/>
      <path d="M8 18c0-4.3 3.5-7.8 7.8-7.8h.4c4.3 0 7.8 3.5 7.8 7.8v4.2H8V18Z" fill="#ff7043"/>
      <circle cx="12" cy="12" r="2.2" fill="#ff7043"/>
      <circle cx="20" cy="12" r="2.2" fill="#ff7043"/>
      <circle cx="14" cy="17" r="1.3" fill="#172033"/>
      <circle cx="18" cy="17" r="1.3" fill="#172033"/>
      <path d="M13.5 20.5c1.2 1 3.8 1 5 0" stroke="#172033" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    </svg>
  `.trim();
  return nativeImage
    .createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    .resize({ width: 16, height: 16 });
}

export function createHabitatTray() {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip('OpenClaw Pets Widget');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'OpenClaw Pets Widget',
      enabled: false
    },
    { type: 'separator' },
    {
      label: process.platform === 'darwin' ? 'Quit' : '退出 / Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  return tray;
}
