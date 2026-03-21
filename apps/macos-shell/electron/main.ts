import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, nativeImage, screen, session, Tray, type IpcMainEvent } from 'electron';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import type { GatewaySessionAuth } from '../src/runtime/gateway-session-auth';
import { createHabitatTray } from './tray';
import { createPanelWindow } from './panel-window';
import { createPetWidgetWindow } from './pet-window';
import { resolveRuntimeSurface } from './runtime-info';
import { SshTunnelRuntime } from './ssh-runtime';

let petWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
let habitatTray: Tray | null = null;
const sshTunnelRuntime = new SshTunnelRuntime();

export interface PetWindowPlacement {
  x: number;
  y: number;
  displayId?: string;
}

interface ScreenLike {
  getAllDisplays: () => Array<{
    id: number | string;
    workArea: { x: number; y: number; width: number; height: number };
  }>;
  getDisplayMatching: (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    id: number | string;
    workArea: { x: number; y: number; width: number; height: number };
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampPetWindowPosition(
  placement: PetWindowPlacement,
  currentScreen: ScreenLike,
  size: { width: number; height: number }
): PetWindowPlacement {
  const display =
    currentScreen
      .getAllDisplays()
      .find((candidate) => String(candidate.id) === placement.displayId) ??
    currentScreen.getDisplayMatching({
      x: placement.x,
      y: placement.y,
      width: size.width,
      height: size.height
    });
  const maxX = Math.max(display.workArea.x, display.workArea.x + display.workArea.width - size.width);
  const maxY = Math.max(display.workArea.y, display.workArea.y + display.workArea.height - size.height);

  return {
    x: clamp(placement.x, display.workArea.x, maxX),
    y: clamp(placement.y, display.workArea.y, maxY),
    displayId: String(display.id)
  };
}

export function createPetWindowPositionController({
  screen,
  getPetWindow,
  onPositionApplied
}: {
  screen: ScreenLike;
  getPetWindow: () => BrowserWindow | null;
  onPositionApplied?: () => void;
}) {
  let savedPlacement: PetWindowPlacement | null = null;

  return {
    move(payload: { x: number; y: number }) {
      const currentPetWindow = getPetWindow();

      currentPetWindow?.setPosition(payload.x, payload.y);
      onPositionApplied?.();
    },
    persist(payload: { x: number; y: number }) {
      const currentPetWindow = getPetWindow();

      if (!currentPetWindow) {
        return null;
      }

      const bounds = currentPetWindow.getBounds();
      savedPlacement = clampPetWindowPosition(payload, screen, {
        width: bounds.width,
        height: bounds.height
      });

      return savedPlacement;
    },
    restore() {
      const currentPetWindow = getPetWindow();

      if (!currentPetWindow || !savedPlacement) {
        return savedPlacement;
      }

      const bounds = currentPetWindow.getBounds();
      const restoredPlacement = clampPetWindowPosition(savedPlacement, screen, {
        width: bounds.width,
        height: bounds.height
      });

      currentPetWindow.setPosition(restoredPlacement.x, restoredPlacement.y);
      onPositionApplied?.();
      savedPlacement = restoredPlacement;
      return restoredPlacement;
    }
  };
}

const petWindowPositionController = createPetWindowPositionController({
  screen,
  getPetWindow: () => petWindow,
  onPositionApplied: () => {
    alignPanelWindow();
  }
});

async function loadWindow(window: BrowserWindow, surface: 'pet' | 'panel') {
  const search = `surface=${surface}`;

  // Log renderer errors to main process stdout for debugging
  window.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[openclaw] ${surface} window failed to load: ${code} ${desc}`);
  });
  window.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[openclaw] ${surface} renderer crashed:`, details.reason);
  });

  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      await window.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${search}`);
      return;
    }

    // Resolve path relative to the main script location.
    // import.meta.url works in ESM; fallback to app.getAppPath() for asar.
    let htmlPath: string;
    try {
      htmlPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
    } catch {
      htmlPath = join(app.getAppPath(), 'dist', 'index.html');
    }
    console.log(`[openclaw] loading ${surface}: ${htmlPath}`);
    await window.loadFile(htmlPath, { search });
  } catch (err) {
    console.error(`[openclaw] ${surface} loadFile error:`, err);
    dialog.showErrorBox(`OpenClaw: ${surface} failed to load`, String(err));
  }
}

function alignPanelWindow() {
  if (!petWindow || petWindow.isDestroyed() || !panelWindow || panelWindow.isDestroyed()) {
    return;
  }

  const petBounds = petWindow.getBounds();
  panelWindow.setPosition(petBounds.x + petBounds.width + 12, petBounds.y);
}

function pipeRendererLogs(window: BrowserWindow) {
  window.webContents.on('console-message', (_event, _level, message) => {
    if (message.startsWith('[bridge]')) {
      console.log(message);
    }
  });
}

async function createWindow() {
  // Override Origin header for WebSocket connections so the gateway accepts
  // local connections from the Electron renderer (whose origin is file:// or null).
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['ws://127.0.0.1:*/*', 'ws://localhost:*/*'] },
    (details, callback) => {
      details.requestHeaders['Origin'] = `http://127.0.0.1`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  petWindow = await createPetWidgetWindow();
  panelWindow = await createPanelWindow();
  habitatTray = createHabitatTray();

  // Set app icon (Dock on macOS, taskbar on Windows/Linux)
  const logoDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'logo');
  const devLogoDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'logo');
  const distLogoDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'logo');
  const logoPath = [logoDir, devLogoDir, distLogoDir]
    .map((dir) => join(dir, 'logo-1024.png'))
    .find((p) => existsSync(p));
  if (logoPath) {
    const appIcon = nativeImage.createFromPath(logoPath);
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(appIcon);
    }
  }
  pipeRendererLogs(petWindow);
  pipeRendererLogs(panelWindow);
  petWindow.on('move', alignPanelWindow);
  petWindow.on('closed', () => {
    petWindow = null;
    if (panelWindow && !panelWindow.isDestroyed()) {
      panelWindow.close();
    }
  });

  // Place pet window at a visible default position (bottom-right of primary display)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;
  const { x: workX, y: workY } = primaryDisplay.workArea;
  petWindow.setPosition(
    workX + screenW - 250,
    workY + screenH - 280
  );

  petWindowPositionController.restore();
  await loadWindow(petWindow, 'pet');
  await loadWindow(panelWindow, 'panel');

  // Ensure pet window is visible after content loads
  if (process.platform === 'darwin') {
    petWindow.showInactive();
  } else {
    petWindow.show();
  }
  alignPanelWindow();
}

if (ipcMain?.handle) {
  // Forward habitat sync messages from panel → pet window
  ipcMain.on('habitat:sync', (event: IpcMainEvent, msg: unknown) => {
    const senderId = event.sender.id;
    const petId = petWindow?.isDestroyed() === false ? petWindow.webContents.id : null;
    const panelId = panelWindow?.isDestroyed() === false ? panelWindow.webContents.id : null;
    const target =
      petWindow && !petWindow.isDestroyed() && senderId !== petWindow.webContents.id
        ? petWindow
        : panelWindow && !panelWindow.isDestroyed() && senderId !== panelWindow.webContents.id
          ? panelWindow
          : null;
    console.log(`[bridge] main ipc habitat:sync sender=${senderId} petWin=${petId} panelWin=${panelId} target=${target ? 'found' : 'none'}`);
    target?.webContents.send('habitat:sync', msg);
  });

  ipcMain.handle('runtime:getInfo', (event) => ({
    platform: process.platform,
    surface: resolveRuntimeSurface(event.sender.id, {
      petWindowId: petWindow && !petWindow.isDestroyed() ? petWindow.webContents.id : null,
      panelWindowId: panelWindow && !panelWindow.isDestroyed() ? panelWindow.webContents.id : null
    })
  }));

  ipcMain.handle('window:movePet', (_event, payload: { x: number; y: number }) => {
    petWindowPositionController.move(payload);
  });

  ipcMain.handle('window:persistPetPosition', (_event, payload: { x: number; y: number }) => {
    return petWindowPositionController.persist(payload);
  });

  ipcMain.handle('window:setPetWindowSize', (_event, size: { width: number; height: number }) => {
    if (!petWindow || petWindow.isDestroyed()) return;
    const [x, y] = petWindow.getPosition();
    petWindow.setBounds({ x, y, width: size.width, height: size.height });
    alignPanelWindow();
  });

  ipcMain.handle('window:togglePanel', () => {
    if (!panelWindow || panelWindow.isDestroyed()) {
      return { isOpen: false };
    }

    if (panelWindow.isVisible()) {
      panelWindow.hide();
      return { isOpen: false };
    }

    alignPanelWindow();
    panelWindow.show();
    panelWindow.focus();
    return { isOpen: true };
  });

  ipcMain.handle('window:showPanel', () => {
    if (!panelWindow || panelWindow.isDestroyed()) {
      return { isOpen: false };
    }

    if (!panelWindow.isVisible()) {
      alignPanelWindow();
      panelWindow.show();
    }
    panelWindow.focus();
    return { isOpen: true };
  });

  ipcMain.handle(
    'window:showPetContextMenu',
    (_event, payload: { items: Array<{ id: string; label: string; type?: 'separator' | 'normal'; enabled?: boolean; checked?: boolean }> }) => {
      return new Promise<string | null>((resolve) => {
        const menu = new Menu();
        for (const item of payload.items) {
          if (item.type === 'separator') {
            menu.append(new MenuItem({ type: 'separator' }));
          } else {
            menu.append(new MenuItem({
              label: item.label,
              type: item.checked != null ? 'checkbox' : 'normal',
              checked: item.checked ?? false,
              enabled: item.enabled ?? true,
              click: () => resolve(item.id),
            }));
          }
        }
        menu.once('menu-will-close', () => {
          // Resolve null if nothing was clicked (after a tick so click handler runs first)
          setTimeout(() => resolve(null), 50);
        });
        menu.popup({ window: petWindow && !petWindow.isDestroyed() ? petWindow : undefined });
      });
    }
  );

  ipcMain.handle(
    'gateway:prepareConnection',
    async (
      _event,
      payload: {
        profile: GatewayProfile;
        sessionAuth?: GatewaySessionAuth;
      }
    ) => {
      if (payload.profile.transport !== 'ssh') {
        return null;
      }

      return sshTunnelRuntime.prepareConnection(payload.profile, payload.sessionAuth);
    }
  );

  ipcMain.handle('gateway:teardownConnection', async () => {
    await sshTunnelRuntime.disconnect();
  });


  /* ---------- Settings file persistence (survives app restarts) ---------- */
  const settingsDir = app.isReady()
    ? app.getPath('userData')
    : '';

  function getSettingsPath() {
    const dir = settingsDir || app.getPath('userData');
    return join(dir, 'openclaw-settings.json');
  }

  ipcMain.handle('settings:read', async () => {
    try {
      const raw = await readFile(getSettingsPath(), 'utf-8');
      return raw;
    } catch {
      // 文件不存在时返回 null，让渲染端使用默认值
      return null;
    }
  });

  ipcMain.handle('settings:write', async (_event, payload: { data: string }) => {
    const filePath = getSettingsPath();
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, payload.data, 'utf-8');
  });
}

if (app?.on) {
  app.on('before-quit', () => {
    void sshTunnelRuntime.disconnect();
  });
}

if (app?.whenReady) {
  void app.whenReady().then(createWindow).catch((err) => {
    dialog.showErrorBox('OpenClaw Startup Error', String(err?.stack ?? err));
  });
}
