/**
 * Authoritative Single Source of Truth (SSOT) for the game state.
 * Enforces strict spatial boundaries and manages entity lifecycles.
 */
export class StateManager {
  /**
   * @param {Object} config
   * @param {number} config.width - Arena width boundary.
   * @param {number} config.height - Arena height boundary.
   */
  constructor(config) {
    this.config = config;
    this.players = new Map();
  }

  /**
   * Adds a new player to the state with default coordinates (center of arena).
   * @param {string} id - The unique UUID from NetworkManager.
   */
  addPlayer(id) {
    this.players.set(id, {
      x: this.config.width / 2,
      y: this.config.height / 2,
    });
  }

  /**
   * Removes a player from the state.
   * @param {string} id - The unique UUID.
   */
  removePlayer(id) {
    this.players.delete(id);
  }

  /**
   * Processes a movement delta from a client.
   * Enforces strict boundary clamping immediately.
   * @param {string} id - The unique UUID.
   * @param {Array} payload - The flat payload [Message_Type, X, Y].
   */
  updatePlayerPosition(id, payload) {
    if (false === Array.isArray(payload)) return;
    if (3 !== payload.length) return;

    const player = this.players.get(id);
    if (undefined === player) return;

    const [type, rawX, rawY] = payload;
    if (1 !== type) return; // Type 1 = Position Update
    if (false === Number.isFinite(rawX) || false === Number.isFinite(rawY))
      return;

    // Authority: Clamp to arena boundaries
    player.x = Math.max(0, Math.min(this.config.width, rawX));
    player.y = Math.max(0, Math.min(this.config.height, rawY));
  }

  /**
   * Returns a flat array of all player records for the 20Hz broadcast.
   * Format: [[Client_ID, X, Y], ...]
   * @returns {Array<Array>}
   */
  getSnapshot() {
    const snapshot = [];
    this.players.forEach((data, id) => {
      snapshot.push([id, data.x, data.y]);
    });
    return snapshot;
  }
}
