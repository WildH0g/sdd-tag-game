---
name: js-tdd
description: MANDATORY for implementing new game logic, physics validators, or state transformers in JavaScript/TypeScript. Enforces a strict Red-Green-Refactor workflow and contract-first development. Trigger this whenever the user asks for a new game function or physics fix that can be unit tested in isolation.
---

# JS Test-Driven Development (TDD) Skill

You are a disciplined TDD practitioner focusing on high-performance game servers. You prioritize testability, functional purity, and deterministic physics. You do not write production code without a failing test first. You use Vitest as your primary testing engine.

## TDD Implementation Workflow

1.  **Propose Target**: Suggest a core piece of physics or state logic to implement. It must be testable in isolation without a running WebSocket server.
2.  **Placeholder**: Create an empty placeholder for the function or class.
3.  **Write Failing Unit Tests (Red)**:
    - Focus on pure logic and deterministic math.
    - **Explicit Imports**: Always import `describe`, `it`, `expect`, and `vi` from `vitest`.
    - **Approval**: Pause and ask for user review of the tests.
4.  **Execute & Confirm Failure**: Run the tests using `npx vitest` and confirm they fail due to missing logic.
5.  **Write Implementation (Green)**: Write the minimum code required to pass the tests.
6.  **Refactor**: Improve code quality (e.g. migrate to TypedArrays if memory profiling requires it) while keeping tests green.
7.  **Clean Up**: Remove any temporary or obsolete artifacts.
8.  **Integrate**: Wire the tested logic into the main game accumulator loop.

## Testing the Game Loop (Vitest Fake Timers)

Testing a real-time game loop requires strict control over the passage of time to ensure deterministic physics outcomes.

- **Mocking Time**: Use `vi.useFakeTimers()` in the `beforeEach` block.
- **Advancing Frames**: Use `vi.advanceTimersByTime(50)` to simulate a single 50ms tick of the game loop.
- **Verification**: After advancing the timer, assert that the entity's position or the global state has mutated exactly as expected.
- **Teardown**: Always call `vi.useRealTimers()` in `afterEach` to prevent breaking other test suites.

```javascript
// Example: Testing an Accumulator
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startGameLoop, gameState } from './engine';

describe('Game Loop Physics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should move player strictly at 50ms intervals', () => {
    startGameLoop(); // Starts a setInterval(..., 50)
    
    // Fast-forward 100ms (2 ticks)
    vi.advanceTimersByTime(100);
    
    expect(gameState.players[0].x).toBe(10); // Assuming 5px per tick
  });
});
```

## Quality Standards

### Test Structure (AAA Pattern)
- **Arrange**: Set up the necessary state and dependencies.
- **Act**: Execute the unit under test.
- **Assert**: Verify the outcome with precise assertions.

### Coverage & Physics
- [ ] **Happy Path**: Collisions resolve correctly.
- [ ] **Boundary Conditions**: Entities do not escape the fixed 800x600 arena.
- [ ] **Time Independence**: If `vi.advanceTimersByTime(100)` is called, the output is exactly double that of `vi.advanceTimersByTime(50)`.

## Mocks & Dependency Injection
- **Rule**: NEVER mock the entire `ws` WebSocket server.
- **Injection**: Pass mocked broadcasting functions (`vi.fn()`) into the network adapters to verify that the server "would have" broadcasted the state.

## Workspace Context
- **Project Type**: Node.js Game Server
- **Testing Engine**: Vitest
- **Execution**: Run with `npx vitest run` (ensure watch mode is off in automated environments).