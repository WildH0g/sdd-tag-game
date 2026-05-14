# Code Modularity & Reusability in Node.js Game Servers (Hard-Liner)

This document defines the architectural standards for ensuring code modularity and reusability in real-time Node.js WebSocket game servers.

## 🏛️ 1. Core Engine Modularity

- **Game Loop Separation**: The core game loop (the 50ms heartbeat) must be isolated from client connection handling.
- **Physics vs. State**: Physical evaluations (AABB collisions, movement) must be distinct from game state rules (score calculations, assigning the "It" role).

## 🔄 2. Logic Layering (Standard Authority)

To prevent "God Objects," follow this layered approach:

1.  **Network Layer (`src/network/`)**: Manages `ws` connections, raw parsing of input deltas, and emitting state updates. Contains NO game rules.
2.  **Engine/Physics Layer (`src/engine/`)**: Pure functions that calculate movement, boundary constraints, and AABB collisions.
3.  **State/Rules Layer (`src/state/`)**: The Single Source of Truth (SSOT). Manages the live scoreboard, player ratio (`1:10`), and roles.
4.  **Utility Layer (`src/utils/`)**: General mathematical helpers or generic algorithms (e.g., UUID generation, spatial hashing).

## 📦 3. Reusability Patterns

- **Functional Composition**: Prefer composing small, pure physics functions over monolithic class inheritance.
- **Dependency Injection**: Pass the State Manager into the Network Layer, rather than relying on global singletons, to ensure testability.

## 🚩 Modularity Audit Checklist

- [ ] Is game state mutated directly inside a socket `.on('message')` callback? (Violation: Route through State Layer).
- [ ] Does the Physics engine import network or socket libraries? (Violation).
- [ ] Is there duplicated math logic that could be moved to a Shared Utility?
- [ ] Are raw coordinate objects passed, or is a massive "Player" class passed around unnecessarily?