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
import { app, server } from '../index.js';

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
