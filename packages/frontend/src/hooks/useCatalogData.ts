import { useEffect } from 'react';
import { useCatalogStore } from '../store/catalog-store';

export function useCatalogData() {
  const store = useCatalogStore();

  useEffect(() => {
    if (!store.initialized) {
      store.initialize();
    }
  }, [store.initialized, store]);

  return {
    datasets: store.datasets,
    dataSources: store.dataSources,
    lineage: store.lineage,
    pipelineRuns: store.pipelineRuns,
    qualityChecks: store.qualityChecks,
    costs: store.costs,
    regenerate: store.regenerate,
  };
}
