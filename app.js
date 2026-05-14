import express from 'express';
import { createServer } from 'node:http';
import { NetworkManager } from './src/server/network/NetworkManager.js';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Static file serving for Phase 4
app.use(express.static('public'));

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const networkManager = new NetworkManager({
  port: PORT,
  onClientConnect: (id) => logger.info({ clientId: id }, 'Client connected'),
  onClientDisconnect: (id) =>
    logger.info({ clientId: id }, 'Client disconnected'),
  onClientMessage: (id, payload) =>
    logger.debug({ clientId: id, payload }, 'Message received'),
});

// Note: In Phase 1, we share the same PORT for HTTP and WS.
// NetworkManager currently creates its own WebSocketServer on the same port.
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
