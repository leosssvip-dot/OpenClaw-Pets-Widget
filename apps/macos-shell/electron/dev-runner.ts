import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { context } from 'esbuild';
import { ensureElectronBinary } from './ensure-electron';

const electronBinary = await ensureElectronBinary();
const currentDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(currentDir, '..');
const outputFile = resolve(appDir, '.electron-build/main.js');
const preloadFile = resolve(appDir, '.electron-build/preload.cjs');

function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitForFile(filePath: string) {
  for (;;) {
    try {
      await access(filePath);
      return;
    } catch {
      await delay(100);
    }
  }
}

async function waitForRenderer() {
  for (;;) {
    try {
      const response = await fetch('http://127.0.0.1:5173');

      if (response.ok) {
        return;
      }
    } catch {
      await delay(200);
      continue;
    }

    await delay(200);
  }
}

const vite = spawn('pnpm', ['run', 'dev:renderer'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

const buildContext = await context({
  entryPoints: [resolve(appDir, 'electron/main.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: outputFile,
  external: ['electron'],
  sourcemap: true
});

const preloadContext = await context({
  entryPoints: [resolve(appDir, 'electron/preload.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: preloadFile,
  external: ['electron'],
  sourcemap: true
});

await buildContext.watch();
await preloadContext.watch();
await waitForFile(outputFile);
await waitForFile(preloadFile);
await waitForRenderer();

const electron = spawn(electronBinary, [outputFile], {
  cwd: appDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173'
  }
});

const shutdown = async () => {
  electron.kill('SIGTERM');
  vite.kill('SIGTERM');
  await preloadContext.dispose();
  await buildContext.dispose();
};

process.on('SIGINT', () => {
  void shutdown().finally(() => process.exit(130));
});

process.on('SIGTERM', () => {
  void shutdown().finally(() => process.exit(143));
});

electron.on('exit', (code) => {
  vite.kill('SIGTERM');
  void Promise.all([preloadContext.dispose(), buildContext.dispose()]).finally(() =>
    process.exit(code ?? 0)
  );
});
