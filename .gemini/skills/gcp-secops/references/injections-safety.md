# SecOps: Validation & Injection Safety

This document defines the clinical standards for preventing injection attacks and malformed data crashes in a WebSocket game server.

## 💉 1. WebSocket Handshake & CORS
- **Rule**: Never trust any incoming connection by default.
- **Prevention**: Validate the `Origin` header during the HTTP upgrade phase to prevent Cross-Site WebSocket Hijacking (CSWSH).

## 🛡️ 2. Payload Validation & Sanitization
- **Rule**: Never blindly trust incoming JSON payloads.
- **Prevention**: Use strict schema validation (e.g., Zod or Joi) on EVERY incoming socket message before routing it to game logic.
- **Audit**: Flag `JSON.parse(data)` where the result is immediately used without structural validation.

## 🚫 3. Application-Layer DDoS & Memory Bombing
- **Rule**: Prevent a single client from overwhelming the game loop or blocking the main Node.js thread.
- **Payload Limits**: If a client sends a 5MB JSON payload, synchronous parsing will block the Node.js event loop, lagging all other players. You MUST explicitly configure `maxPayload` in the WebSocket Server options (e.g., `new WebSocket.Server({ maxPayload: 2048 })`) to enforce a tight byte limit.
- **Rate Limiting**: Implement per-socket rate limiting (e.g., max 20 messages per second per client) to prevent flood attacks.
- **Audit**: Flag missing message throttles or unconfigured `maxPayload` settings on server initialization.