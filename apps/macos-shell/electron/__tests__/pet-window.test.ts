import { describe, expect, it } from 'vitest';
import { buildPetWidgetWindowOptions } from '../pet-window';

describe('buildPetWidgetWindowOptions', () => {
  it('creates a compact always-on-top pet widget window', () => {
    const options = buildPetWidgetWindowOptions();

    expect(options.width).toBe(196);
    expect(options.height).toBe(220);
    expect(options.webPreferences?.preload).toContain('preload.cjs');
    expect(options.transparent).toBe(true);
    expect(options.alwaysOnTop).toBe(true);
    expect(options.resizable).toBe(false);
  });

  it('applies Windows-safe transparent window settings for the pet overlay', () => {
    const options = buildPetWidgetWindowOptions('win32');

    expect(options.transparent).toBe(true);
    expect(options.backgroundColor).toBe('#00000000');
  });
});
