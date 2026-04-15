import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { bridgeManager, handleMCPBridgeWebSocket } from '../bridge-handler.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockWs = EventEmitter & { send: ReturnType<typeof vi.fn>; readyState: number };

function createMockWs(readyState = 1): MockWs {
  const ws = new EventEmitter() as MockWs;
  ws.send = vi.fn();
  ws.readyState = readyState;
  return ws;
}

/** Reset the singleton between tests by nulling private fields directly. */
function resetBridge() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = bridgeManager as any;
  b.browserWs = null;
  b.pendingCalls = new Map();
}

// ---------------------------------------------------------------------------
// BridgeManager
// ---------------------------------------------------------------------------

describe('BridgeManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBridge();
  });

  // ---- isConnected --------------------------------------------------------

  describe('isConnected', () => {
    it('returns false when no browser is registered', () => {
      expect(bridgeManager.isConnected()).toBe(false);
    });

    it('returns true after registering an open WebSocket', () => {
      const ws = createMockWs(1);
      bridgeManager.register(ws);
      expect(bridgeManager.isConnected()).toBe(true);
    });

    it('returns false when the registered WebSocket is not open', () => {
      const ws = createMockWs(3); // CLOSED
      bridgeManager.register(ws);
      expect(bridgeManager.isConnected()).toBe(false);
    });

    it('returns false after the registered WebSocket closes', () => {
      const ws = createMockWs();
      bridgeManager.register(ws);
      ws.emit('close');
      expect(bridgeManager.isConnected()).toBe(false);
    });
  });

  // ---- register -----------------------------------------------------------

  describe('register', () => {
    it('emits a replacement warning when another connection is already open', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      bridgeManager.register(ws1);
      bridgeManager.register(ws2);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('replacing existing browser connection'),
      );
      spy.mockRestore();
    });

    it('rejects all pending calls when the registered WebSocket closes', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      // Start a pending call without awaiting it
      const pending = bridgeManager.callTool('search', {}).catch((e: Error) => e);
      ws.emit('close');

      const err = await pending;
      expect((err as Error).message).toContain('disconnected');
    });
  });

  // ---- callTool -----------------------------------------------------------

  describe('callTool', () => {
    it('throws immediately when no browser tab is connected', async () => {
      await expect(bridgeManager.callTool('any', {})).rejects.toThrow(
        'No browser tab connected',
      );
    });

    it('sends a tool_call message to the registered WebSocket', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      const resultPromise = bridgeManager.callTool('search_catalog', { q: 'farm' });

      expect(ws.send).toHaveBeenCalledTimes(1);
      const sent = JSON.parse(ws.send.mock.calls[0][0] as string);
      expect(sent.type).toBe('tool_call');
      expect(sent.name).toBe('search_catalog');
      expect(sent.args).toEqual({ q: 'farm' });
      expect(typeof sent.callId).toBe('string');

      // Resolve so the promise doesn't hang
      bridgeManager.handleToolResult({ type: 'tool_result', callId: sent.callId, result: 'ok' });
      await expect(resultPromise).resolves.toBe('ok');
    });

    it('resolves with the result when handleToolResult is called', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      const resultPromise = bridgeManager.callTool('view_dashboard', {});
      const { callId } = JSON.parse(ws.send.mock.calls[0][0] as string);

      bridgeManager.handleToolResult({ type: 'tool_result', callId, result: { tab: 'all' } });
      await expect(resultPromise).resolves.toEqual({ tab: 'all' });
    });

    it('rejects when the bridge disconnects during a pending call', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      const resultPromise = bridgeManager.callTool('slow_tool', {});
      ws.emit('close');

      await expect(resultPromise).rejects.toThrow('disconnected');
    });

    it('times out when no result arrives within the given period', async () => {
      vi.useFakeTimers();
      try {
        const ws = createMockWs();
        bridgeManager.register(ws);

        const resultPromise = bridgeManager.callTool('slow_tool', {}, 50);
        vi.advanceTimersByTime(100);
        await expect(resultPromise).rejects.toThrow('timed out');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ---- handleToolResult ---------------------------------------------------

  describe('handleToolResult', () => {
    it('resolves the matching pending call with the returned result', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      const resultPromise = bridgeManager.callTool('filter', {});
      const { callId } = JSON.parse(ws.send.mock.calls[0][0] as string);

      bridgeManager.handleToolResult({ type: 'tool_result', callId, result: 'data' });
      await expect(resultPromise).resolves.toBe('data');
    });

    it('rejects the matching pending call when error is set', async () => {
      const ws = createMockWs();
      bridgeManager.register(ws);

      const resultPromise = bridgeManager.callTool('filter', {});
      const { callId } = JSON.parse(ws.send.mock.calls[0][0] as string);

      bridgeManager.handleToolResult({ type: 'tool_result', callId, error: 'tool blew up' });
      await expect(resultPromise).rejects.toThrow('tool blew up');
    });

    it('ignores results with an unknown callId', () => {
      expect(() => {
        bridgeManager.handleToolResult({
          type: 'tool_result',
          callId: 'does-not-exist',
          result: 42,
        });
      }).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// handleMCPBridgeWebSocket
// ---------------------------------------------------------------------------

describe('handleMCPBridgeWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBridge();
  });

  it('sends a registered confirmation on receiving a register message', () => {
    const ws = createMockWs();
    handleMCPBridgeWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'register' })));
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'registered' }));
  });

  it('marks the bridge as connected after a register message', () => {
    const ws = createMockWs();
    handleMCPBridgeWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'register' })));
    expect(bridgeManager.isConnected()).toBe(true);
  });

  it('forwards tool_result messages to handleToolResult, resolving pending calls', async () => {
    const ws = createMockWs();
    handleMCPBridgeWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'register' })));

    // Start a pending tool call; the send mock now has two calls:
    // [0] = { type: 'registered' }   [1] = { type: 'tool_call', ... }
    const callPromise = bridgeManager.callTool('navigate', {});
    const sent = JSON.parse(ws.send.mock.calls[1][0] as string);

    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({ type: 'tool_result', callId: sent.callId, result: 'navigated' }),
      ),
    );

    await expect(callPromise).resolves.toBe('navigated');
  });

  it('handles malformed JSON without throwing', () => {
    const ws = createMockWs();
    handleMCPBridgeWebSocket(ws as never);
    expect(() => ws.emit('message', Buffer.from('not json'))).not.toThrow();
  });

  it('handles WebSocket error events without throwing', () => {
    const ws = createMockWs();
    handleMCPBridgeWebSocket(ws as never);
    expect(() => ws.emit('error', new Error('conn reset'))).not.toThrow();
  });
});
