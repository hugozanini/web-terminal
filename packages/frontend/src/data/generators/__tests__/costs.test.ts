import { describe, it, expect } from 'vitest';
import { generateCosts } from '../costs';
import { generateDatasets } from '../datasets';
import { generateDataSources } from '../data-sources';
import { generatePipelines } from '../pipeline-runs';

describe('generateCosts', () => {
  const datasets = generateDatasets(10);
  const dataSources = generateDataSources(5);
  const datasetIds = datasets.map((d) => d.id);
  const pipelines = generatePipelines(datasetIds);
  const costs = generateCosts(80, datasets, pipelines, dataSources);

  it('generates per-dataset entries plus generic entries', () => {
    expect(costs.length).toBeGreaterThan(80);
  });

  it('every dataset has at least 6 cost entries', () => {
    for (const ds of datasets) {
      const dsCosts = costs.filter((c) => c.entityId === ds.id && c.entityType === 'Dataset');
      expect(dsCosts.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('every pipeline has at least 4 cost entries', () => {
    for (const p of pipelines) {
      const pCosts = costs.filter((c) => c.entityId === p.id && c.entityType === 'Pipeline');
      expect(pCosts.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('categories are valid', () => {
    const valid = ['Storage', 'Compute', 'Query', 'Transfer', 'Licensing', 'Infrastructure'];
    for (const cost of costs) {
      expect(valid).toContain(cost.category);
    }
  });

  it('entityType is valid', () => {
    const valid = ['Dataset', 'Pipeline', 'Source'];
    for (const cost of costs) {
      expect(valid).toContain(cost.entityType);
    }
  });

  it('dates are within the last 90 days', () => {
    const ninetyDaysAgo = Date.now() - 91 * 24 * 60 * 60 * 1000;
    for (const cost of costs) {
      expect(new Date(cost.date).getTime()).toBeGreaterThan(ninetyDaysAgo);
    }
  });

  it('each entry has required fields', () => {
    for (const cost of costs) {
      expect(typeof cost.id).toBe('string');
      expect(typeof cost.subcategory).toBe('string');
      expect(typeof cost.amount).toBe('number');
      expect(cost.amount).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
      expect(typeof cost.description).toBe('string');
    }
  });

  it('entries are sorted by date descending', () => {
    for (let i = 1; i < costs.length; i++) {
      expect(new Date(costs[i - 1].date).getTime())
        .toBeGreaterThanOrEqual(new Date(costs[i].date).getTime());
    }
  });
});
