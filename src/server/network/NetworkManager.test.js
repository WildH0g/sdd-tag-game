import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkManager } from './NetworkManager.js';
import { WebSocketServer } from 'ws';

// Mock ws correctly using a class
vi.mock('ws', () => {
  return {
    WebSocketServer: vi.fn(),
  };
});

describe('NetworkManager (1.1)', () => {
  let networkManager;
  let mockWssInstance;

  beforeEach(() => {
    vi.useFakeTimers();

    // Setup WSS mock instance
    mockWssInstance = {
      on: vi.fn(),
      close: vi.fn(),
      clients: new Set(),
    };

    // Use a function that returns the mock instance
    WebSocketServer.mockImplementation(function () {
      return mockWssInstance;
    });

    networkManager = new NetworkManager({
      port: 8080,
      onClientConnect: vi.fn(),
      onClientDisconnect: vi.fn(),
      onClientMessage: vi.fn(),
    });

    networkManager.start();
  });

  afterEach(() => {
    networkManager.shutdown();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should generate a unique ID and send a handshake on new connection', () => {
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      isAlive: true,
      readyState: 1,
      bufferedAmount: 0,
    };

    const connectionHandler = mockWssInstance.on.mock.calls.find(
      (call) => 'connection' === call[0]
    )[1];
    connectionHandler(mockSocket);

    expect(mockSocket.clientId).toBeDefined();
    expect(mockSocket.send).toHaveBeenCalled();
    const sentData = JSON.parse(mockSocket.send.mock.calls[0][0]);
    expect(sentData[0]).toBe(0);
    expect(sentData[1]).toBe(mockSocket.clientId);
  });

  it('should terminate zombie connections that fail Ping/Pong', () => {
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      isAlive: true,
      readyState: 1,
      bufferedAmount: 0,
    };

    const connectionHandler = mockWssInstance.on.mock.calls.find(
      (call) => 'connection' === call[0]
    )[1];
    connectionHandler(mockSocket);

    // First interval: set isAlive to false and send ping
    vi.advanceTimersByTime(30001);
    expect(mockSocket.ping).toHaveBeenCalled();
    expect(mockSocket.isAlive).toBe(false);

    // Second interval: if isAlive is still false, terminate
    vi.advanceTimersByTime(30001);
    expect(mockSocket.terminate).toHaveBeenCalled();
  });

  it('should terminate clients exceeding bufferedAmount threshold during broadcast', () => {
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      readyState: 1,
      bufferedAmount: 20000,
    };

    const connectionHandler = mockWssInstance.on.mock.calls.find(
      (call) => 'connection' === call[0]
    )[1];
    connectionHandler(mockSocket);

    // Reset calls to ignore the handshake send
    mockSocket.send.mockClear();

    networkManager.broadcast([100, 12345, []]);

    expect(mockSocket.terminate).toHaveBeenCalled();
    expect(mockSocket.send).not.toHaveBeenCalled();
  });
});
