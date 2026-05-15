/**
 * Manages local keyboard state and polls at 20Hz for server transmission.
 * Maintains a PendingQueue for Client-Side Prediction and Reconciliation.
 */
export class InputManager {
  /**
   * @param {Object} config
   * @param {Function} config.onInputPolled - Callback triggered every 50ms with (inputRecord).
   * @param {Object} [config.eventTarget] - The DOM element to listen to (e.g. window).
   * @param {number} [config.pollRate=50] - Polling interval in ms.
   */
  constructor(config) {
    this.config = config;
    this.eventTarget =
      config.eventTarget ||
      ('undefined' !== typeof globalThis.window ? globalThis.window : null);
    this.pollRate = config.pollRate || 50;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
    this.pendingQueue = [];
    this.sequenceId = 0;
    this.intervalId = null;
  }

  /**
   * Starts keyboard listeners and the 20Hz polling loop.
   */
  start() {
    if (null !== this.intervalId) return;

    this._handleKey = (e) => {
      const isDown = 'keydown' === e.type;
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      const key = keyMap[e.key];
      if (undefined === key) return;

      this.keys[key] = isDown;
    };

    if (this.eventTarget) {
      this.eventTarget.addEventListener('keydown', this._handleKey);
      this.eventTarget.addEventListener('keyup', this._handleKey);
    }

    this.intervalId = setInterval(() => {
      this._poll();
    }, this.pollRate);
  }

  /**
   * Stops listeners and clears polling intervals.
   */
  stop() {
    if (null === this.intervalId) return;

    if (this.eventTarget) {
      this.eventTarget.removeEventListener('keydown', this._handleKey);
      this.eventTarget.removeEventListener('keyup', this._handleKey);
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Internal polling logic.
   * Calculates movement vectors based on active keys and increments sequence.
   * @private
   */
  _poll() {
    this.sequenceId++;

    let vx = 0;
    let vy = 0;

    if (this.keys.left) vx -= 1;
    if (this.keys.right) vx += 1;
    if (this.keys.up) vy -= 1;
    if (this.keys.down) vy += 1;

    // Payload: [Type, Seq, VecX, VecY]
    const inputRecord = [1, this.sequenceId, vx, vy];

    this.pendingQueue.push(inputRecord);

    if ('function' === typeof this.config.onInputPolled) {
      this.config.onInputPolled(inputRecord);
    }
  }

  /**
   * Returns a copy of the pending input queue for reconciliation.
   * @returns {Array}
   */
  getPendingQueue() {
    return [...this.pendingQueue];
  }

  /**
   * Discards inputs from the queue up to and including the acknowledged sequence.
   * @param {number} seq - The last sequence processed by the server.
   */
  acknowledge(seq) {
    this.pendingQueue = this.pendingQueue.filter((input) => {
      return input[1] > seq;
    });
  }
}
