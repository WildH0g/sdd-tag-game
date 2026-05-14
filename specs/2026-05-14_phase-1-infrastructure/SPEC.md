# Feature Name: Phase 1 - Infrastructure & Network Setup

## Introduction

Phase 1 of the DOM-Arena project focuses entirely on establishing a bulletproof multiplayer foundation. Before we can build smooth movement or complex game mechanics, we must guarantee that the server can reliably synchronize data across multiple players without lag or memory failures. To achieve this, we are deploying a real-time WebSocket server optimized for high-frequency updates (20 times per second), acting as the absolute authority over player positions. This phase is about laying the pipes and ensuring the data flows securely and accurately.

The immediate goal is not a playable game, but a diagnostic prototype. We are implementing strict server-side boundary enforcement so players cannot cheat, and an aggressive connection-pruning mechanism to instantly remove players who drop out. The visual experience during this phase will intentionally appear jumpy; this is a diagnostic tool allowing engineering to observe the raw network data in real-time. Once this reliable data pipeline is proven under load, we will possess the stable foundation necessary to build the smooth, interpolated visuals planned for Phase 2.

## Designs & Rendering Interpolation

For Phase 1, the frontend exists purely as a diagnostic surface to validate the infrastructure. It is not the final playable state, but its DOM structure must support the Phase 2 requirements perfectly.

### 1. The Arena Container

- **Dimensions**: A strictly enforced 800px width by 600px height.
- **Styling (Tailwind)**: `relative w-[800px] h-[600px] bg-slate-900 border-4 border-slate-700 overflow-hidden mx-auto mt-10`.
- **Constraint**: The arena must be visually distinct and rigidly sized to prove the server-side boundary clamping is functioning.

### 2. The Entity Proxies (Players)

- **Structure**: Rendered as simple `<div>` elements appended to the Arena container.
- **Styling (Tailwind)**: `absolute w-5 h-5 bg-blue-500 rounded-sm`.
- **Positioning**: Positions are applied via inline `style="transform: translate(Xpx, Ypx)"`. We use `transform` over `top/left` properties because `transform` leverages hardware acceleration (GPU compositing), avoiding expensive layout recalcs during rapid updates.

### 3. Diagnostic Overlay

- Since Phase 1 lacks Phase 2's Snapshot Interpolation, the entities will "snap" abruptly every 50ms (the 20Hz heartbeat).
- We require a diagnostic HUD in the top corner (outside the arena) displaying:
  - `Latency (ms)`: Derived from the Ping/Pong round trip.
  - `Server Tick`: The latest Sequence ID received.
  - `Local Pos (X,Y)` vs `Server Pos (X,Y)`: To verify clamping accuracy.

### 4. The Jitter Expectation

- **Crucial Note**: The UX in Phase 1 will deliberately look "bad" (choppy). The entities will teleport. This is expected and necessary. We are establishing the raw data pipeline. We must not attempt to hide this jitter with CSS transitions (`transition-all`) in this phase, as doing so will mask network issues that need to be visible before Phase 2 interpolation is built.

## Gherkin Game Scenarios

```gherkin
Feature: Phase 1 - Core Network & Infrastructure

Background:
  Given the server tick rate (FIXED_TIMESTEP) is exactly 50ms
  And the arena boundaries are defined as Width: 800, Height: 600
  And the Server Time is tracked via high-resolution `performance.now()`

# -- CONNECTION & PRUNING --

Scenario: New client connection and handshake
  When a client connects to the WebSocket endpoint with display name "Player1"
  Then the server assigns a unique UUID
  And the server replies with a "Handshake" payload containing the client UUID and current Server Time

Scenario Outline: Ping/Pong Pruning for Zombie Connections
  Given a connected client with id <client_id>
  When the server's periodic Ping interval elapses
  And the client responds with Pong within <response_time> ms
  Then the connection state is evaluated as <expected_state>

  Examples:
    | client_id | response_time | expected_state |
    | "uuid_1"  | 10            | ALIVE          |
    | "uuid_2"  | 35000         | TERMINATED     |

# -- SPATIAL AUTHORITY (SSOT) --

Scenario Outline: Server-Side Boundary Clamping
  Given an active client sends a position update
  When the raw payload attempts to move the player to <target_x>, <target_y>
  Then the server sanitizes the coordinates to <clamped_x>, <clamped_y> before state commit

  Examples:
    | target_x | target_y | clamped_x | clamped_y | Notes                        |
    | 400      | 300      | 400       | 300       | Valid center move            |
    | -10      | 50       | 0         | 50        | OOB Left edge                |
    | 810      | 610      | 800       | 600       | OOB Bottom Right corner      |

# -- THE HEARTBEAT --

Scenario Outline: 20Hz State Broadcast (The Game Loop)
  Given <active_clients> clients are connected and have validated positions
  When the 50ms server heartbeat interval triggers
  Then the server broadcasts a flat JSON payload
  And the payload contains exactly <expected_records> player records
  And the payload includes a monotonic Sequence ID
  And the payload includes the current Server Time timestamp

  Examples:
    | active_clients | expected_records |
    | 1              | 1                |
    | 10             | 10               |
    | 0              | 0                |
```

## Architecture & Infrastructure

### Cloud Architecture (Cloud Run / WebSockets)

The Phase 1 infrastructure targets Google Cloud Run. The Node.js application will bind to the `$PORT` environment variable required by Cloud Run. Cloud Run CPU will be set to "Always Allocated" to support continuous WebSocket connections.

### Software Architecture (Node.js / Game Loop)

To enforce determinism and testability, the Phase 1 server will adhere to a strict modular separation. We will build three distinct systems: **Network**, **State**, and the **Loop**.

#### Core Engine (Physics & Determinism)

- **`GameLoop` (The Ticker)**: An isolated `setInterval` wrapper running exactly every 50ms (20Hz). It reads from `StateManager` and triggers `NetworkManager.broadcast()`. It tracks monotonic sequence numbers and server time (`performance.now()`).

#### Network Protocol (Schemas & Backpressure)

- **`NetworkManager` (The Boundary)**: Strictly responsible for WebSocket lifecycle (`connection`, `message`, `close`), Ping/Pong execution, and JSON parse/stringify. It contains zero game logic. It injects sanitized data into the State Manager.

To satisfy the GC strategy and ensure fast serialization, all payloads must be flat arrays mapping to specific indices.

**Client -> Server (Position Delta)**
_Schema_: `[Message_Type, X, Y]`
_Example_: `[1, 450, 200]` (Type 1 = Update Position)

**Server -> Client (Tick Broadcast)**
_Schema_: `[Sequence_ID, Server_Time, [[Client_ID, X, Y], ...]]`
_Example_: `[105, 12045.33, [["uuid_1", 450, 200], ["uuid_2", 100, 100]]]`
_Rationale_: Grouping players into a single nested array prevents mapping overhead and keeps the payload structure strictly predictable.

**Server -> Client (Handshake)**
_Schema_: `[Message_Type, Client_ID, Server_Time]`
_Example_: `[0, "uuid_1", 12044.10]` (Type 0 = Handshake)

#### State Manager (SSOT)

- **`StateManager` (The SSOT)**: A pure, synchronous data structure. It manages player additions, removals, and boundary clamping. It holds the authoritative position data. The server is the absolute authority; all incoming coordinates are validated against the 800x600 boundaries before being accepted.

### Hard-Liner TDD (Vitest Fake Timers)

The modular separation ensures high testability. We will use Vitest's `vi.useFakeTimers()` to step through the 50ms heartbeat interval and the Ping/Pong eviction intervals deterministically. The Network, State, and Loop modules will use dependency injection to allow mocking of side effects (like WebSocket `send` calls) during tests.

### Performance Constraints (GC & Memory)

- **Zero Object Instantiation in the Loop**: The `StateManager` must maintain pre-allocated structures where possible. We will NOT map over object properties during the broadcast phase. Instead, we will maintain a pre-formatted serialization array that is only updated when a client actually moves.
- **Backpressure Handling**: We must monitor `ws.bufferedAmount`. If a client's buffer exceeds a predefined threshold (e.g., 10KB, indicating severe lag or a stalled connection), the `NetworkManager` must force-terminate the socket to protect server memory before the Ping interval catches it.
