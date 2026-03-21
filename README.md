# OpenClaw Pets Widget

[English](./README.md) | [简体中文](./README.zh-CN.md)

OpenClaw Pets Widget is a desktop companion for OpenClaw agents. It runs as a small floating pet, opens into a control panel, and connects to an OpenClaw Gateway either on the same machine or through SSH to a remote machine.

The desktop pet uses Rive animations, supports multiple agent personas, and keeps the panel and pet window in sync through Electron IPC.

## Highlights

- Floating desktop pet with a separate chat and settings panel
- Built-in Rive-based pet animations
- Per-agent character selection from built-in pets
- Local gateway mode and remote gateway mode over SSH
- Electron desktop app with macOS and Windows packaging targets

## Platform Support

- macOS
- Windows

Linux is not packaged or documented yet.

### Installing Unsigned Builds

The app is not code-signed yet. Your OS will show a security warning when you first open it.

**macOS**

1. Open the `.dmg` and drag the app to Applications
2. When macOS blocks the app ("Apple cannot check it for malicious software"), go to **System Settings → Privacy & Security**
3. Scroll down to find the blocked app message, click **Open Anyway**
4. Or: right-click the app → **Open** → click **Open** in the dialog

**Windows**

1. Run the `.exe` installer
2. Windows SmartScreen may show "Windows protected your PC"
3. Click **More info** → **Run anyway**

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

If your Gateway is running on a home network and you are away from home, a direct SSH connection usually will not work unless that machine is reachable from outside your local network. In that case, first use a secure remote network solution such as Tailscale so the home machine becomes reachable over SSH, then connect the app to the machine by its Tailscale IP or hostname.

In the app:

1. Start the desktop app with `pnpm dev:desktop`
2. Open the panel from the pet
3. Go to `Settings`
4. Add a local or SSH gateway profile
5. Connect and wait for the agent list to appear

### Gateway Auth Notes

Because of a known bug in `openclaw 2026.3.13`, you may need to allow insecure auth for the Control UI before the desktop app can connect correctly.

A common failure looks like this:

```text
Gateway handshake rejected: control ui requires device identity (use HTTPS or localhost secure context)
```

Update the Gateway config:

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true
    }
  }
}
```

Or use the CLI:

```bash
# Set the config value
openclaw config set gateway.controlUi.allowInsecureAuth true --json

# Verify the current value
openclaw config get gateway.controlUi.allowInsecureAuth

# Restart the gateway
openclaw gateway restart
```

If you need the Gateway token, check one of these locations:

1. `~/.openclaw/openclaw.json`
   Look for `gateway.auth.token`. OpenClaw Gateway auth uses `gateway.auth.token` or the `OPENCLAW_GATEWAY_TOKEN` environment variable.
2. `~/.openclaw/.env`
   Look for `OPENCLAW_GATEWAY_TOKEN`, for example:

```bash
cat ~/.openclaw/.env | grep OPENCLAW_GATEWAY_TOKEN
```

## Development

The active desktop app lives in [`apps/macos-shell`](./apps/macos-shell).

Useful commands from that directory:

```bash
pnpm dev:desktop
pnpm start:desktop
pnpm dist:mac
pnpm dist:win
```

## Project Structure

```text
apps/macos-shell/     Electron shell, renderer, pet UI, packaging
packages/bridge/      Bridge client and OpenClaw gateway integration
packages/domain/      Shared domain types and logic
```

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
