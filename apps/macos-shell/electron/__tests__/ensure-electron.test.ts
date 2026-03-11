import { describe, expect, it, vi } from 'vitest';
import { ensureElectronBinary } from '../ensure-electron';

describe('ensureElectronBinary', () => {
  it('runs the electron installer when the binary is missing', async () => {
    const runInstaller = vi.fn(async () => undefined);
    const loadElectronBinary = vi.fn(() => '/tmp/Electron');

    const binary = await ensureElectronBinary({
      resolvePackageRoot: () => '/tmp/electron',
      isInstalled: async () => false,
      runInstaller,
      loadElectronBinary
    });

    expect(runInstaller).toHaveBeenCalledWith('/tmp/electron');
    expect(binary).toBe('/tmp/Electron');
  });
});
