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
  petWindowPositionController.restore();
  await loadWindow(petWindow, 'pet');
  await loadWindow(panelWindow, 'panel');
  alignPanelWindow();
}

if (ipcMain?.handle) {
  ipcMain.handle('runtime:getInfo', (event) => ({
    platform: process.platform,
    surface: resolveRuntimeSurface(event.sender.id, {
      petWindowId: petWindow?.webContents.id ?? null,
      panelWindowId: panelWindow?.webContents.id ?? null
    })
  }));

  ipcMain.handle('window:movePet', (_event, payload: { x: number; y: number }) => {
    petWindowPositionController.move(payload);
  });

  ipcMain.handle('window:persistPetPosition', (_event, payload: { x: number; y: number }) => {
    return petWindowPositionController.persist(payload);
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
}

if (app?.on) {
  app.on('before-quit', () => {
    void sshTunnelRuntime.disconnect();
  });
}

if (app?.whenReady) {
  void app.whenReady().then(createWindow);
}
