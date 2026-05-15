import { describe, it, expect } from 'vitest';
import { applyInput } from './physics.js';

describe('Shared Physics Engine (1.1)', () => {
  const SPEED = 200; // 200px per second
  const DT = 0.05; // 50ms tick
  const BOUNDS = { width: 800, height: 600 };

  it('should move player linearly at the correct speed', () => {
    const pos = { x: 100, y: 100 };
    const vec = { x: 1, y: 0 }; // Moving Right

    const result = applyInput(pos, vec, SPEED, DT, BOUNDS);

    // 200px/s * 0.05s = 10px movement
    expect(result.x).toBe(110);
    expect(result.y).toBe(100);
  });

  it('should move player diagonally correctly', () => {
    const pos = { x: 100, y: 100 };
    const vec = { x: 1, y: 1 }; // Moving Down-Right

    const result = applyInput(pos, vec, SPEED, DT, BOUNDS);

    expect(result.x).toBe(110);
    expect(result.y).toBe(110);
  });

  it('should clamp movement to the Top-Left boundary (0,0)', () => {
    const pos = { x: 5, y: 5 };
    const vec = { x: -1, y: -1 }; // Moving Up-Left

    const result = applyInput(pos, vec, SPEED, DT, BOUNDS);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should clamp movement to the Bottom-Right boundary (800,600)', () => {
    const pos = { x: 795, y: 595 };
    const vec = { x: 1, y: 1 }; // Moving Down-Right

    const result = applyInput(pos, vec, SPEED, DT, BOUNDS);

    expect(result.x).toBe(800);
    expect(result.y).toBe(600);
  });

  it('should be a pure function and not mutate the input position object', () => {
    const pos = { x: 100, y: 100 };
    const vec = { x: 1, y: 0 };

    const result = applyInput(pos, vec, SPEED, DT, BOUNDS);

    expect(result).not.toBe(pos); // Should be a new reference
    expect(pos.x).toBe(100); // Input should be unchanged
  });
});
