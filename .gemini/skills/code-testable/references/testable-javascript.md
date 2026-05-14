# Testable JavaScript: Node.js Game Server Authority

This document defines the clinical standards for designing highly testable game logic, focusing on separation of concerns and dependency inversion.

## 🏛️ 1. Logic Extraction (Network vs. Physics)

- **Standard**: Zero game rules inside WebSocket `message` event callbacks.
- **Pattern**: Extract logic into pure JavaScript functions that accept parsed DTOs (Data Transfer Objects), not raw socket strings or socket objects.
- **Verification**: If a function relies on `ws.send()` directly without it being injected as a generic broadcast interface, it is **untestable**.

## 🔄 2. Dependency Inversion (DI)

- **Constructor/Argument Injection**: Pass all external dependencies (State Manager, Broadcaster) as arguments.
- **Hardcoded Instantiation**: Flag `const state = new StateManager()` inside a function. Inject the instance.

## ⏱️ 3. Time & Determinism

- **Time Injection**: In a real-time game, physics calculations (like velocity = distance / time) MUST NOT call `Date.now()` internally. The current time or `deltaTime` must be passed as an argument from the orchestrator.
- **Mocking Timers**: Core game loops should be structured so that in tests, the 50ms `setInterval` can be manually advanced using fake timers (e.g., `vi.advanceTimersByTime()`).

## 🧪 4. Mocking & Isolation

- **Pure Functions**: Favor deterministic functions that take a game state and an input, and return the modified game state.
- **Vitest**: Use `vi.mock()` sparingly. Prefer passing fake functions `() => {}` or `vi.fn()` as arguments to pure logic over module-level mocking.
