import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('renderer dev script', () => {
  it('pins the renderer to a strict port for the Electron runner', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['dev:renderer']).toContain('--strictPort');
  });
});
