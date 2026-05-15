import { applyInput } from '../../shared/physics.js';

/**
 * Authoritative Single Source of Truth (SSOT) for the game state.
 * Refactored for Phase 4 with Swept AABB, Grace Periods, and Spawn Protection.
 */
export class StateManager {
  /**
   * @param {Object} config
   * @param {number} config.width - Arena width.
   * @param {number} config.height - Arena height.
   * @param {number} [config.playerSpeed=200] - Movement speed in px/s.
   * @param {number} [config.tagGracePeriod=2000] - Cooldown for being caught again.
   * @param {number} [config.spawnProtection=50] - Cooldown for new hunters to tag others.
   */
  constructor(config) {
    this.config = {
      width: config.width,
      height: config.height,
      playerSpeed: config.playerSpeed || 200,
      tagGracePeriod: config.tagGracePeriod || 2000,
      spawnProtection: config.spawnProtection || 50,
      tickRate: 0.05, // Fixed 50ms tick
    };
    this.players = new Map();
  }

  /**
   * Adds a new player.
   * Ensures at least one hunter exists.
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
      lastCaughtTime: -1, // Time they were tagged by a hunter
      spawnTime: -1, // Time they appeared at center as a new hunter
    });
  }

  /**
   * Removes a player and ensures a hunter replacement if needed.
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
      const p = this.players.get(firstId);
      p.role = 1;
      p.spawnTime = -1; // Initial hunter has no spawn protection
    }
  }

  /**
   * Processes vector input with boundary clamping and shared physics.
   */
  processInput(id, payload) {
    if (false === Array.isArray(payload)) return;
    if (4 !== payload.length) return;

    const [type, seq, vx, vy] = payload;
    if (1 !== type) return;

    const player = this.players.get(id);
    if (undefined === player) return;
    if (seq <= player.lastInputSeq) return;

    const vector = {
      x: Math.max(-1, Math.min(1, vx)),
      y: Math.max(-1, Math.min(1, vy)),
    };

    const result = applyInput(
      { x: player.x, y: player.y },
      vector,
      this.config.playerSpeed,
      this.config.tickRate,
      { width: this.config.width, height: this.config.height }
    );

    player.x = result.x;
    player.y = result.y;
    player.lastInputSeq = seq;
  }

  /**
   * Resolves collisions based on Hunter/Prey roles and temporal protections.
   *
   * @param {Array<[string, string]>} pairs
   * @param {number} currentTime
   */
  resolveCollisions(pairs, currentTime) {
    const events = [];

    pairs.forEach(([idA, idB]) => {
      const pA = this.players.get(idA);
      const pB = this.players.get(idB);

      if (undefined === pA || undefined === pB) return;

      // Identity identification
      const hunterId = 1 === pA.role ? idA : 1 === pB.role ? idB : null;
      const preyId = 0 === pA.role ? idA : 0 === pB.role ? idB : null;

      if (null === hunterId || null === preyId) return;

      const hunter = this.players.get(hunterId);
      const prey = this.players.get(preyId);

      // 1. Rule: New Hunters have 50ms "Spawn Protection" (cannot tag others)
      if (
        0 < hunter.spawnTime &&
        currentTime - hunter.spawnTime < this.config.spawnProtection
      ) {
        return;
      }

      // 2. Rule: New Prey have 2000ms "Grace Period" (cannot be tagged by the new hunter)
      if (
        0 < prey.lastCaughtTime &&
        currentTime - prey.lastCaughtTime < this.config.tagGracePeriod
      ) {
        return;
      }

      // --- VALID TAG EVENT ---

      // Update Hunter (who caught someone)
      hunter.role = 0;
      hunter.score += 15;
      hunter.lastCaughtTime = currentTime; // Now they are prey

      // Update Prey (who was caught)
      prey.role = 1;
      prey.spawnTime = currentTime; // Now they are the hunter at spawn
      prey.x = this.config.width / 2;
      prey.y = this.config.height / 2;

      events.push([2, hunterId, preyId, preyId, currentTime]);
    });

    return events;
  }

  /**
   * Snapshot includes roles and scores.
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
