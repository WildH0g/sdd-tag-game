# Project Progress: Phase 2 - Client-Side Rendering & Movement

**Status:** In Progress
**Start Date:** 2026-05-14
**Context:** Implement Client-Side Prediction, Input Replay, and Snapshot Interpolation to provide fluid, jitter-free movement while maintaining strict server authority.

## 📋 Implementation Plan

### Phase 1: Shared Physics & Server Protocol

- [x] **1.1 Implement Shared Physics Engine**
  - Create `src/shared/physics.js` with pure functions for movement and AABB boundary clamping.
  - Expose `applyInput(position, vector, speed, deltaTime, bounds)`.
  - **Agent Tools**: `write_file`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `game-physics`, `code-solid`
  - **Agent Verification**: `npx vitest run` to verify deterministic position calculation and boundary clamping.
  - **User verification**: None (Internal logic).

- [x] **1.2 Update Server StateManager for Vectors & Sequences**
  - Refactor `updatePlayerPosition` to accept vector payloads `[1, Input_Seq, Vector_X, Vector_Y]`.
  - Utilize `shared/physics.js` instead of direct assignment.
  - Track `lastProcessedInputSeq` per player.
  - Update `getSnapshot()` to yield `[Client_ID, X, Y, Last_Input_Seq]`.
  - **Agent Tools**: `write_file`, `replace`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `code-clean`, `code-editing`
  - **Agent Verification**: `npx vitest run` to verify vector processing and payload schema changes.
  - **User verification**: None (Internal payload changes).

### Phase 2: Client Networking & State

- [ ] **2.1 Implement Client InputManager**
  - Create `InputManager` to track keyboard state (arrows).
  - Implement 20Hz polling loop to push vectors to `PendingQueue` and send via WebSocket.
  - Tag payloads with incrementing `Input_Seq`.
  - **Agent Tools**: `write_file`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `websocket-protocol`
  - **Agent Verification**: `npx vitest run` with fake timers to verify 20Hz polling frequency and payload formatting.
  - **User verification**: Observe network tab in browser to see outgoing 20Hz vector payloads when keys are pressed.

- [ ] **2.2 Implement InterpolationBuffer**
  - Create buffer to store incoming server snapshots.
  - Implement pruning for snapshots older than 200ms.
  - Implement `getInterpolatedState(renderTime)` using Lerp between the two bounding snapshots.
  - **Agent Tools**: `write_file`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `websocket-protocol`, `game-physics`
  - **Agent Verification**: `npx vitest run` to verify exact mid-point Lerp calculations and buffer underrun freezing.
  - **User verification**: None (Internal logic).

### Phase 3: Client Rendering Engine

- [ ] **3.1 Implement ClientEngine (Renderer)**
  - Create `requestAnimationFrame` loop.
  - **Prediction**: Apply `PendingQueue` inputs to local player's last known server position.
  - **Reconciliation**: Discard inputs `<= Last_Input_Seq` and apply Divergence Threshold (>50px hard snap).
  - **Interpolation**: Render remote players using `InterpolationBuffer`.
  - Apply DOM updates via `transform: translate3d`.
  - Add debug HUD metrics.
  - **Agent Tools**: `replace`, `run_shell_command`
  - **Agent Skills:** `tailwind`, `code-patterns`
  - **Agent Verification**: `npm run build:css` (if needed) and linter checks.
  - **User verification**: Open two browsers. Move player 1. Observe instant, smooth local movement and smooth, interpolated remote movement in browser 2.

## 📝 Change Log

| Date       | Step | Status      | Notes                                                                                                                                                                                                   |
| :--------- | :--- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-14 | Init | 🟢 Started  | Initialized PROGRESS.md based on Phase 2 SPEC.md.                                                                                                                                                       |
| 2026-05-14 | 1.1  | ✅ Complete | Implemented pure `src/shared/physics.js` for deterministic movement and clamping. Verified via unit tests. Critical foundation for reconciliation.                                                      |
| 2026-05-14 | 1.2  | ✅ Complete | Refactored StateManager to process vector-based inputs and track sequence IDs. Integrated shared physics engine. Hardened against vector spoofing (speed hacks). Verified via manual console injection. |
