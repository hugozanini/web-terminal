import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCatalogData } from '../useCatalogData';
import { useCatalogStore } from '../../store/catalog-store';

describe('useCatalogData', () => {
  beforeEach(() => {
    useCatalogStore.setState({
      datasets: [],
      dataSources: [],
      lineage: [],
      pipelines: [],
      pipelineRuns: [],
      qualityChecks: [],
      costs: [],
      initialized: false,
    });
  });

  it('auto-initializes the store on first call', async () => {
    const { result } = renderHook(() => useCatalogData());
    await waitFor(() => {
      expect(result.current.datasets.length).toBeGreaterThan(0);
    });
    expect(useCatalogStore.getState().initialized).toBe(true);
  });

  it('returns all expected data fields', async () => {
    const { result } = renderHook(() => useCatalogData());
    await waitFor(() => {
      expect(result.current.datasets.length).toBeGreaterThan(0);
    });
    expect(Array.isArray(result.current.datasets)).toBe(true);
    expect(Array.isArray(result.current.dataSources)).toBe(true);
    expect(Array.isArray(result.current.lineage)).toBe(true);
    expect(Array.isArray(result.current.pipelines)).toBe(true);
    expect(Array.isArray(result.current.pipelineRuns)).toBe(true);
    expect(Array.isArray(result.current.qualityChecks)).toBe(true);
    expect(Array.isArray(result.current.costs)).toBe(true);
  });

  it('returns action functions', async () => {
    const { result } = renderHook(() => useCatalogData());
    expect(typeof result.current.regenerate).toBe('function');
    expect(typeof result.current.addPipelineRun).toBe('function');
    expect(typeof result.current.updatePipelineRun).toBe('function');
    expect(typeof result.current.updatePipeline).toBe('function');
  });
});
