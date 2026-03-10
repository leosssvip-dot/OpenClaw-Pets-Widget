import { app, BrowserWindow, ipcMain } from 'electron';
import { createHabitatTray } from './tray';
import { buildPetWindowOptions } from './window-options';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow(buildPetWindowOptions());
  createHabitatTray();

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  }
}

ipcMain.handle('runtime:getInfo', () => ({
  platform: process.platform
}));

ipcMain.handle('window:movePet', (_event, payload: { x: number; y: number }) => {
  mainWindow?.setPosition(payload.x, payload.y);
});

void app.whenReady().then(createWindow);
