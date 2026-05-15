import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager } from './StateManager.js';

describe('StateManager (Phase 4 Finalization)', () => {
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

  it('should automatically assign the "hunter" role to the first player', () => {
    stateManager.addPlayer('uuid-1');
    const snapshot = stateManager.getSnapshot();
    expect(snapshot[0][4]).toBe(1); // Role 1 = Hunter
  });

  it('should resolve a collision between Hunter and Prey correctly', () => {
    stateManager.addPlayer('h1'); // Becomes hunter
    stateManager.addPlayer('p1'); // Becomes prey

    const events = stateManager.resolveCollisions([['h1', 'p1']], 1000);

    // 1. Roles swapped?
    expect(stateManager.players.get('h1').role).toBe(0); // h1 is now prey
    expect(stateManager.players.get('p1').role).toBe(1); // p1 is now hunter

    // 2. Score awarded?
    expect(stateManager.players.get('h1').score).toBe(15); // Hunter who caught prey gets points

    // 3. Teleport happened?
    expect(stateManager.players.get('p1').x).toBe(400); // Caught player (now hunter) teleports

    // 4. Event schema correct? [2, hunter, prey, new_it, time]
    expect(events[0]).toEqual([2, 'h1', 'p1', 'p1', 1000]);
  });

  it('should prevent immediate tag-back (2000ms Grace Period)', () => {
    stateManager.addPlayer('h1');
    stateManager.addPlayer('p1');

    // T=1000: h1 tags p1. p1 is now the hunter.
    stateManager.resolveCollisions([['h1', 'p1']], 1000);

    // T=2000: p1 (new hunter) tries to tag h1 (new prey). 1000ms < 2000ms.
    const failEvents = stateManager.resolveCollisions([['p1', 'h1']], 2000);
    expect(failEvents.length).toBe(0);
    expect(stateManager.players.get('p1').role).toBe(1); // Still hunter
  });

  it('should allow tag-back after 2000ms', () => {
    stateManager.addPlayer('h1');
    stateManager.addPlayer('p1');

    stateManager.resolveCollisions([['h1', 'p1']], 1000);

    // T=3001: p1 tags h1. 2001ms > 2000ms.
    const successEvents = stateManager.resolveCollisions([['p1', 'h1']], 3001);
    expect(successEvents.length).toBe(1);
    expect(stateManager.players.get('h1').role).toBe(1); // Swapped back
  });

  it('should enforce 50ms spawn protection for new hunters', () => {
    stateManager.addPlayer('h1'); // Hunter
    stateManager.addPlayer('p1'); // Prey
    stateManager.addPlayer('p2'); // Second Prey at center

    stateManager.players.get('p2').x = 400;
    stateManager.players.get('p2').y = 300;

    // T=1000: h1 tags p1. p1 becomes hunter and teleports onto p2.
    stateManager.resolveCollisions([['h1', 'p1']], 1000);

    // T=1020: p1 attempts to tag p2. 20ms < 50ms protection.
    const immuneEvents = stateManager.resolveCollisions([['p1', 'p2']], 1020);
    expect(immuneEvents.length).toBe(0);

    // T=1060: p1 can now tag p2. 60ms > 50ms.
    const validEvents = stateManager.resolveCollisions([['p1', 'p2']], 1060);
    expect(validEvents.length).toBe(1);
  });
});
