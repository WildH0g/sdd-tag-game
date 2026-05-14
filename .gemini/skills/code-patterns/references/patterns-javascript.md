# Design Patterns in JavaScript: Standard Authority

This document defines the clinical standards for implementing design patterns in modern JavaScript environments, specifically tailored for real-time Node.js servers.

## 🏗️ 1. Creational Patterns

### **Singleton (ES Modules)**

ES Modules are Singletons by design.

- **Gold Standard**: Export a single instance from a file for centralized systems like the Game State Manager.

```javascript
// stateManager.js
class GameState { ... }
export const gameState = new GameState(); // Singleton instance
```

## 🏗️ 2. Structural Patterns

### **Adapter**

Essential for mapping raw incoming WebSocket messages to normalized internal game actions. Ensure network validation happens in the adapter.

## 🏗️ 3. Behavioral Patterns

### **Strategy (Object/Map Literal)**

Replacing `switch` or `if/else` with an Object Map is the primary implementation for routing different WebSocket message types or handling collision outcomes based on roles.

```javascript
const collisionHandlers = {
  hunter_vs_prey: handleTagEvent,
  hunter_vs_hunter: ignoreCollision,
  prey_vs_prey: pushBack,
};

const resolveCollision = (roleA, roleB) => {
  const handler = collisionHandlers[`${roleA}_vs_${roleB}`];
  if (handler) handler();
};
```

### **Observer (EventEmitter / Pub-Sub)**

Use Node's `EventEmitter` to decouple the network layer from the game loop. The loop emits `tick` events; the network layer listens and broadcasts to clients.

---

## 🚀 4. Real-Time Game Server Patterns

### **The Game Loop Pattern**
Decouple the game simulation step (`update()`) from the broadcast step. Use a fixed `setInterval` (e.g., 50ms) to ensure deterministic state resolution regardless of input volume.

### **Data-Oriented Design (DOD) & ECS**
Traditional OOP (Array of Structures / AoS) causes cache misses and heavy Garbage Collection (GC) pauses as thousands of objects are allocated and destroyed. JavaScript game servers MUST use DOD:
- **Struct of Arrays (SoA)**: Instead of `[{x, y}, {x, y}]`, store components as flat arrays: `{ x: [0, 10], y: [0, 20] }`.
- **TypedArrays for Zero GC**: Use `Float32Array` or `Int16Array` for component storage (e.g., positions, velocities). TypedArrays are allocated once, avoiding the JS garbage collector entirely, preventing micro-stutters during the 50ms tick.
- **Entity-Component-System (ECS)**: 
  - **Entities** are just integer IDs (array indices).
  - **Components** are pure data (TypedArrays).
  - **Systems** are pure functions that iterate over flat arrays.

```javascript
// Data-Oriented Design (ECS) Example
const MAX_PLAYERS = 1000;
const Position = {
  x: new Float32Array(MAX_PLAYERS),
  y: new Float32Array(MAX_PLAYERS)
};
const Velocity = {
  x: new Float32Array(MAX_PLAYERS),
  y: new Float32Array(MAX_PLAYERS)
};

// System: Pure function, contiguous memory access, zero object allocation
function movementSystem(dt, activeEntityIds) {
  for (let i = 0; i < activeEntityIds.length; i++) {
    const eid = activeEntityIds[i];
    Position.x[eid] += Velocity.x[eid] * dt;
    Position.y[eid] += Velocity.y[eid] * dt;
  }
}
```

## 🚩 Antipatterns to Audit

- **OOP "God Objects"**: Avoid massive class instances (`new Player()`) being created/destroyed frequently.
- **Deep Inheritance**: Prefer **Data-Oriented ECS** over `class Player extends Character extends Entity`.
- **GC Thrashing**: Instantiating temporary objects (like `{x, y}` vectors) inside the hot physics loop. Use mutable scratchpad objects or TypedArrays.
- **Event Loop Blockers**: Heavy synchronous pathfinding or unoptimized O(n^2) collision checks in a single tick.