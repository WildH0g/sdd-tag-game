/**
 * @typedef {Object} EntityRect
 * @property {string} id - Unique identifier.
 * @property {number} x - Center X coordinate.
 * @property {number} y - Center Y coordinate.
 * @property {number} [prevX] - Previous center X.
 * @property {number} [prevY] - Previous center Y.
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

        // Symmetric check: either A tunneled into B, or B tunneled into A (or they overlap)
        const isCollision =
          this._checkSweptCollision(a, b) || this._checkSweptCollision(b, a);

        if (isCollision) {
          pairs.push([a.id, b.id]);
        }
      }
    }

    return pairs;
  }

  /**
   * Internal Swept AABB check.
   * Checks if the movement segment of 'a' intersects the hitbox of 'b'.
   *
   * @param {EntityRect} a - The moving entity.
   * @param {EntityRect} b - The stationary/target entity.
   * @returns {boolean}
   * @private
   */
  _checkSweptCollision(a, b) {
    const halfA = (a.size - 2 * this.padding) / 2;
    const halfB = (b.size - 2 * this.padding) / 2;
    const combinedHalf = halfA + halfB;

    // 1. Initial Discrete Check (Overlap at T)
    const distX = Math.abs(a.x - b.x);
    const distY = Math.abs(a.y - b.y);
    if (distX < combinedHalf && distY < combinedHalf) return true;

    // 2. Swept Check (Only if previous position exists)
    if (undefined === a.prevX || undefined === a.prevY) return false;

    // Line segment (prevX, prevY) -> (x, y) vs AABB (bx, by, combinedHalf)
    return this._intersectSegmentAABB(
      a.prevX,
      a.prevY,
      a.x,
      a.y,
      b.x - combinedHalf,
      b.y - combinedHalf,
      b.x + combinedHalf,
      b.y + combinedHalf
    );
  }

  /**
   * Liang-Barsky line clipping algorithm for segment-AABB intersection.
   * @private
   */
  _intersectSegmentAABB(x0, y0, x1, y1, minX, minY, maxX, maxY) {
    let tMin = 0;
    let tMax = 1;
    const dx = x1 - x0;
    const dy = y1 - y0;

    // Check X axis
    if (0 !== dx) {
      const t1 = (minX - x0) / dx;
      const t2 = (maxX - x0) / dx;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (x0 < minX || x0 > maxX) return false;

    // Check Y axis
    if (0 !== dy) {
      const t1 = (minY - y0) / dy;
      const t2 = (maxY - y0) / dy;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (y0 < minY || y0 > maxY) return false;

    // Ensure segment range [0, 1] overlaps with intersection range [tMin, tMax]
    // Use an epsilon of 1e-6 to avoid precision errors on boundaries
    return tMin < tMax - 1e-6 && 1e-6 < tMax && tMin < 1 - 1e-6;
  }
}
