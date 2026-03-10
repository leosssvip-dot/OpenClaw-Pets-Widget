import { fileURLToPath } from 'node:url';
import type { BrowserWindowConstructorOptions } from 'electron';

function resolvePreloadPath() {
  try {
    return fileURLToPath(new URL('./preload.js', import.meta.url));
  } catch {
    return './preload.js';
  }
}

export function buildPetWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: 420,
    height: 320,
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
