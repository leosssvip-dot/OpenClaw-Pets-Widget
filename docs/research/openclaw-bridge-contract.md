# OpenClaw Bridge Contract Research

As of 2026-03-10, the current upstream operator/client transport is the Gateway WebSocket, not the legacy TCP bridge.

## Sources reviewed

- [Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)
- [Gateway Runbook](https://docs.openclaw.ai/gateway)
- [Remote Access](https://docs.openclaw.ai/gateway/remote)
- [WebChat (macOS)](https://docs.openclaw.ai/platforms/mac/webchat)
- [Bridge Protocol (legacy)](https://docs.openclaw.ai/gateway/bridge-protocol)

## Confirmed upstream details

- The control plane is a WebSocket JSON protocol. The first frame must be a `connect` request, after an optional server `connect.challenge`.
- Successful handshake returns `payload.type = "hello-ok"` with protocol metadata. Current docs show protocol version `3`.
- Auth is enforced during the WebSocket handshake via `connect.params.auth`, using a token or password. Official token sources include `gateway.auth.token` and `OPENCLAW_GATEWAY_TOKEN`.
- Remote macOS usage is SSH-first. The documented fallback is `ssh -N -L 18789:127.0.0.1:18789 user@host`, then connect clients to `ws://127.0.0.1:18789`.
- The macOS WebChat data plane uses Gateway WS methods `chat.history`, `chat.send`, `chat.abort`, and `chat.inject`, and receives `chat`, `agent`, `presence`, `tick`, and `health` events.
- Current builds no longer ship the legacy TCP bridge listener. The bridge-protocol page is historical reference only.

## Contract decisions for this repo

- Keep the public bridge client interface transport-agnostic: local loopback, SSH-tunneled remote, and tailnet/direct WS can all implement the same `BridgeClient`.
- Model profile selection as data (`local`, `ssh`, `tailnet`) so the macOS shell can switch transports without changing UI state shape.
- Normalize upstream events into stable habitat events before they touch renderer state.

## Important gap and inference

- Official docs currently document the coarse `event: "agent"` stream and a two-phase `agent` response flow, but they do not publish a literal `agent.task.completed` event name in the pages above.
- Because the plan for this repo needs deterministic task-completion normalization now, `parseOpenClawEvent()` treats `agent.task.completed` as an adapter-local input shape and maps it to the stable internal `agent.completed` event.
- This is an inference from the current docs plus the repo plan, not a confirmed upstream event taxonomy. When wiring the real transport, capture real Gateway payload samples first and update only the adapter layer if upstream names differ.
