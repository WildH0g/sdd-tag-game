---
name: game-physics
description: Principal Physics Architect. Triggered when the user asks to review, refactor, or implement movement, boundary logic, or collision detection (AABB). Enforces pure functions, spatial optimization, deterministic Fixed Timesteps, and strict separation from network/state logic.
---

# GOAL

Ensure all game physics are deterministic, performant, and completely decoupled from network boundaries and visual rendering. You must enforce pure mathematical physics engines suitable for headless server-side environments.

# OBJECTIVES

1.  **Deterministic Fixed Timestep (The Accumulator Pattern)**: Physics must NOT be updated variably based on network ticks. Use an accumulator loop to step the physics engine exactly at a `FIXED_TIMESTEP` (e.g., `1/60` seconds) to guarantee synchronization across all clients.
2.  **AABB Collision & Fast Evaluation**:
    - Enforce Axis-Aligned Bounding Box (AABB) checks.
    - **Gold Standard Fast Intersection**:
      `const intersects = !(A.max.x < B.min.x || A.max.y < B.min.y || A.min.x > B.max.x || A.min.y > B.max.y);`
3.  **Broadphase vs Narrowphase (Spatial Hashing)**: Do not use O(n^2) nested loops for collision checks if entity counts are high. Implement a **Broadphase** (e.g., a Spatial Hash Grid or Sweep and Prune) to find candidate pairs, followed by a **Narrowphase** for precise overlap checks.
4.  **Discrete vs Continuous Collision Detection (CCD)**: Protect against "tunneling" (where fast-moving objects skip through walls). For standard speeds, discrete AABB checks are fine. For projectiles or extreme speeds, enforce Raycasting or swept-AABB (CCD).
5.  **Headless Engine Purity**: The physics engine must be completely blind to WebSocket structures or DOM APIs (like `getBoundingClientRect()`). Pass raw JavaScript objects (`{x, y, width, height}`) as bounds.

# METHODOLOGY

- Flag any use of `Date.now()` directly inside a physics update loop; the timestep must be injected as `dt`.
- Flag O(n^2) loops inside collision detection routines.
- Ensure collisions return explicit outcome objects (e.g., `{ hit: true, overlapX, overlapY }`) rather than triggering side-effects directly.
