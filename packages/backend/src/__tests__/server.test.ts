import { describe, it, expect, afterAll, vi } from 'vitest';

vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    onData: vi.fn(),
    onExit: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  })),
}));

import request from 'supertest';
import { app, server, startServer } from '../index.js';

afterAll(() => {
  server.close();
});

describe('Express server', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      message: 'Happy Coffee Backend Server',
    });
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /health returns JSON content type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toContain('application/json');
  });
});

describe('startServer', () => {
  it('resolves once the HTTP server begins listening', async () => {
    // Swap out the real listen with one that fires the callback immediately
    // so the test stays synchronous and does not bind a real port.
    const listenSpy = vi
      .spyOn(server, 'listen')
      .mockImplementation((_port: unknown, cb?: unknown) => {
        if (typeof cb === 'function') cb();
        return server;
      });

    await expect(startServer()).resolves.toBeUndefined();
    listenSpy.mockRestore();
  });
});

describe('WebSocket upgrade routing', () => {
  it('destroys the socket for unknown upgrade paths', () => {
    const socket = { destroy: vi.fn() };
    const request = { url: '/unknown-path', headers: { host: 'localhost:3001' } };
    server.emit('upgrade', request, socket, Buffer.alloc(0));
    expect(socket.destroy).toHaveBeenCalledTimes(1);
  });
});
