import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientEngine } from './ClientEngine.js';

describe('ClientEngine (3.1)', () => {
  let engine;
  let mockArena;
  let mockInputManager;
  let mockBuffer;
  let mockPhysics;

  beforeEach(() => {
    vi.useFakeTimers();

    mockArena = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    mockInputManager = {
      getPendingQueue: vi.fn(() => []),
      acknowledge: vi.fn(),
    };

    mockBuffer = {
      push: vi.fn(),
      prune: vi.fn(),
      getInterpolationData: vi.fn(() => null),
    };

    mockPhysics = {
      applyInput: vi.fn((pos, vec, speed, dt, bounds) => ({
        x: pos.x + vec.x * speed * dt,
        y: pos.y + vec.y * speed * dt,
      })),
    };

    engine = new ClientEngine({
      arenaElement: mockArena,
      inputManager: mockInputManager,
      interpolationBuffer: mockBuffer,
      sharedPhysics: mockPhysics,
      renderDelayMs: 100,
      snapThreshold: 50,
    });

    // Mock global APIs
    vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => setTimeout(() => cb(performance.now()), 16))
    );
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        style: {},
        className: '',
        innerHTML: '',
        remove: vi.fn(),
      })),
      getElementById: vi.fn(() => ({
        style: {},
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should predict local player movement using pending input queue', () => {
    engine.setMyClientId('me');
    engine.serverPosition = { x: 400, y: 300 };
    engine.predictedPosition = { x: 400, y: 300 };

    // One pending input: Move Right (+1 on X)
    mockInputManager.getPendingQueue.mockReturnValue([[1, 10, 1, 0]]);

    // Manually trigger one render frame
    engine._render(1000);

    const me = engine.playerElements.get('me');
    expect(me).toBeDefined();
    // 400 + (1 * 200 * 0.05) = 410. Centered: 410 - 12 = 398
    expect(me.style.transform).toBe('translate3d(398px, 288px, 0)');
  });

  it('should interpolate remote players based on render time', () => {
    engine.setMyClientId('me');

    // Mock interpolation data for a remote player 'them'
    // T1=900 (Pos 0,0), T2=950 (Pos 100,100), factor=0.5 (RenderTime=925)
    mockBuffer.getInterpolationData.mockReturnValue({
      t1: [1, 900, [['them', 0, 0, 0, 0, 0]]],
      t2: [2, 950, [['them', 100, 100, 0, 0, 0]]],
      factor: 0.5,
    });

    // Current time 1025 -> RenderTime 925 (1025 - 100 delay)
    engine._render(1025);

    const them = engine.playerElements.get('them');
    expect(them).toBeDefined();
    // (0 + 100) * 0.5 = 50. Centered: 50 - 12 = 38
    expect(them.style.transform).toBe('translate3d(38px, 38px, 0)');
  });

  it('should perform a hard snap if desync exceeds 50px threshold', () => {
    engine.setMyClientId('me');
    engine.predictedPosition = { x: 100, y: 100 };
    engine.serverPosition = { x: 100, y: 100 };

    // Server snapshot at 160, 100 (Delta 60 > Threshold 50)
    const snapshot = [10, 1000, [['me', 160, 100, 9, 0, 0]]];

    engine.onSnapshotReceived(snapshot);

    // Assert: Client snaps position to server's
    expect(engine.predictedPosition.x).toBe(160);
    expect(engine.serverPosition.x).toBe(160);
  });

  it('should reconcile smoothly if desync is within threshold (<= 50px)', () => {
    engine.setMyClientId('me');
    engine.predictedPosition = { x: 100, y: 100 };
    engine.serverPosition = { x: 100, y: 100 };

    // Server snapshot at 140, 100 (Delta 40 < Threshold 50)
    const snapshot = [10, 1000, [['me', 140, 100, 9, 0, 0]]];

    engine.onSnapshotReceived(snapshot);

    // Assert: Server position updated but prediction is NOT hard-snapped
    expect(engine.serverPosition.x).toBe(140);
    expect(engine.predictedPosition.x).toBe(100);
  });

  it('should reconcile and replay pending inputs on snapshot arrival', () => {
    engine.setMyClientId('me');
    engine.serverPosition = { x: 400, y: 300 };

    // Snapshot acknowledges up to input Seq 5
    const snapshot = [100, 5000, [['me', 410, 300, 5, 0, 0]]];

    engine.onSnapshotReceived(snapshot);

    expect(mockInputManager.acknowledge).toHaveBeenCalledWith(5);
    expect(engine.serverPosition.x).toBe(410);
  });
});
