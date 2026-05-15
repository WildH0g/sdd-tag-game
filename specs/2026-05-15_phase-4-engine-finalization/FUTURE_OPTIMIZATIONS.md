# Future Optimizations: Binary Protocol & Performance

This document tracks deferred optimizations for the DOM-Arena engine to be implemented after the core Phase 4 hardening.

## 1. Binary Protocol Migration (TypedArrays)

Currently, the 20Hz heartbeat uses Flat JSON arrays. While optimized, JSON stringification is a blocking operation and relatively large in egress size.

### Proposal:

- Use `ArrayBuffer` for broadcasts.
- **Protocol Schema (Fixed Length)**:
  - `[0-3]`: Sequence ID (Uint32)
  - `[4-11]`: Server Time (Float64)
  - `[12-13]`: Player Count (Uint16)
  - `[14+]`: Repeat Player Records:
    - `ID_Hash`: 4 bytes (Uint32)
    - `X`: 4 bytes (Float32)
    - `Y`: 4 bytes (Float32)
    - `Last_Seq`: 4 bytes (Uint32)
    - `Role`: 1 byte (Uint8)
    - `Score`: 4 bytes (Uint32)

### Rationale:

- **Zero GC**: No string or object creation during serialization.
- **Egress Reduction**: Estimated 70% reduction in packet size.
- **Parsing Performance**: Clients use `DataView` or `TypedArray` overlays for zero-copy access.

## 2. Spatial Hashing (Broadphase Collision)

The current O(N²) collision check is the primary bottleneck for scaling.

### Proposal:

- Implement a **Spatial Hash Grid** (e.g., 100x100 cells).
- Entities register their cell index based on current X/Y.
- Only check collisions for entities in the same or adjacent cells.

### Rationale:

- Reduces complexity to O(N).
- Allows the arena to scale from 10 players to 100+ without impacting the 50ms tick budget.

## 3. WebSocket Compression (permessage-deflate)

If binary migration is further delayed, enable the `permessage-deflate` option in the `ws` library config.

### Rationale:

- Immediate 50-60% payload reduction.
- **Trade-off**: Higher CPU usage on both server and client for compression/decompression.
