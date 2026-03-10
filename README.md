# OpenClaw Habitat

macOS-first desktop habitat for OpenClaw agents. The current workspace contains a Vite/React renderer, Electron shell scaffolding, shared domain contracts, and a WebSocket bridge adapter for local or remote gateways.

## Local development

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`

## OpenClaw prerequisites

- A reachable OpenClaw Gateway speaking the current Gateway WebSocket protocol: [Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)
- For remote hosts, an SSH tunnel to the gateway port as described in [Remote Access](https://docs.openclaw.ai/gateway/remote)
- A valid gateway token when using tailnet/direct WebSocket access

## Supported transports in v1

- `local`
- `ssh`
- `tailnet`

## Current non-goals

- Public cloud relay
- Windows support
- Shipping iOS client
