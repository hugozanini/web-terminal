import { describe, it, expect } from 'vitest';
import { generateQualityChecks } from '../quality-checks';
import { generateDatasets } from '../datasets';

describe('generateQualityChecks', () => {
  const datasets = generateDatasets(10);
  const checks = generateQualityChecks(100, datasets);
  const datasetIds = new Set(datasets.map((d) => d.id));

  it('generates the requested count', () => {
    expect(checks).toHaveLength(100);
  });

  it('each entry references a valid dataset ID', () => {
    for (const check of checks) {
      expect(datasetIds.has(check.datasetId)).toBe(true);
    }
  });

  it('result is one of Passed, Failed, Warning', () => {
    const valid = ['Passed', 'Failed', 'Warning'];
    for (const check of checks) {
      expect(valid).toContain(check.result);
    }
  });

  it('checkType is one of the valid types', () => {
    const valid = ['Freshness', 'Schema', 'Volume', 'Accuracy', 'Completeness'];
    for (const check of checks) {
      expect(valid).toContain(check.checkType);
    }
  });

  it('severity is consistent with result', () => {
    for (const check of checks) {
      if (check.result === 'Passed') {
        expect(check.severity).toBe('Info');
      } else if (check.result === 'Failed') {
        expect(['Error', 'Critical']).toContain(check.severity);
      }
    }
  });

  it('entries are sorted by timestamp descending', () => {
    for (let i = 1; i < checks.length; i++) {
      expect(new Date(checks[i - 1].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(checks[i].timestamp).getTime());
    }
  });

  it('each entry has required fields', () => {
    for (const check of checks) {
      expect(typeof check.id).toBe('string');
      expect(typeof check.message).toBe('string');
      expect(typeof check.rule).toBe('string');
      expect(typeof check.datasetName).toBe('string');
      expect(check.timestamp).toBeInstanceOf(Date);
      expect(typeof check.metadata.executionTimeMs).toBe('number');
    }
  });
});
