import { describe, expect, it } from 'vitest';
import { buildPetWindowOptions } from '../window-options';

describe('buildPetWindowOptions', () => {
  it('creates a transparent always-on-top window', () => {
    const options = buildPetWindowOptions();

    expect(options.transparent).toBe(true);
    expect(options.frame).toBe(false);
    expect(options.alwaysOnTop).toBe(true);
  });
});
