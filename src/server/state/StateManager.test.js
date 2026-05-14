import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './StateManager.js';

describe('StateManager (2.1)', () => {
  let stateManager;
  const WIDTH = 800;
  const HEIGHT = 600;

  beforeEach(() => {
    stateManager = new StateManager({ width: WIDTH, height: HEIGHT });
  });

  it('should add and remove players correctly', () => {
    stateManager.addPlayer('uuid-1');
    expect(stateManager.getSnapshot().length).toBe(1);

    stateManager.removePlayer('uuid-1');
    expect(stateManager.getSnapshot().length).toBe(0);
  });

  it('should clamp positions to the 800x600 arena boundaries', () => {
    stateManager.addPlayer('uuid-1');

    // Test Left/Top boundary (0,0)
    stateManager.updatePlayerPosition('uuid-1', [1, -50, -10]);
    let snapshot = stateManager.getSnapshot();
    expect(snapshot[0][1]).toBe(0); // x
    expect(snapshot[0][2]).toBe(0); // y

    // Test Right/Bottom boundary (800,600)
    stateManager.updatePlayerPosition('uuid-1', [1, 850, 650]);
    snapshot = stateManager.getSnapshot();
    expect(snapshot[0][1]).toBe(800); // x
    expect(snapshot[0][2]).toBe(600); // y
  });

  it('should ignore updates for non-existent players', () => {
    stateManager.updatePlayerPosition('ghost-id', [1, 100, 100]);
    expect(stateManager.getSnapshot().length).toBe(0);
  });

  it('should ignore malformed payloads', () => {
    stateManager.addPlayer('uuid-1');
    const initialSnapshot = stateManager.getSnapshot();

    // Malformed: not an array
    stateManager.updatePlayerPosition('uuid-1', null);
    // Malformed: missing values
    stateManager.updatePlayerPosition('uuid-1', [1]);

    expect(stateManager.getSnapshot()).toEqual(initialSnapshot);
  });

  it('should return a correctly formatted flat array snapshot', () => {
    stateManager.addPlayer('uuid-1');
    stateManager.updatePlayerPosition('uuid-1', [1, 400, 300]);

    const snapshot = stateManager.getSnapshot();
    // [ [id, x, y] ]
    expect(Array.isArray(snapshot)).toBe(true);
    expect(snapshot[0]).toEqual(['uuid-1', 400, 300]);
  });
});
