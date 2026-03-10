import { describe, expect, it } from 'vitest';
import { gatewayProfileSchema } from '../profile-schema';

describe('gatewayProfileSchema', () => {
  it('accepts an ssh profile', () => {
    expect(
      gatewayProfileSchema.parse({
        id: 'devbox',
        label: 'My Remote OpenClaw',
        transport: 'ssh',
        host: 'example.internal',
        username: 'me'
      }).transport
    ).toBe('ssh');
  });
});
