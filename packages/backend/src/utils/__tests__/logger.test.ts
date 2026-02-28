import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger.js';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('info() calls console.log with [INFO] prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('[INFO] test message');
  });

  it('error() calls console.error with [ERROR] prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('error message');
    expect(spy).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('warn() calls console.warn with [WARN] prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warning message');
    expect(spy).toHaveBeenCalledWith('[WARN] warning message');
  });

  it('info() passes extra args to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('[INFO] test', { key: 'value' });
  });

  it('error() passes extra args to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test', 42);
    expect(spy).toHaveBeenCalledWith('[ERROR] test', 42);
  });
});
