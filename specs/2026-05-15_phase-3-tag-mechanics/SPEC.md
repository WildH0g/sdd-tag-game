# Feature Name: Phase 3 - Multiplayer Mechanics (Tag & Collision)

## Introduction

Phase 3 of the DOM-Arena project transforms our fluid movement system into a complete competitive game. By introducing the "Tag" mechanic, we provide players with a clear objective: hunters must catch prey to gain points, while prey must navigate the arena to survive and evade capture. This phase focuses on the competitive integrity of the game, ensuring that every collision is calculated with absolute fairness and that the scoring system remains cheat-proof through strict server authority.

To achieve this, we are implementing a high-performance "Collision Engine" that validates impacts 20 times per second. We use "Forgiving Collision" math, which requires players to significantly overlap before a tag is registered, preventing frustrating near-miss triggers. Technical safeguards like the "Post-Tag Grace Period" prevent immediate revenge tags, ensuring a balanced and strategic flow to the gameplay. The result is a high-fidelity arcade experience where skill and reaction time are the only factors that determine the winner on the leaderboard.

## Designs & Rendering Interpolation

Phase 3 transforms the visual arena into a high-stakes competitive surface. The "snapping" and "movement" of Phase 2 are now combined with dynamic role states and event-driven visual feedback.

### 1. Role-Based Visual Cues

Entities will now visually communicate their competitive status based on the authoritative server roles:

- **The "It" Player (Hunter)**: Rendered in aggressive Red (`bg-red-500`). Features a pulsing glow effect using `shadow-red-500/50`.
- **The Prey (You or Others)**: Rendered in calm Slate (`bg-slate-400`). Local player remains Blue (`bg-blue-500`) but with a clear "Prey" label in the HUD.
- **Transition**: When a "Tag Event" (Type 2) arrives, the colors must swap **instantly** on the client, overriding the current 20Hz state if necessary to ensure the player feels the "impact."

### 2. The "Impact" Feedback

To signify a successful tag, the UI will implement high-fidelity event feedback:

- **Screen Flash**: A brief (100ms) full-screen white or red overlay with `opacity-20` to signal a role change.
- **Tag Notification**: A temporary text element at the center of the arena (e.g., "PLAYER1 TAGGED PLAYER2!") that fades out over 1000ms.
- **Teleport Effect**: The tagged player will "pop" out of existence at the collision point and "pop" back in at the center (400, 300).

### 3. Competitive HUD Expansion

The HUD will be upgraded to show the current scoreboard:

- **Live Scoreboard**: A list of active players sorted by points.
- **Role Indicator**: A prominent "YOU ARE IT" or "ESCAPE!" banner at the top of the HUD.
- **Grace Period Visual**: If the local player is "It" but within the 2000ms grace period, the Red color will be desaturated or "ghosted" to signal they cannot tag yet.

## Gherkin Game Scenarios

```gherkin
Feature: Phase 3 - Multiplayer mechanics (Tag & Collision)

Background:
  Given the server ticks at 20Hz (50ms pulses)
  And players have a visual size of 24x24
  And players have a logical hitbox of 20x20 (2px negative padding)
  And the arena size is 800x600

# -- COLLISION & ROLE SWAP --

Scenario Outline: Hunter tags Prey
  Given player 1 has role "hunter" (It)
  And player 2 has role "prey"
  And player 1 is at <x1>, <y1>
  And player 2 is at <x2>, <y2>
  When the server evaluates collisions
  Then the AABB check results in <is_hit>
  And player 2 becomes "hunter" (It)
  And player 1 becomes "prey"
  And player 1 receives 15 points
  And player 2 is teleported to center (400, 300)
  And the server broadcasts a "Tag Event" (Type 2)

  Examples:
    | x1  | y1  | x2  | y2  | is_hit | Notes                     |
    | 100 | 100 | 110 | 100 | TRUE   | Direct overlap            |
    | 100 | 100 | 121 | 100 | FALSE  | Just outside (padding)    |
    | 100 | 100 | 119 | 100 | TRUE   | Just inside (edge case)   |

# -- CONDITIONAL LOGIC --

Scenario: Bypassing "It-on-It" Collisions
  Given player 1 has role "hunter" (It)
  And player 2 has role "hunter" (It)
  And player 1 is at 100, 100
  And player 2 is at 105, 100
  When the server evaluates collisions
  Then no collision event is triggered
  And roles remain unchanged

# -- INTEGRITY & INITIALIZATION --

Scenario: Automatic "It" Designation (Cold Start)
  Given the server starts with 0 "hunter" players
  When a new player "uuid-1" connects
  Then the server assigns role "hunter" (It) to "uuid-1"
  And the role is reflected in the next state broadcast

Scenario: Preventing immediate "Tag-Back"
  Given player 1 just tagged player 2
  And player 2 is now "hunter" (It)
  And player 2 is moved to 400, 300
  When player 2 attempts to tag player 1 within 2000ms
  Then the collision is ignored by the server
  And roles remain unchanged
```

## Architecture & Infrastructure

### Cloud Architecture (Cloud Run / WebSockets)

Existing Phase 1/2 infrastructure remains authoritative. No new cloud services required.

### Software Architecture (Node.js / Game Loop)

To implement the "Tag" mechanics without compromising performance or state integrity, Phase 3 introduces a dedicated Collision Engine and expands the State Manager to track roles, scores, and temporal grace periods.

#### Core Engine (Physics & Determinism)

- **`CollisionEngine` (The Judge)**: A pure mathematical module. It performs O(N²) AABB checks on a list of entity bounds. It applies the 2px negative padding logic and returns a list of verified "collision pairs." It has no side effects and is completely blind to game roles or network state.
- **Lazy Collision Checks**: Collision evaluation will only run once per 50ms heartbeat (inside `GameLoop._tick()`), NOT on every incoming client message. This preserves CPU cycles for more important tasks like serialization.

#### Network Protocol (Schemas & Backpressure)

**Server -> Client (Tick Broadcast - Expanded)**
_Schema_: `[Sequence_ID, Server_Time, [[Client_ID, X, Y, Seq, Role, Score], ...]]`
_Role Enum_: `0 = Prey`, `1 = Hunter (It)`

**Server -> Client (Tag Event)**
_Schema_: `[2, Hunter_ID, Prey_ID, New_It_ID, Timestamp]`
_Type 2_: Discrete point-in-time notification for UI effects (sounds, flashes).

#### State Manager (SSOT)

- **Role Management**: The `StateManager` will track player roles and scores. It maintains the "One Hunter" invariant. If `hunterCount == 0`, the next player is auto-assigned role `1`.
- **Grace Period**: Stores a `lastTaggedTime` timestamp per player. If `Server_Time - lastTaggedTime < 2000ms`, the player is immune to tagging others.
- **Teleportation**: Autoritatively resets player coordinates to (400, 300) upon being tagged.

### Hard-Liner TDD (Vitest Fake Timers)

We will use `vi.useFakeTimers()` to step through the 2000ms grace period and verify that tags are ignored during the cooldown. We will also unit test the `CollisionEngine` with precise coordinates to ensure the 2px padding logic is mathematically accurate.

### Performance Constraints (GC & Memory)

- **Allocation-Free Iteration**: The collision scan will avoid creating intermediate objects or closures during the N² loop.
- **Role Cache**: The `StateManager` will maintain a small lookup of the current "It" player ID to avoid scanning the entire player map during every tick's role check.
