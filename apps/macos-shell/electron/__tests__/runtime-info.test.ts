import { describe, expect, it } from 'vitest';
import { resolveRuntimeSurface } from '../runtime-info';

describe('resolveRuntimeSurface', () => {
  it('returns the pet surface for the pet window sender', () => {
    expect(
      resolveRuntimeSurface(11, {
        petWindowId: 11,
        panelWindowId: 22
      })
    ).toBe('pet');
  });

  it('returns the panel surface for the panel window sender', () => {
    expect(
      resolveRuntimeSurface(22, {
        petWindowId: 11,
        panelWindowId: 22
      })
    ).toBe('panel');
  });
});
