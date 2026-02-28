import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOnData = vi.fn();
const mockOnExit = vi.fn();
const mockWrite = vi.fn();
const mockResize = vi.fn();
const mockKill = vi.fn();

vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    onData: mockOnData,
    onExit: mockOnExit,
    write: mockWrite,
    resize: mockResize,
    kill: mockKill,
  })),
}));

import { PTYManager } from '../pty-manager.js';

describe('PTYManager', () => {
  let manager: PTYManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new PTYManager();
  });

  it('spawn() calls pty.spawn with a shell', async () => {
    const pty = await import('node-pty');
    manager.spawn(() => {}, () => {});
    expect(pty.spawn).toHaveBeenCalledTimes(1);
    const args = vi.mocked(pty.spawn).mock.calls[0];
    expect(typeof args[0]).toBe('string');
    expect(args[2]).toHaveProperty('cwd');
    expect(args[2]).toHaveProperty('cols', 80);
    expect(args[2]).toHaveProperty('rows', 30);
  });

  it('spawn() registers onData callback', () => {
    const onData = vi.fn();
    manager.spawn(onData, () => {});
    expect(mockOnData).toHaveBeenCalledTimes(1);
  });

  it('spawn() registers onExit callback', () => {
    const onExit = vi.fn();
    manager.spawn(() => {}, onExit);
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });

  it('write() forwards data to the pty process', () => {
    manager.spawn(() => {}, () => {});
    manager.write('hello');
    expect(mockWrite).toHaveBeenCalledWith('hello');
  });

  it('resize() calls pty.resize with cols/rows', () => {
    manager.spawn(() => {}, () => {});
    manager.resize({ cols: 120, rows: 40 });
    expect(mockResize).toHaveBeenCalledWith(120, 40);
  });

  it('kill() kills the pty process', () => {
    manager.spawn(() => {}, () => {});
    manager.kill();
    expect(mockKill).toHaveBeenCalledTimes(1);
  });

  it('write() is a no-op after kill()', () => {
    manager.spawn(() => {}, () => {});
    manager.kill();
    manager.write('data');
    expect(mockWrite).toHaveBeenCalledTimes(0);
  });

  it('resize() is a no-op after kill()', () => {
    manager.spawn(() => {}, () => {});
    manager.kill();
    manager.resize({ cols: 100, rows: 50 });
    expect(mockResize).toHaveBeenCalledTimes(0);
  });

  it('kill() after kill() is a no-op', () => {
    manager.spawn(() => {}, () => {});
    manager.kill();
    manager.kill();
    expect(mockKill).toHaveBeenCalledTimes(1);
  });
});
