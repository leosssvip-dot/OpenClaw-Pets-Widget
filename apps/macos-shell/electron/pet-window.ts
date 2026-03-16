import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { BrowserWindowConstructorOptions } from 'electron';

/** 单只桌宠时的窗口宽高 */
export const SINGLE_PET_WIDTH = 196;
export const SINGLE_PET_HEIGHT = 220;

/** Group 模式下按宠物数量计算窗口尺寸，单行排列，保证所有桌宠可见 */
export function getPetWindowSize(petCount: number): { width: number; height: number } {
  if (petCount <= 1) {
    return { width: SINGLE_PET_WIDTH, height: SINGLE_PET_HEIGHT };
  }
  const gap = 22;
  const w = SINGLE_PET_WIDTH * petCount + gap * (petCount - 1);
  return { width: Math.min(w, 1100), height: SINGLE_PET_HEIGHT };
}

function resolvePreloadPath() {
  try {
    return fileURLToPath(new URL('./preload.cjs', import.meta.url));
  } catch {
    // Fallback for asar packaging
    try {
      const { app } = require('electron') as typeof import('electron');
      return join(app.getAppPath(), '.electron-build', 'preload.cjs');
    } catch {
      return './preload.cjs';
    }
  }
}

export function buildPetWidgetWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: SINGLE_PET_WIDTH,
    height: SINGLE_PET_HEIGHT,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
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
