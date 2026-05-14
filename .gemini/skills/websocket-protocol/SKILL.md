---
name: websocket-protocol
description: Principal Network Architect. Triggered for designing or reviewing WebSocket message schemas, heartbeats, and client-server synchronization (interpolation, client-side prediction, and server reconciliation).
---

# GOAL

Ensure robust, low-latency, and safe real-time communication between the Node.js server and vanilla JS clients, masking network jitter and enforcing strict data validation.

# OBJECTIVES & ARCHITECTURE PATTERNS

### 1. Connection Pruning (Ping/Pong)

- **Problem**: "Zombie" connections (e.g., pulling the ethernet cord) do not trigger the `close` event natively.
- **Mandate**: The server MUST implement a heartbeat interval (e.g., every 15-30s). It must track `isAlive` on each socket, send a `ping()`, and forcefully `terminate()` (not just `close()`) any socket that has not responded with a `pong` before the next interval.

### 2. State Broadcast & Jitter Masking (Interpolation)

- **Problem**: Network packets experience jitter; they do not arrive exactly every 50ms.
- **Mandate**: The client MUST NEVER immediately render the absolute latest state received. The client must maintain a buffer of historical snapshots.
- **Implementation**: The client renders the game slightly in the past (e.g., `Date.now() - 100ms`) and performs linear interpolation (Lerp) between the two closest buffered snapshots to guarantee smooth visual movement despite network burstiness.

### 3. Client-Side Prediction & Server Reconciliation

- **Problem**: Waiting for the server to acknowledge movement feels sluggish (input lag).
- **Mandate**:
  - **Prediction**: The client immediately applies local physics/movement based on user input while simultaneously sending that input (tagged with an ID/timestamp) to the server.
  - **Reconciliation**: When the authoritative server snapshot arrives, the client snaps to the server's position, discards acknowledged inputs, and _replays_ any pending local inputs that the server hasn't seen yet.

### 4. Payload Optimization & Schema Validation

- **Problem**: Large JSON payloads increase latency. Unvalidated payloads crash the server.
- **Mandate**:
  - **Validation**: EVERY incoming message must be validated against a strict schema (e.g., Zod, Joi) before routing to the game logic.
  - **Optimization**: For the 50ms broadcast, minimize keys. Send arrays of values `[id, x, y]` instead of verbose objects `[{playerId: id, positionX: x, positionY: y}]`. If possible, explore Binary Protocols (Buffers/TypedArrays) to further compress the state.

# METHODOLOGY

- Flag any architecture where the client blindly trusts the server snapshot without buffering/interpolating.
- Reject any WebSocket server implementation that lacks a proactive Ping/Pong cleanup loop.
- Enforce the separation of the "render loop" (`requestAnimationFrame`) from the "network loop" (`socket.on('message')`).

