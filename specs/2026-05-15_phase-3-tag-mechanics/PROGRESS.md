# Project Progress: Phase 3 - Multiplayer Mechanics (Tag & Collision)

**Status:** In Progress
**Start Date:** 2026-05-15
**Context:** Implement the competitive "Tag" mechanic, including authoritative collision detection, role management, and score tracking.

## 📋 Implementation Plan

### Phase 1: Physics (Collision Engine)

- [x] **1.1 Implement CollisionEngine (AABB with Negative Padding)**
  - Create `src/server/engine/CollisionEngine.js`.
  - Implement O(N²) AABB check with 2px negative padding.
  - Return a list of verified collision pairs.
  - **Agent Tools**: `write_file`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `game-physics`, `code-solid`
  - **Agent Verification**: `npx vitest run` to verify precision hit detection and padding logic.
  - **User verification**: None (Pure engine logic).

### Phase 2: State (Role & Score Management)

- [x] **2.1 Update StateManager for Roles, Scores, and Grace Periods**
  - Refactor `StateManager.js` to track `role`, `score`, and `lastTaggedTime`.
  - Implement `hunterCount` invariant and automatic "It" designation.
  - Implement `resolveCollisions(pairs, currentTime)` logic (swap roles, increment score, teleport).
  - Enforce the 2000ms grace period.
  - **Agent Tools**: `replace`, `write_file`, `run_shell_command`
  - **Agent Skills:** `js-tdd`, `code-clean`, `code-modularity`
  - **Agent Verification**: `npx vitest run` with fake timers to verify role swaps and grace period immunity.
  - **User verification**: Drive RED square into BLUE square. Observe instant color swap, teleportation, and score increment (+15).

### Phase 3: Network (Event Protocol & Expanded Broadcast)

- [ ] **3.1 Update NetworkManager & Protocol for Tag Events**
  - Expand 20Hz broadcast payload to include `role` and `score`.
  - Implement Type 2 "Tag Event" broadcast logic.
  - **Agent Tools**: `replace`, `write_file`, `run_shell_command`
  - **Agent Skills:** `websocket-protocol`, `js-tdd`, `code-patterns`
  - **Agent Verification**: `npx vitest run` to verify expanded payload schemas and event triggering.
  - **User verification**: Observe network tab for Type 2 packets when players collide.

### Phase 4: UI (Competitive Visuals & HUD)

- [ ] **4.1 Implement Competitive UI & Flash Feedback**
  - Update `index.html` to reflect roles (Red for It, Blue/Slate for Prey).
  - Implement screen flash and tag notifications on Type 2 events.
  - Expand HUD with a live scoreboard.
  - **Agent Tools**: `replace`, `run_shell_command`
  - **Agent Skills:** `tailwind`, `code-editing`
  - **Agent Verification**: `npm run build:css` and visual inspection.
  - **User verification**: Collide with another player. Observe instant color swap, screen flash, and score update.

## 📝 Change Log

| Date       | Step | Status      | Notes                                                                                                                                                                                                                             |
| :--------- | :--- | :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-15 | Init | 🟢 Started  | Initialized PROGRESS.md based on Phase 3 SPEC.md.                                                                                                                                                                                 |
| 2026-05-15 | 1.1  | ✅ Complete | Implemented pure `CollisionEngine` with authoritative AABB logic and 2px negative padding ("Forgiving Collision"). Verified via precision unit tests. O(N²) implementation.                                                       |
| 2026-05-15 | 2.1  | ✅ Complete | Expanded StateManager with Roles, Scores (+15 per tag), and 2000ms grace period. Wired CollisionEngine into authoritative heartbeat loop in app.js. Verified visual tagging and score updates via diagnostic HUD scoreboard list. |
