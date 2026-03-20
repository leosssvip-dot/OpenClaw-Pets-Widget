# OpenClaw Habitat

OpenClaw Habitat is a desktop companion for OpenClaw agents. It runs as a small floating pet, opens into a control panel, and connects to an OpenClaw Gateway either on the same machine or through SSH to a remote machine.

The desktop pet uses Rive animations, supports multiple agent personas, and keeps the panel and pet window in sync through Electron IPC.

## Highlights

- Floating desktop pet with a separate chat and settings panel
- Built-in Rive-based pet animations
- Per-agent character selection and custom avatar art
- Local gateway mode and remote gateway mode over SSH
- Electron desktop app with macOS and Windows packaging targets

## Platform Support

- macOS
- Windows

Linux is not packaged or documented yet.

## Requirements

- Node.js 20+
- pnpm 10+
- A reachable OpenClaw Gateway

For remote connections you also need:

- SSH access to the target machine
- A valid Gateway token

## Quick Start

From the repository root:

```bash
pnpm install
pnpm dev:desktop
```

Common workspace commands:

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## Connect a Gateway

The app supports two connection modes:

1. Local gateway
   Use this when the OpenClaw Gateway is running on the same machine.
2. Remote gateway over SSH
   Use this when the Gateway is running on another machine and the desktop app should open the tunnel for you.

Remote setup checklist:

- The remote machine already runs an OpenClaw Gateway
- Your machine can SSH into that host with your normal SSH configuration
- You have the Gateway token for that Gateway instance

In the app:

1. Start the desktop app with `pnpm dev:desktop`
2. Open the panel from the pet
3. Go to `Settings`
4. Add a local or SSH gateway profile
5. Connect and wait for the agent list to appear

## Development

The active desktop app lives in [`apps/macos-shell`](./apps/macos-shell).

Useful commands from that directory:

```bash
pnpm dev:desktop
pnpm start:desktop
pnpm pack
pnpm dist:mac
pnpm dist:win
```

Additional docs:

- [Testing guide](./docs/testing-guide.md)
- [Pet animation import guide](./docs/pet-animation-import-guide.md)

## Project Structure

```text
apps/macos-shell/     Electron shell, renderer, pet UI, packaging
packages/bridge/      Bridge client and OpenClaw gateway integration
packages/domain/      Shared domain types and logic
docs/                 Testing notes, design docs, animation import notes
```

## Custom Pet Assets

- Built-in pets use `.riv` files from [`apps/macos-shell/public/assets/pets`](./apps/macos-shell/public/assets/pets)
- Custom static art can be provided through the panel with:
  - `https://...`
  - `file:///absolute/path/to/file.png`
  - `data:image/...`

Supported custom image formats:

- PNG
- JPG / JPEG
- WEBP
- GIF
- SVG

## Testing

From the repository root:

```bash
pnpm test
```

Focused app checks:

```bash
pnpm --filter @openclaw-habitat/macos-shell test
pnpm --filter @openclaw-habitat/macos-shell lint
pnpm --filter @openclaw-habitat/macos-shell build
```

## Status

This project is still evolving. The core desktop flow is functional, but the UI, packaging, and animation workflow are still being refined.
