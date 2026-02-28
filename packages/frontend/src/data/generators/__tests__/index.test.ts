import { describe, it, expect } from 'vitest';
import { generateCatalogData } from '../index';

describe('generateCatalogData', () => {
  const data = generateCatalogData();

  it('returns all 7 collections', () => {
    expect(Array.isArray(data.datasets)).toBe(true);
    expect(Array.isArray(data.dataSources)).toBe(true);
    expect(Array.isArray(data.lineage)).toBe(true);
    expect(Array.isArray(data.pipelines)).toBe(true);
    expect(Array.isArray(data.pipelineRuns)).toBe(true);
    expect(Array.isArray(data.qualityChecks)).toBe(true);
    expect(Array.isArray(data.costs)).toBe(true);
  });

  it('generates expected counts', () => {
    expect(data.datasets).toHaveLength(50);
    expect(data.dataSources).toHaveLength(20);
    expect(data.pipelines).toHaveLength(22);
    expect(data.qualityChecks).toHaveLength(100);
    expect(data.pipelineRuns.length).toBeGreaterThan(0);
    expect(data.lineage.length).toBeGreaterThan(0);
    expect(data.costs.length).toBeGreaterThan(0);
  });

  it('every dataset has at least one pipeline covering it', () => {
    const coveredIds = new Set<string>();
    for (const p of data.pipelines) {
      for (const id of p.inputDatasets) coveredIds.add(id);
      for (const id of p.outputDatasets) coveredIds.add(id);
    }
    for (const ds of data.datasets) {
      expect(coveredIds.has(ds.id)).toBe(true);
    }
  });

  it('pipeline runs reference existing pipelines', () => {
    const pipelineIds = new Set(data.pipelines.map((p) => p.id));
    for (const run of data.pipelineRuns) {
      expect(pipelineIds.has(run.pipelineId)).toBe(true);
    }
  });

  it('quality checks reference existing datasets', () => {
    const datasetIds = new Set(data.datasets.map((d) => d.id));
    for (const check of data.qualityChecks) {
      expect(datasetIds.has(check.datasetId)).toBe(true);
    }
  });

  it('every dataset has lineage data', () => {
    const coveredByLineage = new Set<string>();
    for (const node of data.lineage) {
      for (const id of node.datasetIds) coveredByLineage.add(id);
    }
    for (const ds of data.datasets) {
      expect(coveredByLineage.has(ds.id)).toBe(true);
    }
  });
});
