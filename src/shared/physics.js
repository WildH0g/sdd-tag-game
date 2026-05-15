/**
 * @typedef {Object} Vector2
 * @property {number} x - The X axis component (-1, 0, 1).
 * @property {number} y - The Y axis component (-1, 0, 1).
 */

/**
 * @typedef {Object} Bounds
 * @property {number} width - Maximum X boundary.
 * @property {number} height - Maximum Y boundary.
 */

/**
 * Applies a movement vector to a position over a given time delta,
 * enforcing strict AABB boundary clamping.
 * This is a pure function to guarantee deterministic outcomes on both client and server.
 *
 * @param {Vector2} position - The current {x, y} position.
 * @param {Vector2} vector - The normalized input vector {x, y}.
 * @param {number} speed - The scalar speed in pixels per second.
 * @param {number} deltaTime - The elapsed time in seconds (e.g., 0.05 for 50ms).
 * @param {Bounds} bounds - The {width, height} limits of the arena.
 * @returns {Vector2} A new object representing the clamped {x, y} position.
 */
export function applyInput(position, vector, speed, deltaTime, bounds) {
  const movementX = vector.x * speed * deltaTime;
  const movementY = vector.y * speed * deltaTime;

  const rawX = position.x + movementX;
  const rawY = position.y + movementY;

  // Authority: Strict Clamping
  const clampedX = Math.max(0, Math.min(bounds.width, rawX));
  const clampedY = Math.max(0, Math.min(bounds.height, rawY));

  return {
    x: clampedX,
    y: clampedY,
  };
}
