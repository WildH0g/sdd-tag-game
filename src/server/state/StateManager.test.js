import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager } from './StateManager.js';

describe('StateManager (2.2 - Zero GC)', () => {
  let stateManager;
  const WIDTH = 800;
  const HEIGHT = 600;

  beforeEach(() => {
    vi.useFakeTimers();
    stateManager = new StateManager({
      width: WIDTH,
      height: HEIGHT,
      playerSpeed: 200,
      tagGracePeriod: 2000,
      spawnProtection: 50,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return snapshot data with pre-allocated buffer integrity', () => {
    stateManager.addPlayer('p1');
    stateManager.processInput('p1', [1, 1, 1, 0]); // Seq 1, Move Right

    const snapshot = stateManager.getSnapshot();

    // Expect: [[ID, X, Y, Seq, Role, Score]]
    // Start X: 400 + (1 * 200 * 0.05) = 410
    expect(snapshot[0]).toEqual(['p1', 410, 300, 1, 1, 0]);
  });

  it('should update snapshot when player is removed', () => {
    stateManager.addPlayer('p1');
    stateManager.addPlayer('p2');
    stateManager.removePlayer('p1');

    const snapshot = stateManager.getSnapshot();
    expect(snapshot.length).toBe(1);
    expect(snapshot[0][0]).toBe('p2');
  });

  it('should maintain consistent data after multiple getSnapshot calls', () => {
    stateManager.addPlayer('p1');
    stateManager.processInput('p1', [1, 1, 1, 0]); // Move Right

    const snap1 = stateManager.getSnapshot();
    const snap2 = stateManager.getSnapshot();

    expect(snap1).toEqual(snap2);
    expect(snap1[0][1]).toBe(410);
  });
});
