# Feature Name: Phase 4 - Engine Finalization & Trajectory Physics

## Introduction

Phase 4 represents the final architectural hardening of the DOM-Arena engine, elevating it from a competitive prototype to a production-grade arcade simulation. This phase is dedicated to mathematical precision and system resilience. By implementing "Swept AABB" physics, we eliminate the possibility of players "ghosting" through each other during high-speed movements, ensuring that every tag is calculated with sub-tick accuracy. We are also establishing strict "Hard-Liner" reconciliation rules that allow the game to automatically recover from severe network spikes or lag, maintaining a fair and consistent experience for all participants regardless of their internet quality.

Beyond raw physics, Phase 4 introduces optimized data handling to ensure the server remains cost-effective and performant as player counts scale. By reducing "Garbage Collection" overhead and streamlining how the game state is broadcasted, we maximize the efficiency of our Google Cloud Run infrastructure. Visually, the player is now fully informed of the engine's authoritative decisions through subtle cues like spawn invulnerability flashes and desync indicators. The result is a rock-solid multiplayer foundation that is ready for production deployment and future expansion.

## Designs & Rendering Interpolation

Phase 4 moves beyond basic movement and competitive roles, focusing on the visual communication of engine stability and technical authority.

### 1. Reconciliation Transparency

- **The Glitch Artifact**: When a **Hard Snap** (50px+ divergence) occurs, the UI will briefly pulse the entity's opacity or trigger a monochromatic "flash" effect. This transforms a technical correction into a deliberate visual cue.
- **Replay Smoothing**: For desyncs < 50px, the transition from predicted state to replayed state must be mathematically seamless. The `ClientEngine` will use a secondary "Reconciliation Lerp" to blend the correction over 100ms.

### 2. Spawn Protection Visuals

- **Invulnerability State**: During the authoritative 50ms spawn protection window, the teleported player will be rendered with a **High-Frequency Flicker** or a semi-transparent `opacity-50` state.

### 3. Final Production HUD

The HUD is evolved into a full performance dashboard:

- `DESYNC_SNAPS`: Total count of hard-snap corrections in the current session.
- `CLOCK_DRIFT`: Real-time variance between server and local timelines (in ms).
- `REPLAY_DEPTH`: Current size of the input buffer (capped at 20).

## Gherkin Game Scenarios

```gherkin
Feature: Phase 4 - Advanced Physics & Final Reconciliation

Background:
  Given the server tick rate is exactly 50ms
  And the arena is 800x600
  And players move at a base speed of 200px/s

# -- SWEPT AABB (TUNNELING PREVENTION) --

Scenario Outline: Detecting high-speed tunneling collisions
  Given Player 1 (Hunter) is stationary at 300, 300
  And Player 2 (Prey) is at <start_x>, 300
  When Player 2 moves to <end_x>, 300 in a single 50ms tick
  And the linear path between <start_x> and <end_x> intersects Player 1's 20x20 hitbox
  Then a Tag Event is successfully registered
  And tunneling is prevented

  Examples:
    | start_x | end_x | result | Notes                        |
    | 285     | 315   | TAGGED | Passed through center        |
    | 275     | 285   | MISS   | Stopped before hitbox        |

# -- SERVER RECONCILIATION & DIVERGENCE --

Scenario Outline: Authoritative Reconciliation Snap
  Given the client predicted a position of <pred_x>, <pred_y>
  And the server authoritative snapshot arrives with position <server_x>, <server_y>
  When the distance between predicted and server positions is <delta>
  Then the client executes a <correction_type>

  Examples:
    | pred_x | pred_y | server_x | server_y | delta | correction_type |
    | 100    | 100    | 110      | 100      | 10px  | INPUT REPLAY    |
    | 100    | 100    | 160      | 100      | 60px  | HARD SNAP       |

# -- SPAWN SAFETY & ROBUSTNESS --

Scenario: Spawn Invulnerability (Post-Teleport)
  Given Player 2 was just tagged and teleported to 400, 300
  When Player 1 (Hunter) is already standing at 400, 300
  Then the collision check for Player 2 is ignored for exactly 50ms
  And no "Double Tag" event occurs

Scenario: Input Queue Replay Cap
  Given the client has a lag spike and accumulates 50 pending inputs
  When the network connection resumes
  Then the client discards all but the 20 most recent inputs
  And the simulation state is corrected to the newest valid state
```

## Architecture & Infrastructure

### Cloud Architecture (Cloud Run / WebSockets)

Final hardening for Cloud Run:

- Enforce `$PORT` binding for ingress.
- "CPU Always Allocated" validation.
- Egress monitoring via HUD diagnostics.

### Software Architecture (Node.js / Game Loop)

#### Core Engine (Physics & Determinism)

- **`CollisionEngine` (Swept AABB)**: accett current and previous positions to calculate path intersections. Prevents "tunneling" by validating the line segment of movement.
- **Spawn Invulnerability**: Implements a 50ms bitmask or flag on the server state to ignore collisions for newly teleported entities.

#### Network Protocol (Schemas & Backpressure)

- **JSON "State Buffer" Optimization**: The `StateManager` will maintain a reusable object literal for snapshots to avoid O(N) array allocation per tick, satisfying the **Zero GC** mandate for the broadcast loop.

#### State Manager (SSOT)

- **Divergence Authority**: The SSOT remains absolute. The server does not care about client-side "Predicted" positions; it only validates inputs.

### Hard-Liner TDD (Vitest Fake Timers)

Testing focuses on temporal edge cases:

- **Tunneling Tests**: Verify impacts where `T-1` and `T` positions bracket an opponent.
- **Reconciliation Snap Logic**: Unit tests for the `distance()` and `snapThreshold` comparison.
- **Grace/Safety Intervals**: Verify that 50ms spawn protection and 2000ms tag-back grace periods are independent and strictly enforced.

### Performance Constraints (GC & Memory)

- **Replay Cap**: Input buffer on the client is strictly capped at 20 (1 second of simulation) to prevent frame-rate drops during recovery.
- **Allocation Minimization**: Use of reusable buffers for serialization in `StateManager.getSnapshot()`.
