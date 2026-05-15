import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './StateManager.js';

describe('StateManager (1.2 - Vectors & Sequences)', () => {
  /** @type {StateManager} */
  let stateManager;
  const WIDTH = 800;
  const HEIGHT = 600;
  const SPEED = 200;

  beforeEach(() => {
    stateManager = new StateManager({
      width: WIDTH,
      height: HEIGHT,
      playerSpeed: SPEED,
    });
  });

  it('should process vector-based movement and update position', () => {
    stateManager.addPlayer('uuid-1');
    // Payload: [Type, Seq, VecX, VecY]
    // 1 tick = 50ms = 0.05s
    // 200px/s * 0.05s = 10px
    stateManager.processInput('uuid-1', [1, 10, 1, 0]); // Move Right

    const snapshot = stateManager.getSnapshot();
    // Default start is (400, 300). Move right 10px -> (410, 300)
    expect(snapshot[0][1]).toBe(410);
    expect(snapshot[0][2]).toBe(300);
  });

  it('should track and return the last processed sequence ID', () => {
    stateManager.addPlayer('uuid-1');
    stateManager.processInput('uuid-1', [1, 105, 0, 1]); // Move Down

    const snapshot = stateManager.getSnapshot();
    expect(snapshot[0][3]).toBe(105);
  });

  it('should reject out-of-order (older) sequence IDs', () => {
    stateManager.addPlayer('uuid-1');
    stateManager.processInput('uuid-1', [1, 100, 1, 0]);

    const midSnapshot = stateManager.getSnapshot();
    expect(midSnapshot[0][1]).toBe(410);

    // Old sequence (99 < 100)
    stateManager.processInput('uuid-1', [1, 99, -1, 0]);

    const finalSnapshot = stateManager.getSnapshot();
    expect(finalSnapshot[0][1]).toBe(410); // Position should NOT change
    expect(finalSnapshot[0][3]).toBe(100); // Seq should NOT revert
  });

  it('should return a 4-element player record in snapshots', () => {
    stateManager.addPlayer('uuid-1');
    const snapshot = stateManager.getSnapshot();
    // [ID, X, Y, Seq]
    expect(snapshot[0].length).toBe(4);
  });

  it('should still enforce boundary clamping during vector movement', () => {
    stateManager.addPlayer('uuid-1');
    // Default (400, 300). Move way out of bounds.
    // We'll simulate 100 inputs to hit the wall or just verify logic.
    // To keep it simple, we check that it doesn't cross 0.

    // Position (400, 300). Move Left (-1) many times.
    // Since we are testing StateManager in isolation, we can just call it repeatedly.
    for (let i = 0; 100 > i; i++) {
      stateManager.processInput('uuid-1', [1, i, -1, 0]);
    }

    const snapshot = stateManager.getSnapshot();
    expect(snapshot[0][1]).toBeGreaterThanOrEqual(0);
  });
});
