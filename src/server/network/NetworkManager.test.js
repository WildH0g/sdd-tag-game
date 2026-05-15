import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkManager } from './NetworkManager.js';
import { WebSocketServer } from 'ws';

// Mock ws correctly using a class
vi.mock('ws', () => {
  return {
    WebSocketServer: vi.fn(),
  };
});

describe('NetworkManager (3.1 - Competitive Protocol)', () => {
  let networkManager;
  let mockWssInstance;

  beforeEach(() => {
    vi.useFakeTimers();

    mockWssInstance = {
      on: vi.fn(),
      close: vi.fn(),
      clients: new Set(),
    };

    WebSocketServer.mockImplementation(function () {
      return mockWssInstance;
    });

    networkManager = new NetworkManager({
      port: 8080,
    });

    networkManager.start();
  });

  afterEach(() => {
    networkManager.shutdown();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should broadcast a Type 2 "Tag Event" with the correct 5-element schema', () => {
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      readyState: 1,
      bufferedAmount: 0,
    };

    const connectionHandler = mockWssInstance.on.mock.calls.find(
      (call) => 'connection' === call[0]
    )[1];
    connectionHandler(mockSocket);

    // Schema: [Type, Hunter_ID, Prey_ID, New_It_ID, Timestamp]
    const tagEvent = [2, 'hunter-1', 'prey-1', 'prey-1', 12345.67];

    networkManager.broadcast(tagEvent);

    const sentData = JSON.parse(mockSocket.send.mock.calls[1][0]); // call 0 was handshake
    expect(sentData[0]).toBe(2);
    expect(sentData.length).toBe(5);
    expect(sentData[1]).toBe('hunter-1');
  });

  it('should broadcast an expanded Type 1 snapshot with 6-element player records', () => {
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      readyState: 1,
      bufferedAmount: 0,
    };

    const connectionHandler = mockWssInstance.on.mock.calls.find(
      (call) => 'connection' === call[0]
    )[1];
    connectionHandler(mockSocket);

    // Schema: [Seq, Time, [[ID, X, Y, Seq, Role, Score], ...]]
    const snapshot = [100, 5000, [['p1', 400, 300, 10, 1, 15]]];

    networkManager.broadcast(snapshot);

    const sentData = JSON.parse(mockSocket.send.mock.calls[1][0]);
    expect(sentData[2][0].length).toBe(6);
    expect(sentData[2][0][4]).toBe(1); // Role
    expect(sentData[2][0][5]).toBe(15); // Score
  });
});
