import { app, BrowserWindow } from 'electron';

async function createWindow() {
  const window = new BrowserWindow({
    width: 420,
    height: 320
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  }
}

void app.whenReady().then(createWindow);
