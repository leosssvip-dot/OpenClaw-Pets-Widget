# OpenClaw Habitat

macOS-first desktop widget for OpenClaw agents. The app runs as a floating desktop pet, expands into a side control panel, and connects to an always-on OpenClaw Gateway on another machine over SSH.

## Local development

- `pnpm install`
- `pnpm dev:desktop`
- `pnpm lint`
- `pnpm test`
- `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`

Detailed testing steps: [docs/testing-guide.md](./docs/testing-guide.md)

## Remote OpenClaw prerequisites

- The remote machine must already be running an OpenClaw Gateway.
- Your local machine must be able to SSH into that host with your normal system SSH setup.
- The widget will open the SSH tunnel itself. You do not need to run `ssh -L ...` manually.
- You still need a valid Gateway token for the remote Gateway handshake.

## Connect from the widget

1. Run `pnpm dev:desktop`.
2. Click the desktop pet to open the panel.
3. Click `Connect Remote`.
4. Fill in:
   - `Remote Host`
   - `SSH User`
   - `SSH Port`
   - `Identity File` (optional; leave blank to reuse `~/.ssh/config` or `ssh-agent`)
   - `Gateway Port`
   - `Gateway Token`
5. Click `Connect`.

If SSH works and the remote Gateway is healthy, the panel status changes to `Connected` and the pet list appears.

## Current non-goals

- Public cloud relay
- Windows support
- Remote process management for OpenClaw itself
