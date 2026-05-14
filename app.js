import express from 'express';
import { createServer } from 'node:http';
import { NetworkManager } from './src/server/network/NetworkManager.js';
import { StateManager } from './src/server/state/StateManager.js';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
  level: 'debug',
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Arena Config
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;

// Static file serving for Phase 4
app.use(express.static('public'));

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const stateManager = new StateManager({
  width: ARENA_WIDTH,
  height: ARENA_HEIGHT,
});

const networkManager = new NetworkManager({
  port: PORT,
  onClientConnect: (id) => {
    stateManager.addPlayer(id);
    logger.info({ clientId: id }, 'Client connected');
  },
  onClientDisconnect: (id) => {
    stateManager.removePlayer(id);
    logger.info({ clientId: id }, 'Client disconnected');
  },
  onClientMessage: (id, payload) => {
    stateManager.updatePlayerPosition(id, payload);
    const snapshot = stateManager.getSnapshot();
    logger.debug({ clientId: id, snapshot }, 'State Updated');
  },
});

// For Cloud Run, we attach WS to the HTTP server to share the same port.
networkManager.start(server);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  networkManager.shutdown();
  server.close();
});
