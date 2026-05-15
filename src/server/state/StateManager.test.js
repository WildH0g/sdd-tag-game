import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager } from './StateManager.js';

describe('StateManager (2.1 - Roles & Scores)', () => {
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
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should automatically assign the "hunter" role to the first player', () => {
    stateManager.addPlayer('uuid-1');
    const snapshot = stateManager.getSnapshot();
    // [ID, X, Y, Seq, Role, Score]
    expect(snapshot[0][4]).toBe(1); // Role 1 = Hunter
  });

  it('should resolve a collision between Hunter and Prey', () => {
    stateManager.addPlayer('hunter-id'); // Becomes hunter
    stateManager.addPlayer('prey-id'); // Becomes prey

    // Initial roles
    expect(stateManager.players.get('hunter-id').role).toBe(1);
    expect(stateManager.players.get('prey-id').role).toBe(0);

    const currentTime = 1000;
    const pairs = [['hunter-id', 'prey-id']];

    const events = stateManager.resolveCollisions(pairs, currentTime);

    // Verify Role Swap
    expect(stateManager.players.get('hunter-id').role).toBe(0);
    expect(stateManager.players.get('prey-id').role).toBe(1);

    // Verify Score (+15 for the successful hunter)
    expect(stateManager.players.get('hunter-id').score).toBe(15);

    // Verify Teleport (Prey was teleported to center)
    expect(stateManager.players.get('prey-id').x).toBe(400);
    expect(stateManager.players.get('prey-id').y).toBe(300);

    // Verify Event Output
    expect(events.length).toBe(1);
    expect(events[0]).toEqual([2, 'hunter-id', 'prey-id', 'prey-id', 1000]);
  });

  it('should enforce a 2000ms grace period to prevent immediate tag-backs', () => {
    stateManager.addPlayer('p1'); // Hunter
    stateManager.addPlayer('p2'); // Prey

    // P1 tags P2 at T=1000
    stateManager.resolveCollisions([['p1', 'p2']], 1000);
    expect(stateManager.players.get('p2').role).toBe(1); // P2 is now hunter

    // P2 attempts to tag P1 back at T=2000 (1000ms later < 2000ms)
    const failEvents = stateManager.resolveCollisions([['p2', 'p1']], 2000);

    expect(failEvents.length).toBe(0);
    expect(stateManager.players.get('p2').role).toBe(1); // Roles should NOT swap back
    expect(stateManager.players.get('p1').role).toBe(0);
  });

  it('should allow tagging after the grace period has expired', () => {
    stateManager.addPlayer('p1'); // Hunter
    stateManager.addPlayer('p2'); // Prey

    stateManager.resolveCollisions([['p1', 'p2']], 1000);

    // T=3001 (2001ms later > 2000ms)
    const successEvents = stateManager.resolveCollisions([['p2', 'p1']], 3001);

    expect(successEvents.length).toBe(1);
    expect(stateManager.players.get('p1').role).toBe(1); // Swapped back
  });

  it('should ignore collisions between two hunters', () => {
    stateManager.addPlayer('h1');
    stateManager.players.get('h1').role = 1;
    stateManager.addPlayer('h2');
    stateManager.players.get('h2').role = 1;

    const events = stateManager.resolveCollisions([['h1', 'h2']], 5000);
    expect(events.length).toBe(0);
  });

  it('should return a 6-element record in the expanded snapshot', () => {
    stateManager.addPlayer('p1');
    const snapshot = stateManager.getSnapshot();
    // [ID, X, Y, Seq, Role, Score]
    expect(snapshot[0].length).toBe(6);
  });
});
