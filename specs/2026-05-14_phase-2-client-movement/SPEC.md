# Feature Name: Phase 2 - Client-Side Rendering & Movement

## Introduction

Phase 2 of the DOM-Arena project transforms our stable but "choppy" server prototype into a fluid, arcade-quality experience. In multiplayer games, the internet is too slow to provide instant feedback; if a player presses a button and waits for the server to reply before moving their character, the game feels sluggish and unresponsive. Conversely, if we just let the client do whatever it wants, players can cheat.

To solve this, Phase 2 implements "Client-Side Prediction" and "Snapshot Interpolation." When you press a key, your screen immediately predicts what the server will do, giving you instant, zero-latency feedback. Meanwhile, the movements of all other players on your screen are slightly delayed and mathematically smoothed out, completely hiding the natural stutter of internet traffic. The result is a game that feels as fast as a single-player experience, while maintaining the absolute, cheat-proof authority of our Phase 1 server infrastructure.

## Designs & Rendering Interpolation

For Phase 2, the frontend evolves from a raw diagnostic tool into a fluid, game-ready interface. The "jitter" of Phase 1 will be entirely eliminated.

### 1. The Fluidity Transformation

- **The Goal**: Visual movement must be completely decoupled from the 50ms network pulse. The UI must render at the monitor's native refresh rate (e.g., 60fps or 144fps).
- **The Mechanism**: We are abandoning CSS transitions (`transition-all`) entirely. CSS transitions are reactive and introduce "input lag" feel. Instead, the `ClientEngine` takes absolute control, calculating the exact sub-pixel coordinates for every entity on every single frame using mathematics (Lerp/Prediction).

### 2. Visual Representation of State

To aid in debugging during the build process, the UI will subtly reflect the network state:

- **Local Player (You)**: Rendered in bright blue (`bg-blue-500`). This entity responds instantly to keyboard inputs via Client-Side Prediction.
- **Remote Players**: Rendered in slate (`bg-slate-400`). These entities move smoothly but are technically rendering 100ms in the past (Snapshot Interpolation).
- **The "Ghost" (Optional Debug Toggle)**: During development, we may render a semi-transparent "Ghost" box (`opacity-30 bg-red-500`) that represents the _true, unpredicted_ server position of the local player. This allows developers to visually confirm that the predicted position and the server position match, proving that Replay is working correctly.

### 3. Diagnostic HUD Evolution

The Phase 1 HUD will be expanded to monitor Phase 2 metrics:

- `Buffer Depth`: How many server snapshots are currently queued for interpolation (should ideally hover around 2-3).
- `Pending Inputs`: The size of the local Input Replay queue (should hover around 1-2).
- `Hard Snaps`: A counter that increments only if the Divergence Threshold is breached (should be 0 under normal conditions).

## Gherkin Game Scenarios

```gherkin
Feature: Phase 2 - Client-Side Rendering & Movement

Background:
  Given the server ticks at 20Hz (every 50ms)
  And the client renders via requestAnimationFrame
  # A 100ms delay provides a 2-tick buffer to absorb network jitter.
  And the client maintains an Interpolation Buffer with a 100ms delay target

# -- CLIENT-SIDE PREDICTION & RECONCILIATION --

# Ensures the player feels zero input lag when moving.
Scenario Outline: Client-Side Prediction and Server Acknowledgment
  Given the local player is at <start_x>, <start_y>
  And the player presses the "Right" arrow key
  When the client polls input at 20Hz and tags it as Input_Seq <seq>
  Then the local player immediately predicts movement to <pred_x>, <pred_y>
  And the input is added to the Pending Input Queue
  When the next server snapshot arrives acknowledging Input_Seq <seq>
  Then the client removes Input_Seq <seq> from the queue

  Examples:
    | start_x | start_y | seq | pred_x | pred_y |
    | 100     | 100     | 5   | 105    | 100    |
    | 790     | 100     | 6   | 795    | 100    |

# Ensures the client respects the server as the absolute authority without rubber-banding.
Scenario: Input Replay during Latency
  Given the Pending Input Queue contains unacknowledged movements [Seq 10, Seq 11]
  When a server snapshot arrives acknowledging only up to Seq 9
  And the server authoritative position differs from the predicted position by < 50px
  Then the client snaps its base position to the authoritative server position
  And the client instantly replays the physics for Seq 10 and Seq 11
  And the final rendered position is the result of the Replay

# Drastic correction if prediction fails entirely (e.g. hitting an obstacle the client didn't know about).
Scenario: The Divergence Threshold (Hard Snap)
  Given the local player's predicted position is 500, 500
  When a server snapshot arrives
  And the calculated Replay position results in 300, 500
  And the distance between Predicted and Replayed positions exceeds 50px
  Then the client discards the Pending Input Queue
  And the client immediately hard-snaps the rendered position to 300, 500

# -- SNAPSHOT INTERPOLATION --

# Masks jitter for all other players on the screen.
Scenario Outline: Linear Interpolation (Lerp) of Remote Entities
  Given the Interpolation Buffer contains snapshots at T1=1000ms and T2=1050ms
  And a remote entity is at <x1>, <y1> at T1 and <x2>, <y2> at T2
  When the requestAnimationFrame triggers at Render Time <render_time>
  And the Render Time falls between T1 and T2
  Then the remote entity is rendered at <lerp_x>, <lerp_y>

  Examples:
    | x1 | y1 | x2 | y2 | render_time | lerp_x | lerp_y | Notes               |
    | 10 | 10 | 20 | 10 | 1025        | 15     | 10     | Exactly 50% between |
    | 0  | 50 | 0  | 60 | 1010        | 0      | 52     | 20% between         |

# Handles extreme network lag when the buffer runs completely empty.
Scenario: Buffer Underrun (Starvation)
  Given the Interpolation Buffer contains its newest snapshot at T=2000ms
  When the requestAnimationFrame triggers at Render Time 2050ms
  And no newer snapshot has arrived due to network jitter
  Then the remote entities freeze at their positions from T=2000ms
  And Extrapolation is NOT applied
```

## Architecture & Infrastructure

### Cloud Architecture (Cloud Run / WebSockets)

No changes required for Phase 2. The Phase 1 infrastructure (Always Allocated CPU, Port Binding) supports this phase perfectly.

### Software Architecture (Node.js / Game Loop)

To implement smooth movement while maintaining absolute server authority, Phase 2 requires a significant architectural expansion on the client side, while the server requires a precise payload modification.

#### Core Engine (Physics & Determinism)

- **`InputManager` (The 20Hz Poller)**: Driven by `setInterval(..., 50)`. Captures key states (Up, Down, Left, Right), increments a local `input_seq_id`, pushes the input to the local `PendingQueue`, and sends it to the server via WebSocket.
- **`InterpolationBuffer` (The Time Machine)**: Driven by `ws.onmessage`. Receives the 20Hz server broadcasts and pushes them into an array. It calculates the `RenderTime` (`now - 100ms`) and yields the two closest snapshots (T1 and T2) required for the `Lerp` function.
- **`ClientEngine` (The Renderer)**: Driven by `requestAnimationFrame`. Completely independent of network events. Every frame, it applies the authoritative server state for the local player, replays pending inputs, and interpolates remote players.
- **Shared Physics (`src/shared/physics.js`)**: The movement math (`Position + (Vector * Speed * DeltaTime)`) MUST be identical on both the Server and Client to ensure deterministic outcomes during Prediction and Replay.

#### Network Protocol (Schemas & Backpressure)

To make Input Replay possible, the server must tell the client _which_ inputs it has successfully processed.

**Client -> Server (Polled Input Delta)**
_Schema_: `[Message_Type, Input_Seq_ID, Vector_X, Vector_Y]`
_Example_: `[1, 104, 1, 0]` (Type 1, Seq 104, Moving Right `+1` on X, `0` on Y)

**Server -> Client (Tick Broadcast - Modified)**
_Schema_: `[Server_Seq_ID, Server_Time, [[Client_ID, X, Y, Last_Input_Seq], ...]]`
_Example_: `[105, 12045.33, [["uuid_1", 450, 200, 104], ["uuid_2", 100, 100, 99]]]`

#### State Manager (SSOT)

The Server `StateManager` will be updated to accept `Vector_X/Y` instead of raw coordinates, and will execute the shared physics logic to update the authoritative state.

### Hard-Liner TDD (Vitest Fake Timers)

The client-side `InterpolationBuffer` and `InputManager` must be unit-tested in Node.js using Vitest fake timers. We will explicitly test that `Lerp` returns the exact mathematical midpoint when simulated `requestAnimationFrame` events trigger between network ticks.

### Performance Constraints (GC & Memory)

- **GPU Compositing**: All DOM updates in `ClientEngine` must use `transform: translate3d(x, y, 0)` to guarantee hardware acceleration during the 60/144Hz render loop, avoiding expensive layout reflows.
- **Buffer Management**: The `InterpolationBuffer` must aggressively prune snapshots older than `now - 200ms` to prevent unbounded memory growth on the client.
