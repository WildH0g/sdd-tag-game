import express from 'express';
import { createServer } from 'node:http';
import { NetworkManager } from './src/server/network/NetworkManager.js';
import { StateManager } from './src/server/state/StateManager.js';
import { GameLoop } from './src/server/engine/GameLoop.js';
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
    stateManager.processInput(id, payload);
  },
});

const gameLoop = new GameLoop({
  stateManager,
  networkManager,
  tickRate: 50, // 20Hz
});

// Throttle heartbeat logging to once per 100 ticks (5 seconds)
let tickCount = 0;
const originalTick = gameLoop._tick.bind(gameLoop);
gameLoop._tick = () => {
  tickCount++;
  if (100 <= tickCount) {
    logger.debug('Heartbeat: 100 ticks processed');
    tickCount = 0;
  }
  originalTick();
};

// For Cloud Run, we attach WS to the HTTP server to share the same port.
networkManager.start(server);
gameLoop.start();

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  gameLoop.stop();
  networkManager.shutdown();
  server.close();
});
