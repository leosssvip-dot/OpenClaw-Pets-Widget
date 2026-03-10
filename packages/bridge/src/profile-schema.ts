import { z } from 'zod';

export const gatewayProfileSchema = z.discriminatedUnion('transport', [
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('local')
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    transport: z.literal('ssh'),
    host: z.string(),
    username: z.string(),
    port: z.number().default(22)
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
