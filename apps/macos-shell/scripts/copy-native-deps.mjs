/**
 * Copy ssh2 and its transitive dependencies into .electron-build/node_modules/
 * so that the packaged Electron app can resolve them at runtime.
 *
 * pnpm uses a content-addressable store with symlinks, which electron-builder
 * cannot follow.  This script dereferences the symlinks and produces a flat
 * node_modules tree that Node's require() algorithm can resolve.
 */

import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const DEST = join(dirname(new URL(import.meta.url).pathname), '..', '.electron-build', 'node_modules');

/** Packages that must be available at runtime (ssh2 + transitive deps). */
const PACKAGES = ['ssh2', 'asn1', 'bcrypt-pbkdf', 'safer-buffer', 'tweetnacl'];

mkdirSync(DEST, { recursive: true });

for (const pkg of PACKAGES) {
  try {
    const pkgJson = require.resolve(`${pkg}/package.json`);
    const src = dirname(pkgJson);
    const dest = join(DEST, pkg);

    if (existsSync(dest)) continue;

    cpSync(src, dest, { recursive: true, dereference: true });
    console.log(`  ✓ ${pkg}`);
  } catch {
    console.warn(`  ⚠ ${pkg} not found (optional)`);
  }
}

console.log('Done: native deps copied to .electron-build/node_modules/');
