import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

async function isElectronInstalled(packageRoot: string) {
  try {
    await access(join(packageRoot, 'dist'));
    await access(join(packageRoot, 'path.txt'));
    return true;
  } catch {
    return false;
  }
}

async function runElectronInstaller(packageRoot: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [join(packageRoot, 'install.js')], {
      cwd: packageRoot,
      stdio: 'inherit'
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Electron install script failed with exit code ${code ?? 'unknown'}`));
    });
    child.once('error', reject);
  });
}

export async function ensureElectronBinary(options?: {
  resolvePackageRoot?: () => string;
  isInstalled?: (packageRoot: string) => Promise<boolean>;
  runInstaller?: (packageRoot: string) => Promise<void>;
  loadElectronBinary?: () => string;
}) {
  const require = createRequire(import.meta.url);
  const resolvePackageRoot =
    options?.resolvePackageRoot ??
    (() => dirname(require.resolve('electron/package.json')));
  const packageRoot = resolvePackageRoot();
  const installed = await (options?.isInstalled ?? isElectronInstalled)(packageRoot);

  if (!installed) {
    await (options?.runInstaller ?? runElectronInstaller)(packageRoot);
  }

  return (options?.loadElectronBinary ?? (() => require('electron') as string))();
}
