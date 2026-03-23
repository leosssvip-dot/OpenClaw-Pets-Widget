/**
 * Device identity types and provider interface.
 *
 * The Gateway requires Ed25519 device identity for control-ui clients
 * in non-secure contexts (non-localhost, non-HTTPS). Providing device
 * identity unconditionally avoids the "control ui requires device identity"
 * handshake rejection.
 */

/** Fields sent in the `device` object of the connect request. */
export interface DeviceIdentityFields {
  id: string;
  publicKey: string;
  signature: string;
  signedAt: number;
  nonce: string;
}

/** Context needed to build the signed payload (matches upstream device-auth v2 format). */
export interface DeviceSignContext {
  nonce?: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  token?: string;
}

/**
 * A provider that can sign a gateway challenge using the device's Ed25519 key.
 *
 * Implementations live outside the bridge package (e.g. Electron main process)
 * so that crypto and storage concerns stay platform-specific.
 */
export interface DeviceIdentityProvider {
  /**
   * Sign a gateway challenge and return the full device identity fields.
   * The context includes all connect params that form the signed payload.
   */
  sign(ctx: DeviceSignContext): Promise<DeviceIdentityFields>;
}
