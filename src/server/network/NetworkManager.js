import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

/**
 * @typedef {import('ws').WebSocket} WebSocket
 */

/**
 * Principal Network Architect responsible for isolating the game loop from raw network I/O.
 * Enforces strict backpressure handling and automated zombie connection pruning.
 */
export class NetworkManager {
  /**
   * @param {Object} config
   * @param {number} config.port - The port to bind the server to.
   * @param {Function} [config.onClientConnect] - Callback triggered with (clientId).
   * @param {Function} [config.onClientDisconnect] - Callback triggered with (clientId).
   * @param {Function} [config.onClientMessage] - Callback triggered with (clientId, payload).
   */
  constructor(config) {
    this.config = config;
    this.wss = null;
    this.clients = new Map();
    this.pingInterval = null;
    this.MAX_BUFFER = 10240; // 10KB Hard-limit for backpressure
    this.PING_MS = 30000; // 30s heartbeat
  }

  /**
   * Initializes the WebSocket server and starts the pruning interval.
   * @param {import('node:http').Server} [server] - Optional HTTP server to attach to.
   */
  start(server) {
    this.wss = new WebSocketServer(
      server ? { server } : { port: this.config.port }
    );
    this.wss.on('connection', (ws) => this._handleNewConnection(ws));

    this.pingInterval = setInterval(() => {
      this._pruneStaleConnections();
    }, this.PING_MS);
  }

  /**
   * Internal handler for new WebSocket connections.
   * @param {WebSocket} ws
   * @private
   */
  _handleNewConnection(ws) {
    const clientId = randomUUID();

    // Set identity flags for pruning logic
    ws.isAlive = true;
    ws.clientId = clientId;

    this.clients.set(clientId, ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });
    ws.on('message', (data) => this._handleMessage(clientId, data));
    ws.on('close', () => this._cleanupClient(clientId));
    ws.on('error', () => this._cleanupClient(clientId));

    // Send Handshake [0, Client_ID, Server_Time]
    this._send(ws, [0, clientId, performance.now()]);

    if ('function' === typeof this.config.onClientConnect) {
      this.config.onClientConnect(clientId);
    }
  }

  /**
   * Routes incoming messages to the provided callback.
   * @param {string} clientId
   * @param {Buffer|string} data
   * @private
   */
  _handleMessage(clientId, data) {
    if ('function' !== typeof this.config.onClientMessage) return;

    try {
      const payload = JSON.parse(data.toString());
      this.config.onClientMessage(clientId, payload);
    } catch (err) {
      // Ignore malformed payloads to protect loop integrity
    }
  }

  /**
   * Evaluates all active connections and terminates those that failed to respond.
   * @private
   */
  _pruneStaleConnections() {
    this.clients.forEach((ws, clientId) => {
      if (false === ws.isAlive) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }

  /**
   * Centralized secure send wrapper with backpressure checks.
   * @param {WebSocket} ws
   * @param {Array|Object} payload
   * @private
   */
  _send(ws, payload) {
    if (this.MAX_BUFFER < ws.bufferedAmount) return ws.terminate();
    if (1 !== ws.readyState) return; // 1 = OPEN

    ws.send(JSON.stringify(payload));
  }

  /**
   * Broadcasts a flat JSON payload to all healthy, connected clients.
   * @param {Array} flatPayload - The structured data to send.
   */
  broadcast(flatPayload) {
    this.clients.forEach((ws) => {
      this._send(ws, flatPayload);
    });
  }

  /**
   * Internal cleanup routine for disconnected clients.
   * @param {string} clientId
   * @private
   */
  _cleanupClient(clientId) {
    this.clients.delete(clientId);

    if ('function' === typeof this.config.onClientDisconnect) {
      this.config.onClientDisconnect(clientId);
    }
  }

  /**
   * Shuts down the server and clears all intervals.
   */
  shutdown() {
    clearInterval(this.pingInterval);
    if (null !== this.wss) {
      this.wss.close();
    }
    this.clients.forEach((ws) => ws.terminate());
    this.clients.clear();
  }
}
