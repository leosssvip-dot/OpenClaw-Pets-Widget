/**
 * Device identity persistence and Ed25519 signing for the Electron main process.
 *
 * Matches the upstream OpenClaw device-identity and device-auth conventions:
 * - deviceId = SHA-256 hex digest of the raw 32-byte Ed25519 public key
 * - publicKey = base64url-encoded raw 32-byte Ed25519 public key
 * - signature = base64url-encoded Ed25519 signature
 * - signed payload = pipe-delimited "v2|deviceId|clientId|clientMode|role|scopes|signedAtMs|token|nonce"
 */

import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  generateKeyPairSync,
  sign,
  createHash,
  createPublicKey
} from 'node:crypto';
import type { DeviceIdentityFields, DeviceSignContext } from '@openclaw-habitat/bridge';

/* ── Ed25519 SPKI DER prefix (12 bytes) ── */
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/* ── base64url helpers (match upstream) ── */
function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

/* ── Persisted identity shape ── */
interface PersistedIdentity {
  version: 1;
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  /** base64url-encoded raw 32-byte public key (cached for fast access) */
  publicKeyBase64Url: string;
  createdAtMs: number;
}

let identity: PersistedIdentity | null = null;

function identityFilePath(userDataDir: string): string {
  return join(userDataDir, 'device-identity.json');
}

/** Extract raw 32-byte Ed25519 public key from PEM. */
function derivePublicKeyRaw(publicKeyPem: string): Buffer {
  const key = createPublicKey(publicKeyPem);
  const spki = key.export({ type: 'spki', format: 'der' }) as Buffer;
  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }
  return spki;
}

/** deviceId = SHA-256 hex of the raw public key bytes (matches upstream). */
function fingerprintPublicKey(publicKeyPem: string): string {
  const raw = derivePublicKeyRaw(publicKeyPem);
  return createHash('sha256').update(raw).digest('hex');
}

function generateNewIdentity(): PersistedIdentity {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const raw = derivePublicKeyRaw(publicKeyPem);

  return {
    version: 1,
    deviceId: fingerprintPublicKey(publicKeyPem),
    publicKeyPem,
    privateKeyPem,
    publicKeyBase64Url: base64UrlEncode(raw),
    createdAtMs: Date.now()
  };
}

/**
 * Load or create the device identity. Call once during app startup.
 */
export function loadDeviceIdentity(userDataDir: string): void {
  const filePath = identityFilePath(userDataDir);

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedIdentity;

    if (
      parsed?.version === 1 &&
      parsed.deviceId &&
      parsed.publicKeyPem &&
      parsed.privateKeyPem
    ) {
      // Re-derive deviceId from public key to ensure consistency (matches upstream).
      const derivedId = fingerprintPublicKey(parsed.publicKeyPem);
      const rawPub = derivePublicKeyRaw(parsed.publicKeyPem);

      identity = {
        ...parsed,
        deviceId: derivedId,
        publicKeyBase64Url: base64UrlEncode(rawPub)
      };

      console.log('[device-identity] loaded existing identity:', derivedId);
      return;
    }
  } catch {
    // File doesn't exist or is corrupt — generate a new one.
  }

  identity = generateNewIdentity();
  console.log('[device-identity] generated new identity:', identity.deviceId);

  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(identity, null, 2) + '\n', { mode: 0o600 });
    try { chmodSync(filePath, 0o600); } catch { /* best-effort */ }
  } catch (err) {
    console.error('[device-identity] failed to persist identity:', err);
  }
}

/**
 * Build the v2 device-auth payload and sign it.
 *
 * Payload format (upstream `buildDeviceAuthPayload`):
 *   "v2|{deviceId}|{clientId}|{clientMode}|{role}|{scopes}|{signedAtMs}|{token}|{nonce}"
 */
export function signChallenge(ctx: DeviceSignContext): DeviceIdentityFields {
  if (!identity) {
    throw new Error('Device identity not loaded — call loadDeviceIdentity() first');
  }

  const signedAt = Date.now();
  const nonce = ctx.nonce ?? '';
  const scopes = ctx.scopes.join(',');
  const token = ctx.token ?? '';

  const payload = [
    'v2',
    identity.deviceId,
    ctx.clientId,
    ctx.clientMode,
    ctx.role,
    scopes,
    String(signedAt),
    token,
    nonce
  ].join('|');

  const signature = sign(null, Buffer.from(payload, 'utf-8'), identity.privateKeyPem);

  return {
    id: identity.deviceId,
    publicKey: identity.publicKeyBase64Url,
    signature: base64UrlEncode(signature),
    signedAt,
    nonce
  };
}
