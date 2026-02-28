import { describe, it, expect } from 'vitest';
import { generateDatasets } from '../datasets';

describe('generateDatasets', () => {
  const datasets = generateDatasets(50);

  it('generates the requested number of datasets', () => {
    expect(datasets).toHaveLength(50);
    expect(generateDatasets(5)).toHaveLength(5);
  });

  it('each dataset has a unique id', () => {
    const ids = datasets.map((d) => d.id);
    expect(new Set(ids).size).toBe(50);
  });

  it('each dataset has all required fields with correct types', () => {
    for (const ds of datasets) {
      expect(typeof ds.id).toBe('string');
      expect(typeof ds.name).toBe('string');
      expect(typeof ds.displayName).toBe('string');
      expect(['Table', 'View', 'Materialized View', 'External Table']).toContain(ds.type);
      expect(typeof ds.schema.database).toBe('string');
      expect(typeof ds.schema.schema).toBe('string');
      expect(typeof ds.description).toBe('string');
      expect(typeof ds.columns).toBe('number');
      expect(typeof ds.rows).toBe('number');
      expect(typeof ds.sizeBytes).toBe('number');
      expect(typeof ds.owner).toBe('string');
      expect(Array.isArray(ds.tags)).toBe(true);
      expect(typeof ds.qualityScore).toBe('number');
      expect(typeof ds.source).toBe('string');
      expect(ds.createdAt).toBeInstanceOf(Date);
    }
  });

  it('qualityScore matches qualityDashboard.healthScore', () => {
    for (const ds of datasets) {
      expect(ds.qualityScore).toBe(ds.qualityDashboard.healthScore);
    }
  });

  it('criticality is one of the valid values', () => {
    const valid = ['Critical', 'High', 'Medium', 'Low'];
    for (const ds of datasets) {
      expect(valid).toContain(ds.criticality);
    }
  });

  it('sampleData has 10 rows with consistent column keys', () => {
    for (const ds of datasets) {
      expect(ds.sampleData).toHaveLength(10);
      const keys = Object.keys(ds.sampleData[0]);
      expect(keys.length).toBeGreaterThan(0);
      for (const row of ds.sampleData) {
        expect(Object.keys(row)).toEqual(keys);
      }
    }
  });

  it('freshness.lastUpdated is a recent date', () => {
    const twoDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    for (const ds of datasets) {
      expect(ds.freshness.lastUpdated).toBeInstanceOf(Date);
      expect(ds.freshness.lastUpdated.getTime()).toBeGreaterThan(twoDaysAgo);
    }
  });

  it('qualityDashboard has valid structure', () => {
    for (const ds of datasets) {
      const qd = ds.qualityDashboard;
      expect(typeof qd.checksFailed).toBe('number');
      expect(typeof qd.checksWarned).toBe('number');
      expect(typeof qd.healthScore).toBe('number');
      expect(qd.healthScore).toBeGreaterThanOrEqual(0);
      expect(qd.healthScore).toBeLessThanOrEqual(100);
      expect(typeof qd.activeChecks).toBe('number');
      expect(typeof qd.avgAlertsPerDay).toBe('number');
      expect(qd.dailyChecks).toHaveLength(90);
      for (const day of qd.dailyChecks) {
        expect(typeof day.date).toBe('string');
        expect(typeof day.pass).toBe('number');
        expect(typeof day.warn).toBe('number');
        expect(typeof day.fail).toBe('number');
      }
    }
  });
});
