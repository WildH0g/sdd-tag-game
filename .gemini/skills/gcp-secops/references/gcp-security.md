# SecOps: GCP Infrastructure & Secret Management

This document defines the clinical standards for securing GCP Cloud Run WebSocket infrastructure and managing sensitive credentials.

## 🛡️ 1. IAM & Least Privilege

- **Rule**: Grant the minimum permissions required for a service to function.
- **Standard**: Use custom Service Accounts per service. NEVER use the default Compute Engine account.
- **Audit**: Flag `roles/owner`, `roles/editor`, or project-wide roles.

## 🔑 2. Secret Management

- **Rule**: Secrets MUST NOT exist in source code, environment variables (as plain text), or logs.
- **Standard**: Use **GCP Secret Manager**. Use Volume Mounts in Cloud Run.
- **Audit**: Flag hardcoded keys or `.env` files in deployment manifests.

## 🌐 3. Cloud Run for WebSockets

- **Rule**: WebSocket support requires specific Cloud Run configurations.
- **Standard**: Ensure Session Affinity (Sticky Sessions) is disabled unless strictly required by a specific adapter (e.g. Socket.io fallback). Native WebSockets do not strictly require it if the architecture is purely stateful per-instance, but the 1:10 ratio logic expects a single SSOT instance or Redis PubSub.
