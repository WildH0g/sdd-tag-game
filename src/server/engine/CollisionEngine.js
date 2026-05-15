/**
 * @typedef {Object} EntityRect
 * @property {string} id - Unique identifier.
 * @property {number} x - Center X coordinate.
 * @property {number} y - Center Y coordinate.
 * @property {number} size - Visual size (e.g., 24).
 */

/**
 * Pure mathematical engine for Axis-Aligned Bounding Box (AABB) detection.
 * Enforces "Forgiving Collision" via internal negative padding.
 */
export class CollisionEngine {
  /**
   * @param {Object} config
   * @param {number} [config.padding=2] - Negative padding in pixels.
   */
  constructor(config = {}) {
    this.padding = config.padding || 2;
  }

  /**
   * Evaluates a set of entities for collisions.
   * Performs O(N²) check (Broadphase not required for current scale).
   *
   * @param {Array<EntityRect>} entities
   * @returns {Array<[string, string]>} List of colliding ID pairs.
   */
  evaluate(entities) {
    const pairs = [];
    const count = entities.length;

    for (let i = 0; i < count; i++) {
      const a = entities[i];

      for (let j = i + 1; j < count; j++) {
        const b = entities[j];

        if (this._checkCollision(a, b)) {
          pairs.push([a.id, b.id]);
        }
      }
    }

    return pairs;
  }

  /**
   * Internal AABB check with negative padding.
   * @param {EntityRect} a
   * @param {EntityRect} b
   * @returns {boolean}
   * @private
   */
  _checkCollision(a, b) {
    // Visual size - 2 * padding = Logical size
    const halfA = (a.size - 2 * this.padding) / 2;
    const halfB = (b.size - 2 * this.padding) / 2;

    const distX = Math.abs(a.x - b.x);
    const distY = Math.abs(a.y - b.y);

    return distX < halfA + halfB && distY < halfA + halfB;
  }
}
