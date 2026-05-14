# SecOps: Performance & Memory Safety

This document defines the clinical standards for identifying and preventing runtime memory leaks and performance bottlenecks in WebSocket servers.

## 🧠 1. Memory Leak Patterns
- **Zombie Sockets**: Connections that drop silently without emitting a `close` event, trapping player state in memory.
- **Prevention**: Implement a robust Ping/Pong heartbeat. If a client misses a Pong, forcefully terminate the socket and wipe their state.
- **Audit**: Identify missing `ping` loops or arrays/Maps that grow without a cleanup mechanism on disconnect.

## 🌊 2. WebSocket Backpressure (OOM Prevention)
- **Problem**: When the server broadcasts state (e.g., 50ms ticks) faster than a slow client can consume it, Node.js buffers the outgoing messages. This buffer grows indefinitely until the server crashes with an Out-of-Memory (OOM) error.
- **Prevention**: You MUST check `ws.bufferedAmount` before calling `ws.send()`. If `bufferedAmount` exceeds a threshold (e.g., 1024 * 1024 for 1MB), the server should drop the message for that client or forcefully disconnect them to protect the global game loop.
- **Audit**: Flag any naked `ws.send()` calls that occur within a broadcast loop without checking `ws.bufferedAmount`.

## ⚡ 3. Game Loop Concurrency
- **Event Loop Blocking**: The 50ms interval loop must not be blocked by heavy computation.
- **Standard**: Keep collision math O(n log n) or better. Avoid massive nested loops.
- **Audit**: Flag O(n^2) operations inside the main tick.

## 📦 4. CPU Allocation in Cloud Run
- **Rule**: Cloud Run throttles CPU when no requests are active.
- **Standard**: For a persistent WebSocket game loop, "CPU always allocated" MUST be enabled in the infrastructure configuration.