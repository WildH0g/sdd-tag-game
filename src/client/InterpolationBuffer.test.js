import { describe, it, expect, beforeEach } from 'vitest';
import { InterpolationBuffer } from './InterpolationBuffer.js';

describe('InterpolationBuffer (2.2)', () => {
  let buffer;

  beforeEach(() => {
    buffer = new InterpolationBuffer({
      pruneThresholdMs: 200,
    });
  });

  it('should store snapshots and maintain chronological order', () => {
    buffer.push([2, 2000, []]);
    buffer.push([1, 1000, []]);

    // Sort by server time (index 1)
    expect(buffer.buffer[0][1]).toBe(1000);
    expect(buffer.buffer[1][1]).toBe(2000);
  });

  it('should calculate the correct interpolation factor between snapshots', () => {
    buffer.push([1, 1000, [['p1', 0, 0, 0]]]);
    buffer.push([2, 1050, [['p1', 100, 100, 0]]]);

    // Query exactly 50% between T=1000 and T=1050
    const data = buffer.getInterpolationData(1025);

    expect(data).not.toBeNull();
    expect(data.t1[1]).toBe(1000);
    expect(data.t2[1]).toBe(1050);
    expect(data.factor).toBe(0.5);
  });

  it('should prune snapshots older than the threshold', () => {
    buffer.push([1, 500, []]);
    buffer.push([2, 1000, []]);

    // Prune relative to T=1000 with 200ms threshold (removes < 800)
    buffer.prune(1000);

    expect(buffer.buffer.length).toBe(1);
    expect(buffer.buffer[0][1]).toBe(1000);
  });

  it('should handle buffer starvation by returning null if renderTime is in the future', () => {
    buffer.push([1, 1000, []]);
    buffer.push([2, 1050, []]);

    // renderTime 1100 is after our newest snapshot 1050
    const data = buffer.getInterpolationData(1100);
    expect(data).toBeNull();
  });

  it('should return null if there are fewer than 2 snapshots', () => {
    buffer.push([1, 1000, []]);
    expect(buffer.getInterpolationData(1000)).toBeNull();
  });
});
