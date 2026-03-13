import type { BrowserWindowConstructorOptions } from 'electron';
import { buildPetWidgetWindowOptions } from './pet-window';

export function buildPanelWindowOptions(): BrowserWindowConstructorOptions {
  const petOptions = buildPetWidgetWindowOptions();

  return {
    ...petOptions,
    width: 360,
    height: 520,
    minWidth: 320,
    minHeight: 400,
    resizable: true,
    show: false,
    transparent: false,
    hasShadow: true,
    backgroundColor: '#f3f8ff'
  };
}

export async function createPanelWindow() {
  const { BrowserWindow } = await import('electron');
  return new BrowserWindow(buildPanelWindowOptions());
}
