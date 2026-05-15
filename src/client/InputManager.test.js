import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager.js';

describe('InputManager (2.1)', () => {
  let inputManager;
  let mockOnInputPolled;
  let mockEventTarget;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnInputPolled = vi.fn();
    mockEventTarget = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    inputManager = new InputManager({
      onInputPolled: mockOnInputPolled,
      pollRate: 50,
      eventTarget: mockEventTarget,
    });
  });

  afterEach(() => {
    inputManager.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should poll at the correct cadence (20Hz)', () => {
    inputManager.start();

    vi.advanceTimersByTime(50);
    expect(mockOnInputPolled).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(50);
    expect(mockOnInputPolled).toHaveBeenCalledTimes(2);
  });

  it('should generate correct movement vectors based on keys', () => {
    inputManager.start();

    // Mock key states (we'll implement this via listeners in production)
    inputManager.keys.right = true;
    inputManager.keys.down = true;

    vi.advanceTimersByTime(50);
    const input = mockOnInputPolled.mock.calls[0][0];

    // Payload: [Type, Seq, VecX, VecY]
    expect(input[2]).toBe(1); // X: Right
    expect(input[3]).toBe(1); // Y: Down
  });

  it('should increment sequence ID monotonically', () => {
    inputManager.start();

    vi.advanceTimersByTime(50);
    expect(mockOnInputPolled.mock.calls[0][0][1]).toBe(1);

    vi.advanceTimersByTime(50);
    expect(mockOnInputPolled.mock.calls[1][0][1]).toBe(2);
  });

  it('should maintain a pending queue and support sequence acknowledgement', () => {
    inputManager.start();

    // Generate 3 inputs
    vi.advanceTimersByTime(150);
    expect(inputManager.getPendingQueue().length).toBe(3);
    expect(inputManager.getPendingQueue()[0][1]).toBe(1); // Seq 1

    // Acknowledge Seq 2
    inputManager.acknowledge(2);

    const remaining = inputManager.getPendingQueue();
    expect(remaining.length).toBe(1);
    expect(remaining[0][1]).toBe(3); // Only Seq 3 remains
  });

  it('should attach listeners to the event target on start', () => {
    inputManager.start();
    expect(mockEventTarget.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
    expect(mockEventTarget.addEventListener).toHaveBeenCalledWith(
      'keyup',
      expect.any(Function)
    );
  });

  it('should remove listeners from the event target on stop', () => {
    inputManager.start();
    inputManager.stop();
    expect(mockEventTarget.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
    expect(mockEventTarget.removeEventListener).toHaveBeenCalledWith(
      'keyup',
      expect.any(Function)
    );
  });
});
