/**
 * Manages a temporal buffer of server snapshots to enable smooth linear interpolation.
 * Masks network jitter by rendering the game state in the past.
 */
export class InterpolationBuffer {
  /**
   * @param {Object} [config]
   * @param {number} [config.maxBufferSize=100] - Max snapshots to store before pruning.
   * @param {number} [config.pruneThresholdMs=200] - Age in ms at which snapshots are pruned.
   */
  constructor(config = {}) {
    this.maxBufferSize = config.maxBufferSize || 100;
    this.pruneThresholdMs = config.pruneThresholdMs || 200;
    this.buffer = [];
  }

  /**
   * Pushes a new snapshot into the buffer and maintains sort order by Server_Time.
   * @param {Array} snapshot - [Seq, Time, Players]
   */
  push(snapshot) {
    this.buffer.push(snapshot);

    // Maintain chronological order by Server_Time (Index 1)
    this.buffer.sort((a, b) => a[1] - b[1]);

    // Enforce physical buffer constraints
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /**
   * Prunes snapshots older than the threshold relative to the current server time.
   * @param {number} currentServerTime
   */
  prune(currentServerTime) {
    const threshold = currentServerTime - this.pruneThresholdMs;

    this.buffer = this.buffer.filter((snapshot) => {
      return snapshot[1] >= threshold;
    });
  }

  /**
   * Retrieves the two closest snapshots and the interpolation factor for a given render time.
   *
   * @param {number} renderTime - The target time to render (e.g., ServerNow - 100ms).
   * @returns {Object|null} { t1, t2, factor } where factor is 0-1. Returns null if underrun.
   */
  getInterpolationData(renderTime) {
    if (2 > this.buffer.length) return null;

    const newestTime = this.buffer[this.buffer.length - 1][1];
    const oldestTime = this.buffer[0][1];

    // Starvation Guard: renderTime is in the future relative to our newest data
    if (renderTime > newestTime) return null;

    // Bounds Guard: renderTime is older than our buffer
    if (renderTime < oldestTime) return null;

    // Find the two snapshots that bracket the renderTime
    let t1 = null;
    let t2 = null;

    for (let i = 0; i < this.buffer.length - 1; i++) {
      const snap1 = this.buffer[i];
      const snap2 = this.buffer[i + 1];

      if (renderTime >= snap1[1] && renderTime <= snap2[1]) {
        t1 = snap1;
        t2 = snap2;
        break;
      }
    }

    if (null === t1 || null === t2) return null;

    // Calculate Lerp Factor: (renderTime - t1.time) / (t2.time - t1.time)
    const span = t2[1] - t1[1];
    const progress = renderTime - t1[1];
    const factor = 0 === span ? 0 : progress / span;

    return { t1, t2, factor };
  }
}
