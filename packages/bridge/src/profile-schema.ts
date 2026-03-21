import { z } from 'zod';

export const gatewayProfileSchema = z.discriminatedUnion('transport', [
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('local'),
    gatewayPort: z.number().int().positive().default(18789),
    gatewayToken: z.string().optional()
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('ssh'),
    host: z.string(),
    username: z.string(),
    sshPort: z.number().int().positive().default(22),
    password: z.string().optional(),
    identityFile: z.string().min(1).optional(),
    remoteGatewayPort: z.number().int().positive().default(18789),
    gatewayToken: z.string().min(1)
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('tailnet'),
    baseUrl: z.string().url(),
    token: z.string().min(1)
  })
]);

export type GatewayProfile = z.infer<typeof gatewayProfileSchema>;
