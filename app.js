import express from 'express';
import { createServer } from 'node:http';
import { NetworkManager } from './src/server/network/NetworkManager.js';
import { StateManager } from './src/server/state/StateManager.js';
import { GameLoop } from './src/server/engine/GameLoop.js';
import { CollisionEngine } from './src/server/engine/CollisionEngine.js';
import pino from 'pino';

const isProduction = 'production' === process.env.NODE_ENV;
const logger = pino(
  isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
        },
        level: 'debug',
      }
);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Arena Config
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;

// Static file serving for Phase 4
app.use(express.static('public'));
// Expose client logic modules
app.use('/src/client', express.static('src/client'));
// Expose shared modules
app.use('/src/shared', express.static('src/shared'));

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const stateManager = new StateManager({
  width: ARENA_WIDTH,
  height: ARENA_HEIGHT,
});
const collisionEngine = new CollisionEngine({ padding: 2 });

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

// Competitive Loop Override
const originalTick = gameLoop._tick.bind(gameLoop);
gameLoop._tick = () => {
  const serverTime = performance.now();

  // 1. Evaluate Physics
  const entities = Array.from(stateManager.players.entries()).map(
    ([id, p]) => ({
      id,
      x: p.x,
      y: p.y,
      size: 24,
    })
  );

  const pairs = collisionEngine.evaluate(entities);

  // 2. Resolve Competitive State
  const tagEvents = stateManager.resolveCollisions(pairs, serverTime);

  // 3. Broadcast Events (Phase 3.1)
  tagEvents.forEach((event) => {
    logger.info({ event }, 'Tag Event Triggered');
    networkManager.broadcast(event);
  });

  // 4. Standard Tick (Snapshot)
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
