import { join, dirname } from 'node:path';
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

/**
 * Resolve the preload script path.
 *
 * The main process is bundled into CJS by esbuild, so `import.meta.url` is
 * unavailable. We use `__dirname` (CJS global pointing to the output
 * directory of main.cjs) which always works in both dev and packaged builds.
 * Preload.cjs sits in the same directory as main.cjs.
 */
function resolvePreloadPath() {
  // __dirname = directory of the bundled main.cjs (e.g. .electron-build/)
  // preload.cjs is a sibling file in the same directory.
  return join(__dirname, 'preload.cjs');
}

export function buildPetWidgetWindowOptions(
  platform: NodeJS.Platform = process.platform
): BrowserWindowConstructorOptions {
  return {
    width: SINGLE_PET_WIDTH,
    height: SINGLE_PET_HEIGHT,
    transparent: true,
    ...(platform === 'win32' ? { backgroundColor: '#00000000' } : {}),
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
