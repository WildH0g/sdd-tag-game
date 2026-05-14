import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from './GameLoop.js';

describe('GameLoop (3.1)', () => {
  let gameLoop;
  let mockStateManager;
  let mockNetworkManager;

  beforeEach(() => {
    vi.useFakeTimers();

    mockStateManager = {
      getSnapshot: vi.fn(() => [['uuid-1', 400, 300]]),
    };

    mockNetworkManager = {
      broadcast: vi.fn(),
    };

    gameLoop = new GameLoop({
      stateManager: mockStateManager,
      networkManager: mockNetworkManager,
      tickRate: 50,
    });
  });

  afterEach(() => {
    gameLoop.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should trigger broadcast at exactly 50ms intervals', () => {
    gameLoop.start();

    vi.advanceTimersByTime(50);
    expect(mockNetworkManager.broadcast).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(50);
    expect(mockNetworkManager.broadcast).toHaveBeenCalledTimes(2);
  });

  it('should increment sequence ID monotonically by 1 per tick', () => {
    gameLoop.start();

    vi.advanceTimersByTime(50);
    // Payload: [Sequence_ID, Server_Time, Snapshot]
    let payload = mockNetworkManager.broadcast.mock.calls[0][0];
    expect(payload[0]).toBe(1);

    vi.advanceTimersByTime(50);
    payload = mockNetworkManager.broadcast.mock.calls[1][0];
    expect(payload[0]).toBe(2);
  });

  it('should include high-resolution server time in the payload', () => {
    gameLoop.start();

    vi.advanceTimersByTime(50);
    const payload = mockNetworkManager.broadcast.mock.calls[0][0];
    expect(typeof payload[1]).toBe('number');
    expect(payload[1]).toBeGreaterThan(0);
  });

  it('should stop the interval and reset sequence when stop() is called', () => {
    gameLoop.start();
    vi.advanceTimersByTime(50);

    gameLoop.stop();
    vi.advanceTimersByTime(50);

    expect(mockNetworkManager.broadcast).toHaveBeenCalledTimes(1);
  });
});
