/**
 * Orchestrates the authoritative server heartbeat.
 * Synchronizes StateManager snapshots with NetworkManager broadcasts at a fixed frequency.
 */
export class GameLoop {
  /**
   * @param {Object} config
   * @param {Object} config.stateManager - The SSOT.
   * @param {Object} config.networkManager - The I/O boundary.
   * @param {number} [config.tickRate=50] - The interval in ms (default 20Hz).
   */
  constructor(config) {
    this.stateManager = config.stateManager;
    this.networkManager = config.networkManager;
    this.tickRate = config.tickRate || 50;
    this.intervalId = null;
    this.sequenceId = 0;
  }

  /**
   * Starts the fixed-rate ticker.
   */
  start() {
    if (null !== this.intervalId) return;

    this.intervalId = setInterval(() => {
      this._tick();
    }, this.tickRate);
  }

  /**
   * Stops the ticker and resets sequence counters.
   */
  stop() {
    if (null === this.intervalId) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.sequenceId = 0;
  }

  /**
   * Internal tick execution.
   * Increments sequence, captures snapshot, and triggers broadcast.
   * @private
   */
  _tick() {
    this.sequenceId++;

    const snapshot = this.stateManager.getSnapshot();
    const serverTime = performance.now();

    // Flat Payload: [Sequence_ID, Server_Time, Snapshot]
    const broadcastPayload = [this.sequenceId, serverTime, snapshot];

    this.networkManager.broadcast(broadcastPayload);
  }
}
