# GCP Cloud Run Standard Authority: Technical Reference

This document defines the clinical standards for deploying and managing services on GCP Cloud Run, with specialized mandates for WebSocket servers.

## 📦 1. Container Contract & Runtime
- **Port Binding**: MUST listen on `0.0.0.0` on the port defined by the `$PORT` environment variable. Hardcoded ports are PROHIBITED.
- **Statelessness**: No persistence on local disk. Offload state to GCS, MemoryStore (Redis), or Cloud SQL.
- **Memory Safety (`/tmp`)**: The writable filesystem is `tmpfs` (RAM). Large writes to `/tmp` cause Out-of-Memory (OOM) errors. Always delete temporary files after use.

## 🌐 2. WebSockets & Long-Lived Connections
- **CPU Allocation**: For WebSocket game loops, "CPU always allocated" MUST be enabled. The default "CPU only allocated during request processing" will freeze physics and heartbeat loops when no HTTP requests are actively processing, leading to connection drops.
- **Timeouts**: By default, connections face a load balancer timeout. The Cloud Run request timeout must be explicitly increased (up to 3600s / 60 mins) to support long-lived socket sessions.
- **Concurrency**: WebSockets inherently utilize concurrency. Ensure the container concurrency setting is raised (Cloud Run supports up to 1000 per container) to handle multiple players without spawning unnecessary instances that fracture the game state.

## ⚡ 3. Performance & Cold Start Optimization
- **Global Scope Reuse**: Declare heavy clients (DB pools, API wrappers) globally to reuse them across warm starts.
- **Lazy Loading**: Import heavy modules (ML models, processing libs) inside functions, not at the top level.
- **Multi-Stage Builds**: Mandatory to reduce image size and attack surface.
- **Base Images**: Use `alpine` for Node.js to keep pull times minimal.

## 🛡️ 4. IAM & Security
- **Custom Service Accounts**: NEVER use the default Compute Engine service account. Create a unique identity per service.
- **Secret Management**:
  - **Volume Mounts (Preferred)**: Use for sensitive credentials (DB, Keys) to enable automatic rotation and prevent leakages in logs/proc.
  - **Env Vars (Secondary)**: Use for non-critical config. Always pin to a specific secret version (`SECRET_NAME:1`).
- **Least Privilege**: Grant roles (e.g., `roles/secretmanager.secretAccessor`) on the specific resource, not the project.
- **Non-Root Execution**: Always define a `USER` (e.g., `node` or `appuser`) in the Dockerfile.

## 🧵 5. Execution & Shutdown
- **Graceful Shutdown**: Implement `SIGTERM` handlers to finish critical work and close connections within the 10-second shutdown window. 
- **Warning**: Do not rely on graceful shutdowns for critical state saves (like high-score writing on scale-down); Cloud Run can kill containers abruptly. Game state must be synced to persistent storage continuously or via event-driven triggers.