import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { createHabitatTray } from './tray';
import { createPanelWindow } from './panel-window';
import { createPetWidgetWindow } from './pet-window';
import { resolveRuntimeSurface } from './runtime-info';

let petWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;

async function loadWindow(window: BrowserWindow, surface: 'pet' | 'panel') {
  const search = `surface=${surface}`;

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${search}`);
    return;
  }

  await window.loadFile(new URL('../dist/index.html', import.meta.url), {
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

async function createWindow() {
  petWindow = await createPetWidgetWindow();
  panelWindow = await createPanelWindow();
  createHabitatTray();
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

void app.whenReady().then(createWindow);
