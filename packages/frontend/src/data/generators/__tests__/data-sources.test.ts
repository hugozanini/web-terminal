import { describe, it, expect } from 'vitest';
import { generateDataSources } from '../data-sources';

describe('generateDataSources', () => {
  const sources = generateDataSources(20);

  it('generates the requested number of sources', () => {
    expect(sources).toHaveLength(20);
    expect(generateDataSources(3)).toHaveLength(3);
  });

  it('each source has a unique id', () => {
    const ids = sources.map((s) => s.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('each source has all required fields', () => {
    for (const src of sources) {
      expect(typeof src.id).toBe('string');
      expect(typeof src.name).toBe('string');
      expect(['Database', 'API', 'File', 'Stream', 'IoT']).toContain(src.type);
      expect(typeof src.system).toBe('string');
      expect(typeof src.datasetsCount).toBe('number');
      expect(typeof src.owner).toBe('string');
      expect(typeof src.description).toBe('string');
    }
  });

  it('connectionStatus is one of the valid enum values', () => {
    const valid = ['Connected', 'Degraded', 'Disconnected'];
    for (const src of sources) {
      expect(valid).toContain(src.connectionStatus);
    }
  });

  it('lastSync is a recent date', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    for (const src of sources) {
      expect(src.lastSync).toBeInstanceOf(Date);
      expect(src.lastSync.getTime()).toBeGreaterThan(eightDaysAgo);
    }
  });
});
