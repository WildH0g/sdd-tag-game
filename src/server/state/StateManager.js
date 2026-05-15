import { applyInput } from '../../shared/physics.js';

/**
 * Authoritative Single Source of Truth (SSOT) for the game state.
 * Refactored for Phase 3 to support Roles, Scores, and Collision Resolution.
 */
export class StateManager {
  /**
   * @param {Object} config
   * @param {number} config.width - Arena width.
   * @param {number} config.height - Arena height.
   * @param {number} [config.playerSpeed=200] - Movement speed in px/s.
   * @param {number} [config.tagGracePeriod=2000] - Cooldown in ms after being tagged.
   */
  constructor(config) {
    this.config = {
      width: config.width,
      height: config.height,
      playerSpeed: config.playerSpeed || 200,
      tagGracePeriod: config.tagGracePeriod || 2000,
      tickRate: 0.05, // Fixed 50ms tick
    };
    this.players = new Map();
  }

  /**
   * Adds a new player with zeroed sequence tracking.
   * Ensures at least one hunter exists.
   * @param {string} id
   */
  addPlayer(id) {
    let hunterCount = 0;
    this.players.forEach((p) => {
      if (1 === p.role) hunterCount++;
    });

    const role = 0 === hunterCount ? 1 : 0;

    this.players.set(id, {
      x: this.config.width / 2,
      y: this.config.height / 2,
      lastInputSeq: 0,
      role: role,
      score: 0,
      lastTaggedTime: -1,
    });
  }

  /**
   * Removes a player from the state.
   * Ensures the hunter role is reassigned if the current hunter leaves.
   * @param {string} id
   */
  removePlayer(id) {
    const player = this.players.get(id);
    if (undefined === player) return;

    const wasHunter = 1 === player.role;
    this.players.delete(id);

    if (wasHunter) {
      this._ensureHunterExists();
    }
  }

  /**
   * Internal invariant maintenance to ensure the game always has a hunter.
   * @private
   */
  _ensureHunterExists() {
    if (0 === this.players.size) return;

    let hunterExists = false;
    this.players.forEach((p) => {
      if (1 === p.role) hunterExists = true;
    });

    if (false === hunterExists) {
      const firstId = this.players.keys().next().value;
      this.players.get(firstId).role = 1;
    }
  }

  /**
   * Processes a Vector input [Type, Input_Seq, Vec_X, Vec_Y].
   * Integrates shared/physics.js for deterministic movement.
   * @param {string} id
   * @param {Array} payload
   */
  processInput(id, payload) {
    if (false === Array.isArray(payload)) return;
    if (4 !== payload.length) return;

    const [type, seq, vx, vy] = payload;
    if (1 !== type) return; // Type 1 = Movement Input

    const player = this.players.get(id);
    if (undefined === player) return;

    // Authority: Reject stale or duplicate sequences
    if (seq <= player.lastInputSeq) return;

    // Authority: Clamp vectors to prevent speed-hacking
    const vector = {
      x: Math.max(-1, Math.min(1, vx)),
      y: Math.max(-1, Math.min(1, vy)),
    };

    const bounds = { width: this.config.width, height: this.config.height };

    // Deterministic Physics Step
    const nextPosition = applyInput(
      { x: player.x, y: player.y },
      vector,
      this.config.playerSpeed,
      this.config.tickRate,
      bounds
    );

    player.x = nextPosition.x;
    player.y = nextPosition.y;
    player.lastInputSeq = seq;
  }

  /**
   * Resolves a list of collision pairs.
   * Performs role swaps, teleports tagged players, and increments scores.
   * Enforces the 2000ms grace period.
   *
   * @param {Array<[string, string]>} pairs - Colliding entity ID pairs.
   * @param {number} currentTime - Current server performance.now().
   * @returns {Array} List of events generated [Type, Hunter_ID, Prey_ID, New_It_ID, Time].
   */
  resolveCollisions(pairs, currentTime) {
    const events = [];

    pairs.forEach(([idA, idB]) => {
      const pA = this.players.get(idA);
      const pB = this.players.get(idB);

      if (undefined === pA || undefined === pB) return;

      // Identify roles (one MUST be hunter, one MUST be prey)
      const hunterId = 1 === pA.role ? idA : 1 === pB.role ? idB : null;
      const preyId = 0 === pA.role ? idA : 0 === pB.role ? idB : null;

      if (null === hunterId || null === preyId) return;

      const hunter = this.players.get(hunterId);
      const prey = this.players.get(preyId);

      // Authority: Check grace period (Only if they were recently tagged)
      const hasRecentTag = 0 < hunter.lastTaggedTime;
      const isWithinCooldown =
        currentTime - hunter.lastTaggedTime < this.config.tagGracePeriod;

      if (hasRecentTag && isWithinCooldown) return;

      // TAG EVENT
      hunter.role = 0;
      hunter.score += 15;

      prey.role = 1;
      prey.lastTaggedTime = currentTime;

      // Teleport prey (new hunter) to center
      prey.x = this.config.width / 2;
      prey.y = this.config.height / 2;

      events.push([2, hunterId, preyId, preyId, currentTime]);
    });

    return events;
  }

  /**
   * Returns an expanded snapshot.
   * Format: [[ID, X, Y, Last_Input_Seq, Role, Score], ...]
   * @returns {Array<Array>}
   */
  getSnapshot() {
    const snapshot = [];
    this.players.forEach((data, id) => {
      snapshot.push([
        id,
        data.x,
        data.y,
        data.lastInputSeq,
        data.role,
        data.score,
      ]);
    });
    return snapshot;
  }
}
