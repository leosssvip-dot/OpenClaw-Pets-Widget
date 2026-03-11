import { app, safeStorage } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const STORE_FILE = 'secure-tokens.json';

function getStorePath() {
  return join(app.getPath('userData'), STORE_FILE);
}

async function readStore(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(getStorePath(), 'utf-8');
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeStore(data: Record<string, string>) {
  const dir = app.getPath('userData');
  await mkdir(dir, { recursive: true });
  await writeFile(getStorePath(), JSON.stringify(data, null, 2), 'utf-8');
}

export async function storeSecret(key: string, value: string): Promise<void> {
  const store = await readStore();

  if (safeStorage.isEncryptionAvailable()) {
    store[key] = safeStorage.encryptString(value).toString('base64');
  } else {
    store[key] = value;
  }

  await writeStore(store);
}

export async function retrieveSecret(key: string): Promise<string | null> {
  const store = await readStore();
  const encoded = store[key];

  if (!encoded) {
    return null;
  }

  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
    } catch {
      return null;
    }
  }

  return encoded;
}

export async function deleteSecret(key: string): Promise<void> {
  const store = await readStore();
  delete store[key];
  await writeStore(store);
}
