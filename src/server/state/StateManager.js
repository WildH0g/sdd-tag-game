import { applyInput } from '../../shared/physics.js';

/**
 * Authoritative Single Source of Truth (SSOT) for the game state.
 * Refactored for Phase 2 to support Vector-based movement and Sequence tracking.
 */
export class StateManager {
  /**
   * @param {Object} config
   * @param {number} config.width - Arena width.
   * @param {number} config.height - Arena height.
   * @param {number} [config.playerSpeed=200] - Movement speed in px/s.
   */
  constructor(config) {
    this.config = {
      width: config.width,
      height: config.height,
      playerSpeed: config.playerSpeed || 200,
      tickRate: 0.05, // Fixed 50ms tick
    };
    this.players = new Map();
  }

  /**
   * Adds a new player with zeroed sequence tracking.
   * @param {string} id
   */
  addPlayer(id) {
    this.players.set(id, {
      x: this.config.width / 2,
      y: this.config.height / 2,
      lastInputSeq: 0,
    });
  }

  /**
   * Removes a player from the state.
   * @param {string} id
   */
  removePlayer(id) {
    this.players.delete(id);
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
   * Returns a snapshot inclusive of last processed sequence.
   * Format: [[ID, X, Y, Last_Input_Seq], ...]
   * @returns {Array<Array>}
   */
  getSnapshot() {
    const snapshot = [];
    this.players.forEach((data, id) => {
      snapshot.push([id, data.x, data.y, data.lastInputSeq]);
    });
    return snapshot;
  }
}
