import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { fileURLToPath } from 'node:url';
import type { GatewayProfile } from '@openclaw-habitat/bridge';
import type { GatewaySessionAuth } from '../src/runtime/gateway-session-auth';
import { createHabitatTray } from './tray';
import { createPanelWindow } from './panel-window';
import { createPetWidgetWindow } from './pet-window';
import { resolveRuntimeSurface } from './runtime-info';
import { deleteSecret, retrieveSecret, storeSecret } from './secure-store';
import { SshTunnelRuntime } from './ssh-runtime';

let petWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
const sshTunnelRuntime = new SshTunnelRuntime();

async function loadWindow(window: BrowserWindow, surface: 'pet' | 'panel') {
  const search = `surface=${surface}`;

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${search}`);
    return;
  }

  await window.loadFile(fileURLToPath(new URL('../dist/index.html', import.meta.url)), {
    search
  });
}

function alignPanelWindow() {
  if (!petWindow || !panelWindow) {
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
  petWindow = await createPetWidgetWindow();
  panelWindow = await createPanelWindow();
  createHabitatTray();
  pipeRendererLogs(panelWindow);
  petWindow.on('move', alignPanelWindow);
  petWindow.on('closed', () => {
    petWindow = null;
    panelWindow?.close();
  });
  await loadWindow(petWindow, 'pet');
  await loadWindow(panelWindow, 'panel');
  alignPanelWindow();
}

ipcMain.handle('runtime:getInfo', (event) => ({
  platform: process.platform,
  surface: resolveRuntimeSurface(event.sender.id, {
    petWindowId: petWindow?.webContents.id ?? null,
    panelWindowId: panelWindow?.webContents.id ?? null
  })
}));

ipcMain.handle('window:movePet', (_event, payload: { x: number; y: number }) => {
  petWindow?.setPosition(payload.x, payload.y);
  alignPanelWindow();
});

ipcMain.handle('window:togglePanel', () => {
  if (!panelWindow) {
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

ipcMain.handle('window:snapPet', () => {
  if (!petWindow) {
    return null;
  }

  const petBounds = petWindow.getBounds();
  const display = screen.getDisplayMatching(petBounds);
  const side =
    petBounds.x + petBounds.width / 2 < display.workArea.x + display.workArea.width / 2
      ? 'left'
      : 'right';
  const snappedX =
    side === 'left'
      ? display.workArea.x
      : display.workArea.x + display.workArea.width - petBounds.width;

  petWindow.setPosition(snappedX, petBounds.y);
  alignPanelWindow();

  return { side };
});

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

ipcMain.handle('secrets:store', async (_event, payload: { key: string; value: string }) => {
  await storeSecret(payload.key, payload.value);
});

ipcMain.handle('secrets:retrieve', async (_event, payload: { key: string }) => {
  return retrieveSecret(payload.key);
});

ipcMain.handle('secrets:delete', async (_event, payload: { key: string }) => {
  await deleteSecret(payload.key);
});

app.on('before-quit', () => {
  void sshTunnelRuntime.disconnect();
});

void app.whenReady().then(createWindow);
