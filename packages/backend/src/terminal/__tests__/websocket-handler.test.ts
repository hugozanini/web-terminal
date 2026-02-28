import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

const mockSpawn = vi.fn();
const mockWrite = vi.fn();
const mockResize = vi.fn();
const mockKill = vi.fn();

vi.mock('../pty-manager.js', () => ({
  PTYManager: vi.fn().mockImplementation(() => ({
    spawn: mockSpawn,
    write: mockWrite,
    resize: mockResize,
    kill: mockKill,
  })),
}));

import { handleTerminalWebSocket } from '../websocket-handler.js';

function createMockWs() {
  const ws = new EventEmitter() as EventEmitter & {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  ws.send = vi.fn();
  ws.close = vi.fn();
  return ws;
}

describe('handleTerminalWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('spawns a PTY on connection', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('routes input messages to pty.write()', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'input', data: 'ls\n' })));
    expect(mockWrite).toHaveBeenCalledWith('ls\n');
  });

  it('routes resize messages to pty.resize()', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'resize', cols: 120, rows: 40 })));
    expect(mockResize).toHaveBeenCalledWith({ cols: 120, rows: 40 });
  });

  it('sends output messages back over WebSocket', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    const onDataCb = mockSpawn.mock.calls[0][0];
    onDataCb('some output');
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'output', data: 'some output' })
    );
  });

  it('sends exit message and closes WebSocket on PTY exit', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    const onExitCb = mockSpawn.mock.calls[0][1];
    onExitCb(0);
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'exit', code: 0 })
    );
    expect(ws.close).toHaveBeenCalled();
  });

  it('kills PTY on WebSocket close', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('close');
    expect(mockKill).toHaveBeenCalledTimes(1);
  });

  it('kills PTY on WebSocket error', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('error', new Error('test'));
    expect(mockKill).toHaveBeenCalledTimes(1);
  });

  it('handles malformed JSON gracefully', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    expect(() => {
      ws.emit('message', Buffer.from('not json'));
    }).not.toThrow();
  });

  it('ignores input messages without data', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'input' })));
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('ignores resize messages without cols/rows', () => {
    const ws = createMockWs();
    handleTerminalWebSocket(ws as never);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'resize' })));
    expect(mockResize).not.toHaveBeenCalled();
  });
});
