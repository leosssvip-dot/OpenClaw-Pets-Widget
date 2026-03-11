import { fileURLToPath } from 'node:url';
import type { BrowserWindowConstructorOptions } from 'electron';

function resolvePreloadPath() {
  try {
    return fileURLToPath(new URL('./preload.cjs', import.meta.url));
  } catch {
    return './preload.cjs';
  }
}

export function buildPetWidgetWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: 196,
    height: 220,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true
    }
  };
}

export async function createPetWidgetWindow() {
  const { BrowserWindow } = await import('electron');
  return new BrowserWindow(buildPetWidgetWindowOptions());
}
