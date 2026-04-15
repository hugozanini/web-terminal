import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bridge-handler before importing mcp-server so callTool is controllable.
vi.mock('../bridge-handler.js', () => ({
  bridgeManager: {
    callTool: vi.fn(),
  },
}));

import { handleSSEConnection, handleMCPMessage } from '../mcp-server.js';
import { bridgeManager } from '../bridge-handler.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSSERes() {
  return {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
  };
}

function createSSEReq() {
  const listeners: Record<string, () => void> = {};
  return {
    get: vi.fn().mockReturnValue('localhost:3001'),
    protocol: 'http' as const,
    on: vi.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    _trigger: (event: string) => listeners[event]?.(),
  };
}

function createMsgRes() {
  const res = {
    status: vi.fn().mockReturnThis() as ReturnType<typeof vi.fn>,
    end: vi.fn(),
    json: vi.fn(),
  };
  return res;
}

/** Calls handleSSEConnection, returns { sessionId, req, res }. */
function openSession() {
  const req = createSSEReq();
  const res = createSSERes();
  handleSSEConnection(req as never, res as never);

  // Extract session ID from the endpoint event line
  const endpointWrite = (res.write.mock.calls as string[][]).find((c) =>
    c[0].includes('event: endpoint'),
  );
  const match = endpointWrite?.[0].match(/sessionId=([^\\n\r\s]+)/);
  const sessionId = match?.[1] ?? '';

  return { sessionId, req, res };
}

/** Calls handleMCPMessage with a JSON-RPC body for a given session. */
async function sendMessage(
  sessionId: string,
  body: Record<string, unknown>,
) {
  const req = { query: { sessionId }, body } as never;
  const res = createMsgRes();
  await handleMCPMessage(req, res as never);
  return { req, res };
}

// ---------------------------------------------------------------------------
// handleSSEConnection
// ---------------------------------------------------------------------------

describe('handleSSEConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets Content-Type, Cache-Control and Connection headers', () => {
    const { res } = openSession();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('calls flushHeaders to push headers before the first write', () => {
    const { res } = openSession();
    expect(res.flushHeaders).toHaveBeenCalledTimes(1);
  });

  it('writes an endpoint event containing the session ID', () => {
    const { sessionId, res } = openSession();
    expect(sessionId).toBeTruthy();
    const endpointWrite = (res.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: endpoint'),
    );
    expect(endpointWrite).toBeDefined();
    expect(endpointWrite![0]).toContain(sessionId);
    expect(endpointWrite![0]).toContain('/mcp/messages');
  });

  it('removes the session when the request closes', async () => {
    const { sessionId, req } = openSession();

    // Trigger close — session should be removed, so a subsequent message returns 404
    req._trigger('close');

    const msgRes = createMsgRes();
    await handleMCPMessage(
      { query: { sessionId }, body: { method: 'tools/list', id: 1 } } as never,
      msgRes as never,
    );
    expect(msgRes.status).toHaveBeenCalledWith(404);
  });
});

// ---------------------------------------------------------------------------
// handleMCPMessage
// ---------------------------------------------------------------------------

describe('handleMCPMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 for an unknown or expired session ID', async () => {
    const { res } = await sendMessage('no-such-session', { method: 'tools/list', id: 1 });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('acknowledges every valid request with HTTP 202', async () => {
    const { sessionId, res: sseRes } = openSession();
    const { res } = await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      id: 1,
    });
    expect(res.status).toHaveBeenCalledWith(202);
    // No SSE response for a notification
    const calls = (sseRes.write.mock.calls as string[][]).filter((c) =>
      c[0].includes('event: message'),
    );
    expect(calls.length).toBe(0);
  });

  it('responds to initialize with server info and capabilities', async () => {
    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, { jsonrpc: '2.0', method: 'initialize', id: 1 });

    const messageWrite = (sseRes.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: message'),
    );
    expect(messageWrite).toBeDefined();
    const payload = JSON.parse(messageWrite![0].replace(/^event: message\ndata: /, ''));
    expect(payload.result.protocolVersion).toBe('2024-11-05');
    expect(payload.result.serverInfo.name).toBe('data-portal');
    expect(payload.result.capabilities).toHaveProperty('tools');
    expect(payload.id).toBe(1);
  });

  it('responds to tools/list with the full tool manifest', async () => {
    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, { jsonrpc: '2.0', method: 'tools/list', id: 2 });

    const messageWrite = (sseRes.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: message'),
    );
    const payload = JSON.parse(messageWrite![0].replace(/^event: message\ndata: /, ''));
    expect(Array.isArray(payload.result.tools)).toBe(true);
    expect(payload.result.tools.length).toBeGreaterThan(0);

    const names = payload.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('search_global_catalog');
    expect(names).toContain('trigger_pipeline_execution');
    expect(names).toContain('analyze_infrastructure_costs');
    expect(payload.id).toBe(2);
  });

  it('does not send an SSE response for notifications/initialized', async () => {
    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    const messageWrites = (sseRes.write.mock.calls as string[][]).filter((c) =>
      c[0].includes('event: message'),
    );
    expect(messageWrites.length).toBe(0);
  });

  it('forwards tools/call to bridgeManager and returns the result', async () => {
    const mockResult = { content: [{ type: 'text', text: 'Navigated to home' }] };
    vi.mocked(bridgeManager.callTool).mockResolvedValue(mockResult);

    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'view_home_dashboard', arguments: { tab: 'all' } },
      id: 3,
    });

    expect(bridgeManager.callTool).toHaveBeenCalledWith(
      'view_home_dashboard',
      { tab: 'all' },
    );
    const messageWrite = (sseRes.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: message'),
    );
    const payload = JSON.parse(messageWrite![0].replace(/^event: message\ndata: /, ''));
    expect(payload.result).toEqual(mockResult);
    expect(payload.id).toBe(3);
  });

  it('returns a JSON-RPC error when bridgeManager.callTool throws', async () => {
    vi.mocked(bridgeManager.callTool).mockRejectedValue(
      new Error('No browser tab connected'),
    );

    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'search_global_catalog', arguments: { query: 'farm' } },
      id: 4,
    });

    const messageWrite = (sseRes.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: message'),
    );
    const payload = JSON.parse(messageWrite![0].replace(/^event: message\ndata: /, ''));
    expect(payload.error).toBeDefined();
    expect(payload.error.code).toBe(-32603);
    expect(payload.error.message).toContain('No browser tab connected');
    expect(payload.id).toBe(4);
  });

  it('returns method-not-found for unknown methods that have an id', async () => {
    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'unknown/method',
      id: 5,
    });

    const messageWrite = (sseRes.write.mock.calls as string[][]).find((c) =>
      c[0].includes('event: message'),
    );
    const payload = JSON.parse(messageWrite![0].replace(/^event: message\ndata: /, ''));
    expect(payload.error.code).toBe(-32601);
    expect(payload.error.message).toContain('unknown/method');
    expect(payload.id).toBe(5);
  });

  it('sends no response for unknown methods without an id', async () => {
    const { sessionId, res: sseRes } = openSession();
    await sendMessage(sessionId, {
      jsonrpc: '2.0',
      method: 'unknown/notification',
      // no id
    });
    const messageWrites = (sseRes.write.mock.calls as string[][]).filter((c) =>
      c[0].includes('event: message'),
    );
    expect(messageWrites.length).toBe(0);
  });
});
