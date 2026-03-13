# OpenClaw Bridge Contract Research

As of 2026-03-11, the current upstream operator/client transport is the Gateway WebSocket, not the legacy TCP bridge.

## Sources reviewed

- [Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)
- [Gateway Runbook](https://docs.openclaw.ai/gateway)
- [Remote Access](https://docs.openclaw.ai/gateway/remote)
- [WebChat (macOS)](https://docs.openclaw.ai/platforms/mac/webchat)
- [Bridge Protocol (legacy)](https://docs.openclaw.ai/gateway/bridge-protocol)
- [OpenClaw GitHub repo](https://github.com/openclaw/openclaw) — source of truth for frame schema and connect validation

## Gateway WebSocket frame protocol

Three frame types (confirmed from upstream source `src/gateway/protocol/schema/frames.ts`):

- **Request**: `{"type":"req", "id":"<requestId>", "method":"<method>", "params":{...}}`
- **Response**: `{"type":"res", "id":"<requestId>", "ok":true|false, "payload":{...}|"error":{...}}`
- **Event**: `{"type":"event", "event":"<eventName>", "payload":{...}, "seq"?:number}`

All client→server messages must use the `req` envelope. The server responds with a matching `res` (same `id`). Events are server-initiated and asynchronous.

## Connect handshake (confirmed working 2026-03-11)

### Flow

1. Client opens WebSocket to gateway
2. Server sends event: `{"type":"event","event":"connect.challenge","payload":{"nonce":"<uuid>","ts":<epochMs>}}`
3. Client sends request:

   ```json
   {
     "type": "req",
     "id": "connect-1",
     "method": "connect",
     "params": {
       "minProtocol": 3,
       "maxProtocol": 3,
       "client": {
         "id": "gateway-client",
         "version": "1.0.0",
         "platform": "macos",
         "mode": "ui"
       },
       "auth": { "token": "<gateway-auth-token>" }
     }
   }
   ```

4. Server responds: `{"type":"res","id":"connect-1","ok":true,"payload":{"protocolVersion":3,...}}`

### Required fields in connect params (from upstream ConnectParamsSchema)

- `minProtocol` (integer, min 1) — **required**
- `maxProtocol` (integer, min 1) — **required**
- `client` — **required** object:
  - `id`: one of `"webchat-ui"`, `"openclaw-control-ui"`, `"webchat"`, `"cli"`, `"gateway-client"`, `"openclaw-macos"`, `"openclaw-ios"`, `"openclaw-android"`, `"node-host"`, `"test"`, `"fingerprint"`, `"openclaw-probe"`
  - `version`: non-empty string
  - `platform`: non-empty string (e.g. `"macos"`, `"linux"`)
  - `mode`: one of `"webchat"`, `"cli"`, `"ui"`, `"backend"`, `"node"`, `"probe"`, `"test"`
- `auth` — optional: `{ token?: string, deviceToken?: string, password?: string }`
- `device` — **optional overall**, but if present ALL sub-fields required:
  - `id`, `publicKey`, `signature`, `signedAt`, `nonce`
  - Uses Ed25519 signing (see upstream `src/infra/device-identity.ts`)
- `role` — optional, defaults to `"operator"`

### Operator token auth (simple path)

An operator role with a valid shared token can **skip device identity entirely** (confirmed from `src/gateway/role-policy.ts`: `roleCanSkipDeviceIdentity(role, sharedAuthOk)`). This means the `device` field can be omitted when `auth.token` matches the server's `gateway.auth.token`.

## Lessons learned from implementation

### SSH tunnel on macOS

- macOS OpenSSH 10.0p2 does NOT properly honor `SSH_ASKPASS_REQUIRE=force` — the SSH process hangs instead of calling the askpass script.
- **Solution**: Use `/usr/bin/expect` (Tcl) to automate password entry. Spawn `expect -c '<script>'` wrapping the SSH command.
- When using expect for password auth, must add `-o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no` to prevent SSH from trying pubkey first (which hangs).
- When NOT using expect (key-based auth), add `-o BatchMode=yes` to fail fast instead of prompting.
- Add `StrictHostKeyChecking=accept-new` and `ServerAliveInterval=15` to SSH args for better UX.

### Frame format pitfalls

- Server events use `{"type":"event","event":"connect.challenge"}` — the event name is in the `event` field, NOT in `type`. A naive `message.type ?? message.event` returns `"event"` instead of `"connect.challenge"`. Must check `if (type === 'event') return event`.
- The old format `{"type":"connect","params":{...}}` is rejected as "invalid request frame". Must use `{"type":"req","method":"connect",...}`.
- Missing the `client` object causes validation error: "must have required property 'client'".
- Including `device: { nonce }` without full Ed25519 fields causes validation error. Either provide all device fields or omit `device` entirely.

### Debug logging in Electron

- `console.log` in the renderer process is NOT visible in the terminal for Electron apps.
- Use `webContents.on('console-message')` in main process to pipe renderer logs to stdout.

## Contract decisions for this repo

- Keep the public bridge client interface transport-agnostic: local loopback, SSH-tunneled remote, and tailnet/direct WS can all implement the same `BridgeClient`.
- Model profile selection as data (`local`, `ssh`, `tailnet`) so the macOS shell can switch transports without changing UI state shape.
- Normalize upstream events into stable habitat events before they touch renderer state.
- Use `type: "req"` envelope for all client→server messages, match responses by `id`.

## Chat history (2026-03-12)

- Gateway protocol docs do not clearly document a `chat.history` RPC method for fetching session transcripts.
- `sessions_history` is a session tool, not a gateway request method.
- **Decision**: Use local `localStorage` persistence keyed by `profileId:agentId`. Max 100 messages per session. Enables history across app restarts without Gateway API dependency.

## Important gap and inference

- Official docs currently document the coarse `event: "agent"` stream and a two-phase `agent` response flow, but they do not publish a literal `agent.task.completed` event name in the pages above.
- Because the plan for this repo needs deterministic task-completion normalization now, `parseOpenClawEvent()` treats `agent.task.completed` as an adapter-local input shape and maps it to the stable internal `agent.completed` event.
- This is an inference from the current docs plus the repo plan, not a confirmed upstream event taxonomy. When wiring the real transport, capture real Gateway payload samples first and update only the adapter layer if upstream names differ.
