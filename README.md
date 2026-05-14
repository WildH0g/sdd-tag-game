# 📖 Game Overview

DOM-Arena Multiplayer "Tag" is a fast-paced, web-based arcade survival game where players navigate a shared digital arena to hunt opponents or evade capture. Built on real-time WebSocket synchronization and a dynamically scaling role system, the game challenges players to master spatial awareness and evasive maneuvers to dominate the live leaderboard.

## 🎮 Player Rules

- **Joining the Game:** You can drop into the action instantly by navigating to the game's URL. Before spawning into the arena, you simply provide a custom display name to identify yourself on the leaderboard.
- **Roles & "It" Mechanics:** The game dynamically assigns the "It" (hunter) role based on server population, ensuring there is always exactly 1 "It" player for every 10 active players. "It" players share a truce: they cannot tag one another, meaning any physical collisions between two "It" players are completely ignored.
- **Mechanics:** - Navigate your colored block around the arena boundaries using your keyboard's arrow keys.
- If you are "It", your goal is to physically overlap your block with a regular player's block to trigger a "Tag".
- If you are successfully tagged, your block is instantly teleported back to a neutral reset position.

- **Scoring System:** - **Survival:** Regular players earn **5 points** for every **10 seconds** they successfully survive without being tagged.
- **Hunting:** "It" players earn **15 points** for every successful tag they execute.
- **Disconnect Penalty:** Your score is strictly tied to your active network session. If you close your browser tab or lose your connection to the server, your score is permanently wiped and cannot be recovered upon rejoining.

## ⚙️ Developer Features (Suggested Build Sequence)

1. **Phase 1 - Infrastructure & Network Setup:** Establish the foundational Node.js server with native HTTP and WebSocket integration. Containerize the application using Docker and deploy it to Google Cloud Run. Implement the centralized 50ms server heartbeat to broadcast X/Y coordinates to all connected clients.
2. **Phase 2 - Client-Side Rendering & Movement:** Build the fixed 800x600 Tailwind CSS game arena. Implement absolute positioning for the player `<div>` elements and attach local keydown listeners for movement. Implement **Client-Side Prediction** for immediate local movement and **Snapshot Interpolation** to smoothly render the state updates received from the server, masking network jitter without relying solely on CSS transitions.
3. **Phase 3 - Dynamic State, Ratios & Scoring:** Develop the server-side state manager to track connected sockets, user display names, and live scores. Implement the math logic to continuously evaluate the total player count and automatically assign or revoke the "It" status to maintain the strict 1:10 ratio. Implement the interval timers for survival points and the session-kill listener that wipes scores on disconnect.
4. **Phase 4 - Physics, Collision & Role Immunity:** Integrate the client-side `requestAnimationFrame` render loop. Implement a headless, pure-math physics engine using **Axis-Aligned Bounding Box (AABB)** collision detection (operating on raw JS objects, NOT DOM APIs). Implement **Server Reconciliation** to snap the client to the authoritative server state. Use conditional logic to bypass collision events if both overlapping elements possess the "It" role flag.
   the "It" role flag.
