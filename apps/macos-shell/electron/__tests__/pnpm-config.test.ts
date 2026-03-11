import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('workspace pnpm config', () => {
  it('allows required build scripts for desktop runtime dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), '../../package.json'), 'utf8')
    ) as {
      pnpm?: {
        onlyBuiltDependencies?: string[];
      };
    };

    expect(packageJson.pnpm?.onlyBuiltDependencies).toEqual(
      expect.arrayContaining(['electron', 'esbuild'])
    );
  });
});
