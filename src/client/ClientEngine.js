/**
 * Master Client-Side Engine responsible for Prediction, Reconciliation, and Interpolation.
 * Driven by requestAnimationFrame for frame-perfect visual fluidity.
 */
export class ClientEngine {
  /**
   * @param {Object} config
   * @param {HTMLElement} config.arenaElement - The DOM container for the arena.
   * @param {Object} config.inputManager - The local input poller.
   * @param {Object} config.interpolationBuffer - The snapshot time-machine.
   * @param {Object} config.sharedPhysics - The pure shared movement logic.
   * @param {number} [config.renderDelayMs=100] - Temporal offset for interpolation.
   * @param {number} [config.snapThreshold=50] - Distance in px to force a hard-snap reconciliation.
   */
  constructor(config) {
    this.config = config;
    this.arenaElement = config.arenaElement;
    this.inputManager = config.inputManager;
    this.interpolationBuffer = config.interpolationBuffer;
    this.sharedPhysics = config.sharedPhysics;

    this.renderDelayMs = config.renderDelayMs || 100;
    this.snapThreshold = config.snapThreshold || 50;

    this.playerElements = new Map();
    this.myClientId = null;
    this.serverPosition = { x: 400, y: 300 };
    this.predictedPosition = { x: 400, y: 300 };
    this.serverTimeOffset = 0;
    this.isRunning = false;
  }

  /**
   * Synchronizes the client clock with the server timestamp from the handshake.
   * @param {number} serverTime
   */
  syncClock(serverTime) {
    this.serverTimeOffset = serverTime - performance.now();
  }

  /**
   * Sets the local player ID.
   * @param {string} id
   */
  setMyClientId(id) {
    this.myClientId = id;
  }

  /**
   * Starts the requestAnimationFrame loop.
   */
  start() {
    if (true === this.isRunning) return;
    this.isRunning = true;

    const frame = (time) => {
      if (false === this.isRunning) return;
      this._render(time);
      globalThis.requestAnimationFrame(frame);
    };

    globalThis.requestAnimationFrame(frame);
  }

  /**
   * Stops the loop and clears all DOM entity elements.
   */
  stop() {
    this.isRunning = false;
    this.playerElements.forEach((el) => el.remove());
    this.playerElements.clear();
  }

  /**
   * Internal render frame.
   * @param {number} timestamp
   * @private
   */
  _render(timestamp) {
    // timestamp from rAF is equivalent to performance.now()
    const serverNow = timestamp + this.serverTimeOffset;
    const renderTime = serverNow - this.renderDelayMs;

    // 1. Process Local Player (Prediction & Reconciliation)
    this._renderLocalPlayer();

    // 2. Process Remote Players (Interpolation)
    const interpData =
      this.interpolationBuffer.getInterpolationData(renderTime);
    if (null === interpData) return;

    this._renderRemotePlayers(interpData);
  }

  /**
   * Authoritative local player rendering via Client-Side Prediction.
   * @private
   */
  _renderLocalPlayer() {
    if (null === this.myClientId) return;

    // Start from last known authoritative server position
    let predictedX = this.serverPosition.x;
    let predictedY = this.serverPosition.y;

    // Replay all unacknowledged inputs
    const pendingInputs = this.inputManager.getPendingQueue();
    const bounds = { width: 800, height: 600 }; // TODO: Inject from config

    pendingInputs.forEach((input) => {
      const [type, seq, vx, vy] = input;
      const result = this.sharedPhysics.applyInput(
        { x: predictedX, y: predictedY },
        { x: vx, y: vy },
        200, // Speed: 200px/s
        0.05, // Fixed Delta: 50ms (Server Pulse)
        bounds
      );
      predictedX = result.x;
      predictedY = result.y;
    });

    this.predictedPosition = { x: predictedX, y: predictedY };
    this._updateEntityElement(this.myClientId, predictedX, predictedY, true);
  }

  /**
   * Smoothed remote entity rendering via Snapshot Interpolation.
   * @param {Object} interpData
   * @private
   */
  _renderRemotePlayers(interpData) {
    const { t1, t2, factor } = interpData;
    const remotePlayersT1 = t1[2].filter((p) => p[0] !== this.myClientId);
    const remotePlayersT2 = new Map(t2[2].map((p) => [p[0], p]));

    remotePlayersT1.forEach((p1) => {
      const id = p1[0];
      const p2 = remotePlayersT2.get(id);

      // If entity doesn't exist in second snapshot, freeze at first
      if (undefined === p2) {
        return this._updateEntityElement(id, p1[1], p1[2], false);
      }

      // Linear Interpolation (Lerp)
      const interX = p1[1] + (p2[1] - p1[1]) * factor;
      const interY = p1[2] + (p2[2] - p1[2]) * factor;

      this._updateEntityElement(id, interX, interY, false);
    });

    // Cleanup entities not in current snapshots
    const currentSnapshotIds = new Set(t1[2].map((p) => p[0]));
    this.playerElements.forEach((el, id) => {
      if (false === currentSnapshotIds.has(id)) {
        el.remove();
        this.playerElements.delete(id);
      }
    });
  }

  /**
   * Surgical DOM update using GPU-accelerated transforms.
   * @private
   */
  _updateEntityElement(id, x, y, isLocal) {
    let el = this.playerElements.get(id);

    if (undefined === el) {
      el = globalThis.document.createElement('div');
      el.className =
        'absolute w-6 h-6 rounded shadow-lg transition-colors duration-200';
      el.style.backgroundColor = true === isLocal ? '#3b82f6' : '#94a3b8';
      el.innerHTML = `<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 whitespace-nowrap">${id.split('-')[0]}</div>`;
      this.arenaElement.appendChild(el);
      this.playerElements.set(id, el);
    }

    // Hardware accelerated positioning (-12px to center 24px div)
    el.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
  }

  /**
   * Processes a new server snapshot for reconciliation.
   * @param {Array} snapshot
   */
  onSnapshotReceived(snapshot) {
    const [seq, time, players] = snapshot;
    const me = players.find((p) => p[0] === this.myClientId);

    if (undefined === me) return;

    const [id, sX, sY, lastAckSeq] = me;

    // 1. Reconciliation: Discard acknowledged inputs
    this.inputManager.acknowledge(lastAckSeq);

    // 2. Reconciliation: Update authoritative server position
    this.serverPosition = { x: sX, y: sY };

    // 3. Security: Check for excessive desync (Divergence Threshold)
    const dist = Math.hypot(
      this.predictedPosition.x - sX,
      this.predictedPosition.y - sY
    );
    if (dist > this.snapThreshold) {
      this.predictedPosition = { x: sX, y: sY };
      this._triggerGlitchEffect();
    }
  }

  /**
   * Visual feedback for hard-snap reconciliation.
   * @private
   */
  _triggerGlitchEffect() {
    const flash = globalThis.document.getElementById('flash-overlay');
    if (!flash) return;
    flash.style.opacity = '1';
    setTimeout(() => {
      flash.style.opacity = '0';
    }, 50);
  }
}
