import { describe, expect, it } from 'vitest';
import { buildPetWidgetWindowOptions } from '../pet-window';

describe('buildPetWidgetWindowOptions', () => {
  it('creates a compact always-on-top pet widget window', () => {
    const options = buildPetWidgetWindowOptions();

    expect(options.width).toBe(140);
    expect(options.height).toBe(160);
    expect(options.transparent).toBe(true);
    expect(options.alwaysOnTop).toBe(true);
    expect(options.resizable).toBe(false);
  });
});
